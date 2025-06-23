package no.cloudberries.candidatematch.integration.openai

import no.cloudberries.candidatematch.service.OpenAIService
import no.cloudberries.candidatematch.utils.PdfUtils
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import java.io.File
import java.io.FileInputStream

@SpringBootTest
class OpenAIServiceIntegrationTest {
    @Autowired
    lateinit var openAIService: OpenAIService

    @Test
    fun matchCandidate() {
        val response = openAIService.matchCandidate(
            cv = PdfUtils.extractText(FileInputStream(File("src/test/resources/Thomas-Andersen_CV.pdf"))),
            request = PdfUtils.extractText(FileInputStream(File("src/test/resources/politiet/forespørsel_fra_polititet.pdf"))),
            consultantName = "Thomas Andersen"
        )

        println("--- Candidate Match Response ---")
        println(
            """"          
        Score:     ${response.totalScore}
        Summary:   ${response.summary}
        """.trimIndent()
        )

        println("--- Matching Details ---")
        response.requirements.forEach { requirement ->

            println(
                """
               requirement: ${requirement.name}
               comment    : ${requirement.comment}
               score      : ${requirement.score}
            """.trimIndent()
            )
        }
    }
}