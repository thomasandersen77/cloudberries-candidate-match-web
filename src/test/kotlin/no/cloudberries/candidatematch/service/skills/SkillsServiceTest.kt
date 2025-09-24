package no.cloudberries.candidatematch.service.skills

import io.mockk.every
import io.mockk.mockk
import no.cloudberries.candidatematch.domain.candidate.Skill
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

class SkillsServiceTest {

    private val reader: ConsultantSkillReader = mockk()
    private val skillsService = SkillsService(reader)

    @Test
    fun `aggregates consultants per skill and sorts names`() {
        every { reader.findAllSkillAggregates() } returns listOf(
            SkillAggregateRow("JAVA", "u1", "Alice", "cv1"),
            SkillAggregateRow("JAVA", "u2", "Bob", "cv2"),
            SkillAggregateRow("KOTLIN", "u1", "Alice", "cv1"),
            SkillAggregateRow("REACT", "u3", "Charlie", "cv3"),
        )

        val result = skillsService.listSkills(null)

        // Expect three skill aggregates: JAVA (2), KOTLIN (1), REACT (1)
        val javaAgg = result.first { it.name == "JAVA" }
        assertEquals(2, javaAgg.konsulenter.size)
        assertEquals(listOf("Alice", "Bob"), javaAgg.konsulenter.map { it.name })

        val kotlinAgg = result.first { it.name == "KOTLIN" }
        assertEquals(1, kotlinAgg.konsulenter.size)
        assertEquals("Alice", kotlinAgg.konsulenter.first().name)

        val reactAgg = result.first { it.name == "REACT" }
        assertEquals(1, reactAgg.konsulenter.size)
        assertEquals("Charlie", reactAgg.konsulenter.first().name)
    }

    @Test
    fun `filters by provided skills`() {
        every { reader.findSkillAggregates(listOf(Skill.JAVA)) } returns listOf(
            SkillAggregateRow("JAVA", "u1", "Alice", "cv1")
        )

        val result = skillsService.listSkills(listOf("java"))
        assertEquals(1, result.size)
        assertEquals("JAVA", result.first().name)
        assertEquals(1, result.first().konsulenter.size)
    }
}
