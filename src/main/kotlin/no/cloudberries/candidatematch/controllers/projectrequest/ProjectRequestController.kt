package no.cloudberries.candidatematch.controllers.projectrequest

import no.cloudberries.candidatematch.infrastructure.entities.projectrequest.CustomerProjectRequestEntity
import no.cloudberries.candidatematch.infrastructure.entities.projectrequest.ProjectRequestRequirementEntity
import no.cloudberries.candidatematch.infrastructure.entities.projectrequest.RequirementPriority
import no.cloudberries.candidatematch.service.projectrequest.ProjectRequestAnalysisService
import org.springframework.http.MediaType
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile

@RestController
@RequestMapping("/api/project-requests")
class ProjectRequestController(
    private val analysisService: ProjectRequestAnalysisService
) {

    @PostMapping(
        path = ["/upload"],
        consumes = [MediaType.MULTIPART_FORM_DATA_VALUE]
    )
    fun uploadAndAnalyze(
        @RequestPart("file") file: MultipartFile
    ): ProjectRequestResponseDto {
        val agg = analysisService.analyzeAndStore(
            pdfStream = file.inputStream,
            originalFilename = file.originalFilename
        )
        return agg.toDto()
    }

    @GetMapping("/{id}")
    fun getById(@PathVariable id: Long): ProjectRequestResponseDto? =
        analysisService.getById(id)?.toDto()

    @GetMapping
    fun listAll(): List<ProjectRequestResponseDto> =
        analysisService.listAll().map { it.toDto() }
}

// DTOs and mappers

data class ProjectRequestResponseDto(
    val id: Long,
    val customerName: String?,
    val title: String?,
    val summary: String?,
    val mustRequirements: List<ProjectRequirementDto>,
    val shouldRequirements: List<ProjectRequirementDto>,
    val originalFilename: String?,
)

data class ProjectRequirementDto(
    val name: String,
    val details: String?
)

private fun ProjectRequestAnalysisService.Aggregate.toDto(): ProjectRequestResponseDto {
    val must = this.requirements
        .filter { it.priority == RequirementPriority.MUST }
        .map { it.toDto() }
    val should = this.requirements
        .filter { it.priority == RequirementPriority.SHOULD }
        .map { it.toDto() }
    return ProjectRequestResponseDto(
        id = this.request.id ?: -1,
        customerName = this.request.customerName,
        title = this.request.title,
        summary = this.request.summary,
        mustRequirements = must,
        shouldRequirements = should,
        originalFilename = this.request.originalFilename,
    )
}

private fun ProjectRequestRequirementEntity.toDto(): ProjectRequirementDto =
    ProjectRequirementDto(name = this.name, details = this.details)
