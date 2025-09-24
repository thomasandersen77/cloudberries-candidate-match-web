package no.cloudberries.candidatematch.controllers.projectrequest

import no.cloudberries.candidatematch.infrastructure.entities.projectrequest.ProjectRequestRequirementEntity
import no.cloudberries.candidatematch.infrastructure.entities.projectrequest.RequirementPriority
import no.cloudberries.candidatematch.service.projectrequest.ProjectRequestAnalysisService

fun ProjectRequestAnalysisService.Aggregate.toDto(): ProjectRequestResponseDto {
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

fun ProjectRequestRequirementEntity.toDto(): ProjectRequirementDto =
    ProjectRequirementDto(name = this.name, details = this.details)