package no.cloudberries.candidatematch.controllers.chat

import mu.KotlinLogging
import no.cloudberries.candidatematch.domain.ai.AIProvider
import no.cloudberries.candidatematch.domain.ai.AIResponse
import no.cloudberries.candidatematch.service.ai.AIAnalysisService
import no.cloudberries.candidatematch.utils.Timed
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/chatbot")
class AIController(
    private val aiAnalysisService: AIAnalysisService
) {
    private val logger = KotlinLogging.logger { }

    @PostMapping("/analyze")
    @Timed
    fun analyzeContent(
        @RequestBody request: AIAnalysisRequest,
    ): AIResponse {
        logger.info { "POST /api/chatbot/analyze content.len=${request.content.length}" }

        return aiAnalysisService.analyzeContent(
            request.content,
            AIProvider.GEMINI
        )
    }
}

data class AIAnalysisRequest(
    val content: String
)