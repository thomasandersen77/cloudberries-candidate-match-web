package no.cloudberries.candidatematch.service

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import no.cloudberries.candidatematch.domain.CandidateMatchResponse
import no.cloudberries.candidatematch.integration.openai.OpenAIHttpClient
import no.cloudberries.candidatematch.templates.MatchParams
import no.cloudberries.candidatematch.templates.MatchPromptTemplate
import no.cloudberries.candidatematch.templates.renderTemplate
import org.springframework.stereotype.Service

@Service
class OpenAIService(
    val openAIHttpClient: OpenAIHttpClient
) : AIService {

     private val mapper = jacksonObjectMapper()

    override fun matchCandidate(cv: String, request: String, consultantName: String): CandidateMatchResponse {
        val prompt = renderTemplate(
            MatchPromptTemplate.template,
            MatchParams(
                cv = cv,
                request = request,
                consultantName = consultantName
            )
        )

        val response = openAIHttpClient.callAssistant(userMessage = prompt)
        return mapper.readValue<CandidateMatchResponse>(content = response)
    }
}