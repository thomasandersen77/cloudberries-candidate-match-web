package no.cloudberries.candidatematch.service.projectrequest

import mu.KotlinLogging
import no.cloudberries.candidatematch.domain.ProjectRequest
import no.cloudberries.candidatematch.domain.toEntity
import no.cloudberries.candidatematch.infrastructure.entities.toProjectRequest
import no.cloudberries.candidatematch.infrastructure.repositories.ProjectRequestRepository
import no.cloudberries.candidatematch.utils.PdfUtils
import no.cloudberries.candidatematch.utils.Timed
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.io.InputStream
import java.time.LocalDateTime

@Service
class ProjectRequestAnalysisService(
    private val projectRequestRepository: ProjectRequestRepository,
) {
    private val logger = KotlinLogging.logger {}

    @Timed
    @Transactional
    fun analyzeAndStore(
        pdfStream: InputStream,
        originalFilename: String? = null,
    ): ProjectRequest {
        val text = PdfUtils.extractText(pdfStream)
        val now = LocalDateTime.now()

        val saved = projectRequestRepository.save(
            ProjectRequest(
                id = null,
                customerId = null,
                customerName = "Imported",
                requiredSkills = emptyList(),
                startDate = now,
                endDate = now.plusDays(30),
                responseDeadline = now.plusDays(7),
                aISuggestions = emptyList(),
                requestDescription = text,
                responsibleSalespersonEmail = "unknown@example.com",
            ).toEntity()
        )
        logger.info { "Stored customer project request id=${saved.id}" }
        return saved.toProjectRequest()
    }

    fun getById(id: Long): ProjectRequest? =
        projectRequestRepository.findById(id).orElse(null)?.toProjectRequest()

    fun listAll(): List<ProjectRequest> =
        projectRequestRepository.findAll().map { it.toProjectRequest() }
}
