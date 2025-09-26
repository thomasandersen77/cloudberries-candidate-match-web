package no.cloudberries.candidatematch.service.consultants

import no.cloudberries.candidatematch.domain.consultant.*
import no.cloudberries.candidatematch.infrastructure.repositories.ConsultantRepository
import no.cloudberries.candidatematch.infrastructure.repositories.consultant.*
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.TestPropertySource
import org.springframework.transaction.annotation.Transactional
import java.time.Year
import java.time.YearMonth
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

@SpringBootTest
@TestPropertySource(locations = ["classpath:application-test.properties"])
@Transactional
class ConsultantPersistenceServiceIntegrationTest {

    @Autowired
    private lateinit var consultantPersistenceService: ConsultantPersistenceService

    @Autowired
    private lateinit var consultantRepository: ConsultantRepository

    @Autowired
    private lateinit var consultantCvRepository: ConsultantCvRepository

    @Autowired
    private lateinit var cvKeyQualificationRepository: CvKeyQualificationRepository

    @Autowired
    private lateinit var cvEducationRepository: CvEducationRepository

    @Autowired
    private lateinit var cvSkillCategoryRepository: CvSkillCategoryRepository

    @Autowired
    private lateinit var cvSkillInCategoryRepository: CvSkillInCategoryRepository

    @Test
    fun `upsertConsultantWithCv should create new consultant when not exists`() {
        // Arrange
        val consultant = createTestConsultant("newUser", "New User", "cv1")

        // Act
        val result = consultantPersistenceService.upsertConsultantWithCv(consultant)

        // Assert
        assertEquals(UpsertOperation.CREATED, result.operation)
        assertEquals("newUser", result.consultant.userId)
        assertEquals("New User", result.consultant.name)
        assertEquals("cv1", result.consultant.cvId)

        // Verify consultant was created in database
        val savedConsultant = consultantRepository.findByUserId("newUser")
        assertNotNull(savedConsultant)
        assertEquals("New User", savedConsultant.name)

        // Verify CV data was saved
        val cvs = consultantCvRepository.findByConsultantId(savedConsultant.id!!)
        assertEquals(1, cvs.size)
        assertEquals("cv1", cvs[0].versionTag)
        assertTrue(cvs[0].active)

        // Verify CV details were saved
        val qualifications = cvKeyQualificationRepository.findByCvIdIn(listOf(cvs[0].id!!))
        assertEquals(2, qualifications.size)

        val educations = cvEducationRepository.findByCvIdIn(listOf(cvs[0].id!!))
        assertEquals(1, educations.size)

        val skillCategories = cvSkillCategoryRepository.findByCvIdIn(listOf(cvs[0].id!!))
        assertEquals(1, skillCategories.size)

        val skillsInCategory = cvSkillInCategoryRepository.findBySkillCategoryIdIn(skillCategories.map { it.id!! })
        assertEquals(2, skillsInCategory.size)
    }

    @Test
    fun `upsertConsultantWithCv should update existing consultant when exists`() {
        // Arrange - Create initial consultant
        val initialConsultant = createTestConsultant("existingUser", "Original Name", "cv1")
        val initialResult = consultantPersistenceService.upsertConsultantWithCv(initialConsultant)
        assertEquals(UpsertOperation.CREATED, initialResult.operation)

        // Get initial counts
        val initialCvs = consultantCvRepository.findByConsultantId(initialResult.consultant.id!!)
        val initialCvIds = initialCvs.map { it.id!! }
        val initialQualifications = cvKeyQualificationRepository.findByCvIdIn(initialCvIds)
        val initialEducations = cvEducationRepository.findByCvIdIn(initialCvIds)

        // Act - Update the same consultant
        val updatedConsultant = createTestConsultant("existingUser", "Updated Name", "cv2")
        updatedConsultant.cv.keyQualifications = listOf(
            KeyQualification("Updated Qualification", "Updated description")
        )
        updatedConsultant.cv.educations = listOf(
            Education("Updated Degree", "Updated School", TimePeriod(YearMonth.of(2022, 1), YearMonth.of(2024, 12)))
        )

        val result = consultantPersistenceService.upsertConsultantWithCv(updatedConsultant)

        // Assert
        assertEquals(UpsertOperation.UPDATED, result.operation)
        assertEquals("existingUser", result.consultant.userId)
        assertEquals("Updated Name", result.consultant.name)
        assertEquals("cv2", result.consultant.cvId)

        // Verify consultant was updated (same ID)
        assertEquals(initialResult.consultant.id, result.consultant.id)

        // Verify old CV data was cleared and new data was added
        val newCvs = consultantCvRepository.findByConsultantId(result.consultant.id!!)
        assertEquals(1, newCvs.size)
        assertEquals("cv2", newCvs[0].versionTag)

        // Verify new CV details
        val newCvIds = newCvs.map { it.id!! }
        val newQualifications = cvKeyQualificationRepository.findByCvIdIn(newCvIds)
        assertEquals(1, newQualifications.size)
        assertEquals("Updated Qualification", newQualifications[0].label)

        val newEducations = cvEducationRepository.findByCvIdIn(newCvIds)
        assertEquals(1, newEducations.size)
        assertEquals("Updated Degree", newEducations[0].degree)

        // Verify total consultant count remains 1
        val totalConsultants = consultantRepository.count()
        assertEquals(1, totalConsultants)
    }

