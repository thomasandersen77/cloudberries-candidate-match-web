package no.cloudberries.candidatematch.service

import no.cloudberries.candidatematch.domain.CandidateMatchResponse

interface AIService {
    fun matchCandidate(resume: String, customerRequest:String, consultantName: String): CandidateMatchResponse

    //fun suggestResumeImprovements(resume: String, projectRequest: ProjectRequest): AIResponse
}