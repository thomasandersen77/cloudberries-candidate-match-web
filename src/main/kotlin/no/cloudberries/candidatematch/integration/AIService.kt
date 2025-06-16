package no.cloudberries.candidatematch.integration

import no.cloudberries.candidatematch.domain.AIResponse
import no.cloudberries.candidatematch.domain.CandidateMatchResponse
import no.cloudberries.candidatematch.domain.ProjectRequest
import no.cloudberries.candidatematch.domain.customer.Customer

interface AIService {
    fun matchCandidate(resume: String, customerRequest:String, consultantName: String): CandidateMatchResponse

    //fun suggestResumeImprovements(resume: String, projectRequest: ProjectRequest): AIResponse
}