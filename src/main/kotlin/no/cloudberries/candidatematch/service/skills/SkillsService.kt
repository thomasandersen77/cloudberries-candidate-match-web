package no.cloudberries.candidatematch.service.skills

import mu.KotlinLogging
import no.cloudberries.candidatematch.domain.candidate.SkillService
import no.cloudberries.candidatematch.dto.consultants.ConsultantSummaryDto
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class SkillsService(
    private val skillService: SkillService,
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
            ?.map { it.trim() }
            ?.filter { it.isNotBlank() }
        
        // Use domain service for skill aggregation
        val domainAggregates = skillService.aggregateSkillsAcrossConsultants(normalizedFilters)
        
        // Convert domain aggregates to service DTOs
        val aggregates = domainAggregates.map { domainAggregate ->
            val consultants = domainAggregate.consultants.map { consultantSkillInfo ->
                ConsultantSummaryDto(
                    userId = consultantSkillInfo.userId,
                    name = consultantSkillInfo.name,
                    email = "", // Not available in skill aggregate
                    bornYear = 0, // Not available in skill aggregate
                    defaultCvId = consultantSkillInfo.cvId
                )
            }.distinctBy { it.userId }
                .sortedBy { it.name.lowercase() }
            
            SkillAggregate(
                name = domainAggregate.skillName,
                konsulenter = consultants
            )
        }
        
        val filterCount = normalizedFilters?.size ?: 0
        logger.info { "Computed ${aggregates.size} skill aggregates using ${filterCount} filters" }
        return aggregates
    }
}

interface ProjectSkillFetcher {
    fun fetch(normalizedFilters: Set<String>): List<SkillAggregateRow>

    object Noop : ProjectSkillFetcher {
        override fun fetch(normalizedFilters: Set<String>): List<SkillAggregateRow> = emptyList()
    }
}
