package no.cloudberries.candidatematch.service.skills

import com.fasterxml.jackson.databind.ObjectMapper
import no.cloudberries.candidatematch.controllers.consultants.*
import no.cloudberries.candidatematch.domain.consultant.*
import no.cloudberries.candidatematch.infrastructure.adapters.toEntity
import no.cloudberries.candidatematch.infrastructure.entities.ConsultantEntity
import no.cloudberries.candidatematch.infrastructure.entities.consultant.CvKeyQualificationEntity
import no.cloudberries.candidatematch.infrastructure.repositories.ConsultantRepository
import no.cloudberries.candidatematch.service.consultants.ConsultantPersistenceService
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ContextConfiguration

@SpringBootTest
@ContextConfiguration(classes = [LiquibaseTestConfig::class])
@org.springframework.test.context.ActiveProfiles("test")
class SkillsServiceIntegrationTest @Autowired constructor(
    private val consultantRepo: ConsultantRepository,
    private val persistService: ConsultantPersistenceService,
    private val skillsService: SkillsService,
) {
    @Test
    fun `project skills should appear in skills aggregation`() {
        // Persist a minimal consultant with a CV having a project skill not in enum
        val cv = Cv(
            id = "cv-1",
            keyQualifications = emptyList(),
            workExperiences = emptyList(),
            projectExperiences = listOf(
                ProjectExperience(
                    customer = "Acme",
                    description = "",
                    longDescription = "",
                    period = TimePeriod(null, null),
                    roles = emptyList(),
                    skillsUsed = listOf(
                        no.cloudberries.candidatematch.domain.consultant.Skill(name = "Azure Pipelines", durationInYears = 2)
                    )
                )
            ),
            educations = emptyList(),
            certifications = emptyList(),
            courses = emptyList(),
            languages = emptyList(),
            skillCategories = emptyList(),
            qualityScore = null,
        )
        val consultant = Consultant.builder(id = "user-1", defaultCvId = cv.id)
            .withPersonalInfo(PersonalInfo(name = "Alice", email = "a@x.y", birthYear = null))
            .withCv(cv)
            .withCvAsJson(ObjectMapper().createObjectNode().put("cvId", cv.id).toString())
            .withSkills(emptyList())
            .build()

        persistService.persistConsultantWithCv(consultant)

        val result = skillsService.listSkills(listOf("Azure Pipelines"))
        assertTrue(result.any { it.name == "AZURE PIPELINES" && it.konsulenter.any { c -> c.name == "Alice" } })
    }
}
