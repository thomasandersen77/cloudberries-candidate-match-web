package no.cloudberries.candidatematch.controllers.consultants

import no.cloudberries.candidatematch.service.consultants.ConsultantReadService
import no.cloudberries.candidatematch.service.consultants.ConsultantSearchService
import no.cloudberries.candidatematch.service.consultants.EmbeddingProviderInfo
import no.cloudberries.candidatematch.domain.consultant.RelationalSearchCriteria
import no.cloudberries.candidatematch.domain.consultant.SemanticSearchCriteria
import no.cloudberries.candidatematch.dto.consultants.ConsultantSummaryDto
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

// Only read operations from Flowcase via service. No create/update.

@RestController
@RequestMapping("/api/consultants")
class ConsultantController(
    private val consultantReadService: ConsultantReadService,
    private val consultantSearchService: ConsultantSearchService,
) {

    @GetMapping
    fun list(
        @RequestParam(required = false) name: String?,
        @PageableDefault(size = 10) pageable: Pageable
    ): Page<ConsultantSummaryDto> {
        return consultantReadService.listConsultants(
            name,
            pageable
        )
    }
    
    /**
     * Relational search for consultants based on structured criteria
     */
    @PostMapping("/search")
    fun searchRelational(
        @RequestBody request: RelationalSearchRequest,
        @PageableDefault(size = 10) pageable: Pageable
    ): ResponseEntity<Page<ConsultantWithCvDto>> {
        return try {
            val criteria = RelationalSearchCriteria(
                name = request.name,
                skillsAll = request.skillsAll,
                skillsAny = request.skillsAny,
                minQualityScore = request.minQualityScore,
                onlyActiveCv = request.onlyActiveCv
            )
            val result = consultantSearchService.searchRelational(criteria, pageable)
            ResponseEntity.ok(result)
        } catch (e: IllegalArgumentException) {
            ResponseEntity.badRequest().build()
        } catch (e: Exception) {
            ResponseEntity.internalServerError().build()
        }
    }
    
    /**
     * Semantic search for consultants using natural language
     */
    @PostMapping("/search/semantic")
    fun searchSemantic(
        @RequestBody request: SemanticSearchRequest,
        @PageableDefault(size = 10) pageable: Pageable
    ): ResponseEntity<Page<ConsultantWithCvDto>> {
        return try {
            val criteria = SemanticSearchCriteria(
                text = request.text,
                provider = request.provider,
                model = request.model,
                topK = request.topK,
                minQualityScore = request.minQualityScore,
                onlyActiveCv = request.onlyActiveCv
            )
            val result = consultantSearchService.searchSemantic(criteria, pageable)
            ResponseEntity.ok(result)
        } catch (e: IllegalArgumentException) {
            ResponseEntity.badRequest().build()
        } catch (e: IllegalStateException) {
            ResponseEntity.status(503).build()
        } catch (e: Exception) {
            ResponseEntity.internalServerError().build()
        }
    }
    
    /**
     * Gets information about the available embedding provider
     */
    @GetMapping("/search/embedding-info")
    fun getEmbeddingInfo(): EmbeddingProviderInfo {
        return consultantSearchService.getEmbeddingProviderInfo()
    }
}

/**
 * Request DTO for relational search
 */
data class RelationalSearchRequest(
    val name: String? = null,
    val skillsAll: List<String> = emptyList(),
    val skillsAny: List<String> = emptyList(),
    val minQualityScore: Int? = null,
    val onlyActiveCv: Boolean = false
)

/**
 * Request DTO for semantic search
 */
data class SemanticSearchRequest(
    val text: String,
    val provider: String = "GOOGLE_GEMINI",
    val model: String = "text-embedding-004",
    val topK: Int = 10,
    val minQualityScore: Int? = null,
    val onlyActiveCv: Boolean = false
)