    @Test
    fun `upsertConsultantWithCv should handle multiple consultants correctly - simulating 118 scenario`() {
        // Arrange - Create initial consultants (simulating existing consultants)
        val existingConsultants = (1..60).map { i ->
            val consultant = createTestConsultant("existing$i", "Existing User $i", "cv$i")
            consultantPersistenceService.upsertConsultantWithCv(consultant)
        }

        // Verify initial state
        assertEquals(60, consultantRepository.count())

        // Act - Now update existing and create new consultants (total 118)
        val allResults = mutableListOf<ConsultantPersistenceService.UpsertResult>()

        // Update existing 60 consultants
        (1..60).forEach { i ->
            val updatedConsultant = createTestConsultant("existing$i", "Updated User $i", "newCv$i")
            updatedConsultant.cv.qualityScore = 85 + i
            val result = consultantPersistenceService.upsertConsultantWithCv(updatedConsultant)
            allResults.add(result)
        }

        // Create 58 new consultants (60 + 58 = 118)
        (61..118).forEach { i ->
            val newConsultant = createTestConsultant("new$i", "New User $i", "cv$i")
            val result = consultantPersistenceService.upsertConsultantWithCv(newConsultant)
            allResults.add(result)
        }

        // Assert - This verifies the main rule: database count matches Flowcase count
        assertEquals(118, consultantRepository.count(), "Database should contain exactly 118 consultants")

        // Verify operation counts
        val createdCount = allResults.count { it.operation == UpsertOperation.CREATED }
        val updatedCount = allResults.count { it.operation == UpsertOperation.UPDATED }
        
        assertEquals(58, createdCount, "Should have created 58 new consultants")
        assertEquals(60, updatedCount, "Should have updated 60 existing consultants")
        assertEquals(118, createdCount + updatedCount, "Total operations should be 118")

        // Verify updated consultants have new data
        (1..60).forEach { i ->
            val consultant = consultantRepository.findByUserId("existing$i")
            assertNotNull(consultant)
            assertEquals("Updated User $i", consultant.name)
            assertEquals("newCv$i", consultant.cvId)

            val cvs = consultantCvRepository.findByConsultantId(consultant.id!!)
            assertEquals(1, cvs.size, "Should have exactly 1 CV after update")
            assertEquals("newCv$i", cvs[0].versionTag)
            assertEquals(85 + i, cvs[0].qualityScore)
        }

        // Verify new consultants exist
        (61..118).forEach { i ->
            val consultant = consultantRepository.findByUserId("new$i")
            assertNotNull(consultant)
            assertEquals("New User $i", consultant.name)
        }
    }

    @Test
    fun `clearExistingCvData should remove all CV data for consultant`() {
        // Arrange - Create consultant with rich CV data
        val consultant = createTestConsultant("testUser", "Test User", "cv1")
        val result = consultantPersistenceService.upsertConsultantWithCv(consultant)

        // Verify initial data exists
        val initialCvs = consultantCvRepository.findByConsultantId(result.consultant.id!!)
        val initialCvIds = initialCvs.map { it.id!! }
        assertTrue(cvKeyQualificationRepository.findByCvIdIn(initialCvIds).isNotEmpty())
        assertTrue(cvEducationRepository.findByCvIdIn(initialCvIds).isNotEmpty())
        assertTrue(cvSkillCategoryRepository.findByCvIdIn(initialCvIds).isNotEmpty())

        // Act - Update consultant (which should clear old data)
        val updatedConsultant = createTestConsultant("testUser", "Updated Test User", "cv2")
        updatedConsultant.cv.keyQualifications = emptyList() // No qualifications in new CV
        updatedConsultant.cv.educations = emptyList() // No educations in new CV
        
        consultantPersistenceService.upsertConsultantWithCv(updatedConsultant)

        // Assert - Old CV data should be gone, new data should be minimal
        val newCvs = consultantCvRepository.findByConsultantId(result.consultant.id!!)
        assertEquals(1, newCvs.size)
        assertEquals("cv2", newCvs[0].versionTag)

        val newCvIds = newCvs.map { it.id!! }
        assertEquals(0, cvKeyQualificationRepository.findByCvIdIn(newCvIds).size)
        assertEquals(0, cvEducationRepository.findByCvIdIn(newCvIds).size)
        
        // Consultant count should remain 1
        assertEquals(1, consultantRepository.count())
    }

    private fun createTestConsultant(userId: String, name: String, cvId: String): Consultant {
        val keyQualifications = listOf(
            KeyQualification("Leadership", "Strong leadership skills"),
            KeyQualification("Technical", "Deep technical knowledge")
        )

        val educations = listOf(
            Education("Master of Science", "University of Technology", TimePeriod(YearMonth.of(2018, 8), YearMonth.of(2020, 6)))
        )

        val skillCategory = SkillCategory(
            name = "Programming Languages",
            skills = listOf(
                Skill("Kotlin", 5),
                Skill("Java", 7)
            )
        )

        val cv = Cv(
            id = cvId,
            keyQualifications = keyQualifications,
            educations = educations,
            workExperiences = emptyList(),
            projectExperiences = emptyList(),
            certifications = emptyList(),
            courses = emptyList(),
            languages = emptyList(),
            skillCategories = listOf(skillCategory),
            qualityScore = null
        )

        return Consultant(
            userId = userId,
            name = name,
            cv = cv
        )
    }
}