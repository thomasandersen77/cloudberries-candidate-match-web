package no.cloudberries.candidatematch.controllers.projectrequest

import no.cloudberries.candidatematch.domain.ProjectRequest
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
        val projectRequest = analysisService.analyzeAndStore(
            pdfStream = file.inputStream,
            originalFilename = file.originalFilename
        )
        return projectRequest.toDto()
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
    val requiredSkills: List<String>,
    val startDate: String,
    val endDate: String,
    val responseDeadline: String,
    val status: String,
    val requestDescription: String,
    val responsibleSalespersonEmail: String,
)

fun ProjectRequest.toDto(): ProjectRequestResponseDto {
    return ProjectRequestResponseDto(
        id = this.id?.value ?: -1,
        customerName = this.customerName,
        requiredSkills = this.requiredSkills.map { it.name },
        startDate = this.startDate.toString(),
        endDate = this.endDate.toString(),
        responseDeadline = this.responseDeadline.toString(),
        status = this.status.name,
        requestDescription = this.requestDescription,
        responsibleSalespersonEmail = this.responsibleSalespersonEmail,
    )
}
