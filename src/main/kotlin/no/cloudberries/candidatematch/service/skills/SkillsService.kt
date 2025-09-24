package no.cloudberries.candidatematch.service.skills

import mu.KotlinLogging
import no.cloudberries.candidatematch.dto.consultants.ConsultantSummaryDto
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class SkillsService(
    private val consultantReader: ConsultantSkillReader,
    private val projectSkillFetcher: ProjectSkillFetcher = ProjectSkillFetcher.Noop,
) {
    private val logger = KotlinLogging.logger { }

    data class SkillAggregate(
        val name: String,
        val konsulenter: List<ConsultantSummaryDto>,
    )

    @Transactional(readOnly = true)
    fun listSkills(skillFilters: List<String>?): List<SkillAggregate> {
        val normalizedFilters = skillFilters
            ?.map { it.trim().uppercase() }
            ?.filter { it.isNotBlank() }
            ?.toSet()
            ?: emptySet()

        val rowsFromEnum = if (normalizedFilters.isEmpty()) {
            consultantReader.findAllSkillAggregates()
        } else {
            // Map filter strings to enum values; ignore invalid entries
            val skillEnums = normalizedFilters.mapNotNull {
                runCatching { no.cloudberries.candidatematch.domain.candidate.Skill.valueOf(it) }.getOrNull()
            }
            if (skillEnums.isEmpty()) emptyList() else consultantReader.findSkillAggregates(skillEnums)
        }

        val rowsFromProjects = projectSkillFetcher.fetch(normalizedFilters)
        val rows = (rowsFromEnum + rowsFromProjects)

        val grouped = rows.groupBy { it.skillName.trim().uppercase() }
        val aggregates = grouped.toSortedMap().map { (skill, groupRows) ->
            val consultants = groupRows
                .map { r ->
                    // Email and birthYear are not available from the lightweight row; set safe defaults
                    ConsultantSummaryDto(
                        userId = r.userId,
                        name = r.name,
                        email = "",
                        bornYear = 0,
                        defaultCvId = r.defaultCvId
                    )
                }
                .distinctBy { it.userId }
                .sortedBy { it.name.lowercase() }
            SkillAggregate(
                name = skill,
                konsulenter = consultants,
            )
        }

        val filterCount = normalizedFilters.size
        logger.info { "Computed ${aggregates.size} skill aggregates using ${filterCount} filters (project skills included)" }
        return aggregates
    }
}

interface ProjectSkillFetcher {
    fun fetch(normalizedFilters: Set<String>): List<SkillAggregateRow>

    object Noop : ProjectSkillFetcher {
        override fun fetch(normalizedFilters: Set<String>): List<SkillAggregateRow> = emptyList()
    }
}
