package no.cloudberries.candidatematch.integration.config

import org.springframework.boot.context.properties.ConfigurationPropertiesScan
import org.springframework.context.annotation.Configuration

@Configuration
@ConfigurationPropertiesScan
class EnvConfig {
    init {
        Dotenv.load()
    }
}