package no.cloudberries.candidatematch.service.consultants

import io.mockk.*
import no.cloudberries.candidatematch.domain.consultant.Consultant
import no.cloudberries.candidatematch.domain.consultant.ConsultantAdapter
import no.cloudberries.candidatematch.domain.consultant.Cv
import no.cloudberries.candidatematch.infrastructure.entities.ConsultantEntity
import no.cloudberries.candidatematch.infrastructure.entities.consultant.ConsultantCvEntity
import no.cloudberries.candidatematch.infrastructure.integration.flowcase.FlowcaseHttpClient
import no.cloudberries.candidatematch.infrastructure.integration.flowcase.FlowcaseUsersDto
import no.cloudberries.candidatematch.infrastructure.integration.flowcase.FlowcaseUserDTO
import no.cloudberries.candidatematch.infrastructure.repositories.ConsultantRepository
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class SyncConsultantServiceTest {

    private val flowcaseHttpClient = mockk<FlowcaseHttpClient>()
    private val consultantAdapter = mockk<ConsultantAdapter>()
    private val persistenceService = mockk<ConsultantPersistenceService>()
    private val consultantRepository = mockk<ConsultantRepository>()

    private lateinit var syncConsultantService: SyncConsultantService

    @BeforeEach
    fun setup() {
        clearAllMocks()
        syncConsultantService = SyncConsultantService(
            flowcaseHttpClient = flowcaseHttpClient,
            consultantAdapter = consultantAdapter,
            persistenceService = persistenceService
        )
    }

    @Test
    fun `syncAll should create new consultants when they don't exist in database`() {
        // Arrange
        val flowcaseUsers = listOf(
            FlowcaseUserDTO("user1", "User One", "cv1"),
            FlowcaseUserDTO("user2", "User Two", "cv2")
        )
        
        val consultant1 = createMockConsultant("user1", "User One", "cv1")
        val consultant2 = createMockConsultant("user2", "User Two", "cv2")
        
        val upsertResult1 = ConsultantPersistenceService.UpsertResult(
            consultant = ConsultantEntity(id = 1L, userId = "user1", name = "User One", cvId = "cv1"),
            cvHeader = ConsultantCvEntity(id = 1L, consultantId = 1L, versionTag = "cv1", qualityScore = null, active = true),
            operation = UpsertOperation.CREATED
        )
        
        val upsertResult2 = ConsultantPersistenceService.UpsertResult(
            consultant = ConsultantEntity(id = 2L, userId = "user2", name = "User Two", cvId = "cv2"),
            cvHeader = ConsultantCvEntity(id = 2L, consultantId = 2L, versionTag = "cv2", qualityScore = null, active = true),
            operation = UpsertOperation.CREATED
        )

        every { flowcaseHttpClient.fetchAllUsers() } returns FlowcaseUsersDto(flowcaseUsers)
        every { consultantAdapter.fetchConsultant("user1") } returns consultant1
        every { consultantAdapter.fetchConsultant("user2") } returns consultant2
        every { persistenceService.upsertConsultantWithCv(consultant1) } returns upsertResult1
        every { persistenceService.upsertConsultantWithCv(consultant2) } returns upsertResult2

        // Act
        val result = syncConsultantService.syncAll()

        // Assert
        assertEquals(2, result.total)
        assertEquals(2, result.succeeded)
        assertEquals(0, result.failed)
        assertEquals(2, result.created)
        assertEquals(0, result.updated)
        
        verify(exactly = 1) { flowcaseHttpClient.fetchAllUsers() }
        verify(exactly = 1) { consultantAdapter.fetchConsultant("user1") }
        verify(exactly = 1) { consultantAdapter.fetchConsultant("user2") }
        verify(exactly = 1) { persistenceService.upsertConsultantWithCv(consultant1) }
        verify(exactly = 1) { persistenceService.upsertConsultantWithCv(consultant2) }
    }

    @Test
    fun `syncAll should update existing consultants when they exist in database`() {
        // Arrange
        val flowcaseUsers = listOf(
            FlowcaseUserDTO("existing1", "Updated Name One", "newCv1"),
            FlowcaseUserDTO("existing2", "Updated Name Two", "newCv2")
        )
        
        val consultant1 = createMockConsultant("existing1", "Updated Name One", "newCv1")
        val consultant2 = createMockConsultant("existing2", "Updated Name Two", "newCv2")
        
        val upsertResult1 = ConsultantPersistenceService.UpsertResult(
            consultant = ConsultantEntity(id = 10L, userId = "existing1", name = "Updated Name One", cvId = "newCv1"),
            cvHeader = ConsultantCvEntity(id = 10L, consultantId = 10L, versionTag = "newCv1", qualityScore = 85, active = true),
            operation = UpsertOperation.UPDATED
        )
        
        val upsertResult2 = ConsultantPersistenceService.UpsertResult(
            consultant = ConsultantEntity(id = 20L, userId = "existing2", name = "Updated Name Two", cvId = "newCv2"),
            cvHeader = ConsultantCvEntity(id = 20L, consultantId = 20L, versionTag = "newCv2", qualityScore = 90, active = true),
            operation = UpsertOperation.UPDATED
        )

        every { flowcaseHttpClient.fetchAllUsers() } returns FlowcaseUsersDto(flowcaseUsers)
        every { consultantAdapter.fetchConsultant("existing1") } returns consultant1
        every { consultantAdapter.fetchConsultant("existing2") } returns consultant2
        every { persistenceService.upsertConsultantWithCv(consultant1) } returns upsertResult1
        every { persistenceService.upsertConsultantWithCv(consultant2) } returns upsertResult2

        // Act
        val result = syncConsultantService.syncAll()

        // Assert
        assertEquals(2, result.total)
        assertEquals(2, result.succeeded)
        assertEquals(0, result.failed)
        assertEquals(0, result.created)
        assertEquals(2, result.updated)
        
        verify(exactly = 1) { flowcaseHttpClient.fetchAllUsers() }
        verify(exactly = 1) { consultantAdapter.fetchConsultant("existing1") }
        verify(exactly = 1) { consultantAdapter.fetchConsultant("existing2") }
        verify(exactly = 1) { persistenceService.upsertConsultantWithCv(consultant1) }
        verify(exactly = 1) { persistenceService.upsertConsultantWithCv(consultant2) }
    }

    @Test
    fun `syncAll should handle mixed create and update operations`() {
        // Arrange - dette er den viktige testen som bekrefter regelen
        val flowcaseUsers = listOf(
            FlowcaseUserDTO("newUser", "New User", "cv1"),
            FlowcaseUserDTO("existingUser", "Updated Existing", "cv2")
        )
        
        val newConsultant = createMockConsultant("newUser", "New User", "cv1")
        val existingConsultant = createMockConsultant("existingUser", "Updated Existing", "cv2")
        
        val createResult = ConsultantPersistenceService.UpsertResult(
            consultant = ConsultantEntity(id = 1L, userId = "newUser", name = "New User", cvId = "cv1"),
            cvHeader = ConsultantCvEntity(id = 1L, consultantId = 1L, versionTag = "cv1", qualityScore = null, active = true),
            operation = UpsertOperation.CREATED
        )
        
        val updateResult = ConsultantPersistenceService.UpsertResult(
            consultant = ConsultantEntity(id = 10L, userId = "existingUser", name = "Updated Existing", cvId = "cv2"),
            cvHeader = ConsultantCvEntity(id = 10L, consultantId = 10L, versionTag = "cv2", qualityScore = 88, active = true),
            operation = UpsertOperation.UPDATED
        )

        every { flowcaseHttpClient.fetchAllUsers() } returns FlowcaseUsersDto(flowcaseUsers)
        every { consultantAdapter.fetchConsultant("newUser") } returns newConsultant
        every { consultantAdapter.fetchConsultant("existingUser") } returns existingConsultant
        every { persistenceService.upsertConsultantWithCv(newConsultant) } returns createResult
        every { persistenceService.upsertConsultantWithCv(existingConsultant) } returns updateResult

        // Act
        val result = syncConsultantService.syncAll()

        // Assert - Dette bekrefter regelen: antall konsulenter i Flowcase = antall i database
        assertEquals(2, result.total)
        assertEquals(2, result.succeeded)
        assertEquals(0, result.failed)
        assertEquals(1, result.created)  // 1 ny konsulent opprettet
        assertEquals(1, result.updated)  // 1 eksisterende konsulent oppdatert
        
        // Verifiser at begge operasjoner ble utført
        verify(exactly = 1) { persistenceService.upsertConsultantWithCv(newConsultant) }
        verify(exactly = 1) { persistenceService.upsertConsultantWithCv(existingConsultant) }
    }

    @Test
    fun `syncOne should create new consultant when not exists`() {
        // Arrange
        val consultant = createMockConsultant("newUser", "New User", "cv1")
        val upsertResult = ConsultantPersistenceService.UpsertResult(
            consultant = ConsultantEntity(id = 1L, userId = "newUser", name = "New User", cvId = "cv1"),
            cvHeader = ConsultantCvEntity(id = 1L, consultantId = 1L, versionTag = "cv1", qualityScore = null, active = true),
            operation = UpsertOperation.CREATED
        )

        every { consultantAdapter.fetchConsultant("newUser") } returns consultant
        every { persistenceService.upsertConsultantWithCv(consultant) } returns upsertResult

        // Act
        val result = syncConsultantService.syncOne("newUser")

        // Assert
        assertEquals(1, result.total)
        assertEquals(1, result.succeeded)
        assertEquals(0, result.failed)
        assertEquals(1, result.created)
        assertEquals(0, result.updated)
    }

    @Test
    fun `syncOne should update existing consultant`() {
        // Arrange
        val consultant = createMockConsultant("existingUser", "Updated Name", "newCv")
        val upsertResult = ConsultantPersistenceService.UpsertResult(
            consultant = ConsultantEntity(id = 10L, userId = "existingUser", name = "Updated Name", cvId = "newCv"),
            cvHeader = ConsultantCvEntity(id = 10L, consultantId = 10L, versionTag = "newCv", qualityScore = 95, active = true),
            operation = UpsertOperation.UPDATED
        )

        every { consultantAdapter.fetchConsultant("existingUser") } returns consultant
        every { persistenceService.upsertConsultantWithCv(consultant) } returns upsertResult

        // Act
        val result = syncConsultantService.syncOne("existingUser")

        // Assert
        assertEquals(1, result.total)
        assertEquals(1, result.succeeded)
        assertEquals(0, result.failed)
        assertEquals(0, result.created)
        assertEquals(1, result.updated)
    }

    @Test
    fun `syncAll should handle failures gracefully`() {
        // Arrange
        val flowcaseUsers = listOf(
            FlowcaseUserDTO("user1", "User One", "cv1"),
            FlowcaseUserDTO("failUser", "Fail User", "cv2")
        )
        
        val consultant1 = createMockConsultant("user1", "User One", "cv1")
        val upsertResult1 = ConsultantPersistenceService.UpsertResult(
            consultant = ConsultantEntity(id = 1L, userId = "user1", name = "User One", cvId = "cv1"),
            cvHeader = ConsultantCvEntity(id = 1L, consultantId = 1L, versionTag = "cv1", qualityScore = null, active = true),
            operation = UpsertOperation.CREATED
        )

        every { flowcaseHttpClient.fetchAllUsers() } returns FlowcaseUsersDto(flowcaseUsers)
        every { consultantAdapter.fetchConsultant("user1") } returns consultant1
        every { consultantAdapter.fetchConsultant("failUser") } throws RuntimeException("API Error")
        every { persistenceService.upsertConsultantWithCv(consultant1) } returns upsertResult1

        // Act
        val result = syncConsultantService.syncAll()

        // Assert
        assertEquals(2, result.total)
        assertEquals(1, result.succeeded)
        assertEquals(1, result.failed)
        assertEquals(1, result.created)
        assertEquals(0, result.updated)
    }

    @Test
    fun `syncAll should handle 118 consultants correctly - ensuring database matches Flowcase count`() {
        // Arrange - Dette er hovedtesten som bekrefter regelen
        val flowcaseUsers = (1..118).map { i ->
            FlowcaseUserDTO("user$i", "User $i", "cv$i")
        }
        
        val consultants = flowcaseUsers.map { user ->
            createMockConsultant(user.userId, user.name, user.cvId)
        }
        
        val upsertResults = consultants.mapIndexed { index, consultant ->
            // Simuler at noen eksisterer (oppdateres) og andre er nye (opprettes)
            val operation = if (index < 60) UpsertOperation.UPDATED else UpsertOperation.CREATED
            ConsultantPersistenceService.UpsertResult(
                consultant = ConsultantEntity(id = (index + 1).toLong(), userId = consultant.userId, name = consultant.name, cvId = consultant.cv.id),
                cvHeader = ConsultantCvEntity(id = (index + 1).toLong(), consultantId = (index + 1).toLong(), versionTag = consultant.cv.id, qualityScore = null, active = true),
                operation = operation
            )
        }

        every { flowcaseHttpClient.fetchAllUsers() } returns FlowcaseUsersDto(flowcaseUsers)
        consultants.forEachIndexed { index, consultant ->
            every { consultantAdapter.fetchConsultant(consultant.userId) } returns consultant
            every { persistenceService.upsertConsultantWithCv(consultant) } returns upsertResults[index]
        }

        // Act
        val result = syncConsultantService.syncAll()

        // Assert - Dette bekrefter hovedregelen
        assertEquals(118, result.total, "Total antall skal matche Flowcase")
        assertEquals(118, result.succeeded, "Alle skal være vellykket")
        assertEquals(0, result.failed, "Ingen skal feile")
        assertEquals(58, result.created, "58 nye konsulenter opprettet")
        assertEquals(60, result.updated, "60 eksisterende konsulenter oppdatert")
        
        // Verifiser at alle consultants ble behandlet
        consultants.forEach { consultant ->
            verify(exactly = 1) { persistenceService.upsertConsultantWithCv(consultant) }
        }
    }

    private fun createMockConsultant(userId: String, name: String, cvId: String): Consultant {
        val cv = mockk<Cv>()
        every { cv.id } returns cvId
        every { cv.keyQualifications } returns emptyList()
        every { cv.educations } returns emptyList()
        every { cv.workExperiences } returns emptyList()
        every { cv.projectExperiences } returns emptyList()
        every { cv.certifications } returns emptyList()
        every { cv.courses } returns emptyList()
        every { cv.languages } returns emptyList()
        every { cv.skillCategories } returns emptyList()
        every { cv.qualityScore } returns null
        
        val consultant = mockk<Consultant>()
        every { consultant.userId } returns userId
        every { consultant.name } returns name
        every { consultant.cv } returns cv
        
        return consultant
    }
}