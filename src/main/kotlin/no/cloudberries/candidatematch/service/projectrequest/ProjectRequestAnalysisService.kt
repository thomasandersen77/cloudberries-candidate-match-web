package no.cloudberries.candidatematch.service.projectrequest

import mu.KotlinLogging
import no.cloudberries.candidatematch.infrastructure.entities.projectrequest.CustomerProjectRequestEntity
import no.cloudberries.candidatematch.infrastructure.entities.projectrequest.ProjectRequestRequirementEntity
import no.cloudberries.candidatematch.infrastructure.entities.projectrequest.RequirementPriority
import no.cloudberries.candidatematch.infrastructure.repositories.projectrequest.CustomerProjectRequestRepository
import no.cloudberries.candidatematch.utils.PdfUtils
import no.cloudberries.candidatematch.utils.Timed
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.io.InputStream

@Service
class ProjectRequestAnalysisService(
    private val customerProjectRequestRepository: CustomerProjectRequestRepository,
) {
    private val logger = KotlinLogging.logger {}

    data class Aggregate(
        val request: CustomerProjectRequestEntity,
        val requirements: List<ProjectRequestRequirementEntity>
    )

    @Timed
    @Transactional
    fun analyzeAndStore(
        pdfStream: InputStream,
        originalFilename: String? = null,
    ): Aggregate {
        val text = PdfUtils.extractText(pdfStream)
        val title = text.lineSequence().firstOrNull { it.isNotBlank() }?.take(120)
        val summary = text.take(500)

        val entity = CustomerProjectRequestEntity(
            customerName = null,
            title = title,
            summary = summary,
            originalFilename = originalFilename,
            originalText = text,
        )
        val saved = customerProjectRequestRepository.save(entity)
        logger.info { "Stored customer project request id=${saved.id}" }

        // TODO: Optionally parse requirements via AI; for now, keep empty lists
        val reqs: List<ProjectRequestRequirementEntity> = emptyList()
        return Aggregate(saved, reqs)
    }

    fun getById(id: Long): Aggregate? =
        customerProjectRequestRepository.findWithRequirementsById(id)?.let { Aggregate(it, it.requirements) }

    fun listAll(): List<Aggregate> =
        customerProjectRequestRepository.findAllBy().map { Aggregate(it, it.requirements) }
}
