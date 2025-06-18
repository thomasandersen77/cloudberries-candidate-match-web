package no.cloudberries.candidatematch.integration.gemini

import com.google.genai.Client
import com.google.genai.types.GenerateContentResponse
import no.cloudberries.candidatematch.integration.openai.OpenAIConfig
import org.springframework.stereotype.Service

@Service
class GeminiHttpClient(
    val geminiConfig: GeminiConfig
) {

    fun test() {

        // The client gets the API key from the environment variable `GOOGLE_API_KEY`.
        val client: Client = Client()

        val response: GenerateContentResponse? =
            client.models.generateContent(
                "gemini-2.0-flash",
                "Explain how AI works in a few words",
                null
            )
    }
}

