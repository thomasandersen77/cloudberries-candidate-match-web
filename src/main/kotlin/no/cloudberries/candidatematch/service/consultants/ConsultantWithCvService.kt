package no.cloudberries.candidatematch.service.consultants

import no.cloudberries.candidatematch.controllers.consultants.*
import no.cloudberries.candidatematch.domain.candidate.SkillService
import no.cloudberries.candidatematch.infrastructure.repositories.ConsultantRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service

/**
 * Simplified service that orchestrates consultant CV operations.
 * Follows SRP by delegating specific concerns to focused services.
 */
@Service
class ConsultantWithCvService(
    private val consultantRepository: ConsultantRepository,
    private val cvDataAggregationService: CvDataAggregationService,
    private val skillService: SkillService
) {

    fun getAllConsultantsWithCvs(onlyActiveCv: Boolean = false): List<ConsultantWithCvDto> {
        val consultantFlats = consultantRepository.findAllFlat()
        if (consultantFlats.isEmpty()) return emptyList()
        
        return buildConsultantDtos(consultantFlats, onlyActiveCv)
    }

    fun getConsultantsWithCvsPaged(pageable: Pageable, onlyActiveCv: Boolean = false): Page<ConsultantWithCvDto> {
        val page = consultantRepository.findAllFlat(pageable)
        if (page.isEmpty) {
            return PageImpl(emptyList(), pageable, 0)
        }
        
        val dtos = buildConsultantDtos(page.content, onlyActiveCv)
        return PageImpl(dtos, pageable, page.totalElements)
    }

    private fun buildConsultantDtos(
        consultantFlats: List<no.cloudberries.candidatematch.infrastructure.repositories.ConsultantFlatView>,
        onlyActiveCv: Boolean
    ): List<ConsultantWithCvDto> {
        val consultantIds = consultantFlats.map { it.getId() }
        
        // Delegate CV aggregation to specialized service
        val cvDataByConsultant = cvDataAggregationService.aggregateCvData(consultantIds, onlyActiveCv)
        
        // Load consultant skills using domain service
        val skillsByConsultant = consultantIds.associateWith { consultantId ->
            skillService.getConsultantSkills(consultantId).map { it.name }
        }
        
        return consultantFlats.map { consultant ->
            ConsultantWithCvDto(
                id = consultant.getId(),
                userId = consultant.getUserId(),
                name = consultant.getName(),
                cvId = consultant.getCvId(),
                skills = skillsByConsultant[consultant.getId()] ?: emptyList(),
                cvs = cvDataByConsultant[consultant.getId()] ?: emptyList()
            )
        }
    }
}
