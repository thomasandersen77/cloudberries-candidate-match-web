package no.cloudberries.candidatematch.integration.openai

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.context.annotation.Configuration

@Configuration
@ConfigurationProperties(prefix = "openai")
class OpenAIConfig {
    lateinit var apiKey: String
    var model: String = "gpt-4"
}