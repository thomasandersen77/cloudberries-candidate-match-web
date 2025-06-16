package no.cloudberries.candidatematch.integration.openai

import no.cloudberries.candidatematch.utils.PdfUtils
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import java.io.File
import java.io.FileInputStream

@SpringBootTest
class OpenAIServiceTest {
    @Autowired
    lateinit var openAIService: OpenAIService
    @Autowired
    lateinit var assistantService: AssistantService


    @Test
    fun matchCandidateLegacyAPI() {
        val response = openAIService.matchCandidate(
            cv = PdfUtils.extractText(FileInputStream(File("src/test/resources/Thomas-Andersen_CV.pdf"))),
            request = PdfUtils.extractText(FileInputStream(File("src/test/resources/politiet_arkitektur.pdf"))),
            consultantName = "Thomas Andersen"
        )

        println(""""
                        
            Score:     ${response.totalScore}
            Summary:   ${response.summary}
        """")
    }

    @Test
    fun matchCandidate() {
        assistantService.callAssistant(
            assistantId = "asst",
            userMessage =  "Thomas Andersen",
        )
    }

}