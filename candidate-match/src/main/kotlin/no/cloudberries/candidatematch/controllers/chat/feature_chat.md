# Refactor chat

Det må lages en service som kan ta i mot prompten
Denne ska først tolke teksten som kommer inn, mulig det er stikkord ifbm en konsulent i teksten.
Det kan være spørsmål om teknologier eller roller. Fra friteksten, burde det gjøres et kall til Ai for
å sjekke hva det spørres om, eller kan vi programatisk tolke den og gjøre en semantisk
spørring mot vektor databasen eller bør vi bruke en kombinasjon med strukturert søk?

Tanken er å kunne sitte å chatte med AI om en eller flere konsulenter med CVene deres i konteksten - RAG

Gjør en grundig vurdering men vi bør ikke kreve mer en et prompt fra bruker i frontend.
Brukerem kunne fått en del ferdige spørsmål der de fyller ut placeholdere som vi vet hva vi skal gjøre
med når vi tar de imot

**Strukturert søk:**

```json
{
  "skillsAll": [
    "KOTLIN",
    "SPRING"
  ],
  "skillsAny": [
    "ARCHITECTURE",
    "TECH_LEAD"
  ],
  "minQualityScore": 85
}
```

*"Konsulenter som KAN Kotlin og Spring, og som OGSÅ har arkitektur- eller tech-lead-erfaring, med score over 85"*

**Semantisk søk:**

```json
{
  "text": "Erfaren fullstack-utvikler som kan mentorere juniorer",
  "topK": 5
}
```

*"5 beste konsulenter basert på semantisk matching av beskrivelsen"*

```kotlin

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
```

Gjør en grundig vurdering
Følg controller - service -repository patten
Mulig du trenger noen mer avansert logikk, skille det ut i en egen service

Se dette i sammenheng med eksisterende arkitektur.
Hastighet på svar er kritisk, mulig vi burde bruke en raskere LLM fra Gemini hvis vi må kalle AI først før db. Vi ønsker
å høy responsiviteten på chatten.
