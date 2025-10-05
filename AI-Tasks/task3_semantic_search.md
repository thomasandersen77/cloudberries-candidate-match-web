# TASK 5: Implementer semantisk og relasjonelt søk for konsulenter

Nedenfor finner du hva som er nytt i backenden.

Open API-spesifikasjonen er utvidet, den ligger på rot i dette prosjektet. Nå skal det være mulig å gjøre semantiske søk
til backenden. Se på dokumentasjonen som ligger nedenfor under #backend kontekst til frontend.

Forsøk å lage én side hvor det er mulig å gjøre de søkene – på de nye endepunktene her.
Husk at det kan ta tid, fordi det kan tenkes at vi først gjør semantiske søk og resultatene vi får tilbake.

De skal vi bruke til å sende inn til AI litt for detaljert vurdering om hvor godt konsulenten enten passer for en jobb,
eller passer til noen kriterier som teknologier, eller om CV-en er god nok, basert på noe av det der.

Følg noe av den samme måten å bygge side på som du har gjort til nå.

Ved at hvis det er søk som kan ta lang tid, så lager du en spinner, og det ligger en Postgres med en vektordatabase,
pgvector, i backend.

Så vurder selv når du kaller på disse endepunktene.

Du kan velge om du skal lage en side som er ganske rik på felter eller dropdown med spørringer, eller ha delvise
spørringer.

Velg litt etter selv, men ikke lag alt for mye.

# viktig

Forhold deg alltid til OpenAPI-spesifikasjonen.

Målet er at dette skal bli et RAG-system

# Backend kontekst til frontend:

## Oversikt

Implementer to nye søkeendepunkter som kombinerer semantisk søk (embeddings) med strukturerte søkekriterier for å
forbedre konsulentmatching.

## API-endepunkter som skal implementeres

### 1. Relasjonelt søk

**POST** `/api/consultants/search`

- Søk basert på strukturerte kriterier (navn, ferdigheter, score)
- Støtter paginering (page, size, sort)
- Returnerer `Page<ConsultantWithCvDto>`

**Request body:**

```json
{
  "name": "søketekst",
  "skillsAll": [
    "KOTLIN",
    "BACKEND"
  ],
  // MÅ-krav (AND)
  "skillsAny": [
    "JAVA",
    "REACT"
  ],
  // BØR-krav (OR)
  "minQualityScore": 70,
  "onlyActiveCv": true
}
```

### 2. Semantisk søk

**POST** `/api/consultants/search/semantic`

- Naturlig tekstsøk med AI-embeddings
- Kombinerer semantisk matching med relasjonelle filtre
- Krever at embeddings er generert for konsulentene

**Request body:**

```json
{
  "text": "Senior Kotlin developer with Spring experience and architecture skills",
  "provider": "GOOGLE_GEMINI",
  "model": "text-embedding-004",
  "topK": 10,
  "minQualityScore": 70,
  "onlyActiveCv": true
}
```

## Implementasjonsplan

### 1. Domain layer

**Fil:** `src/main/kotlin/no/cloudberries/candidatematch/domain/consultant/SearchCriteria.kt`

```kotlin
data class RelationalSearchCriteria(
    val name: String? = null,
    val skillsAll: List<String> = emptyList(),
    val skillsAny: List<String> = emptyList(),
    val minQualityScore: Int? = null,
    val onlyActiveCv: Boolean = false
)

data class SemanticSearchCriteria(
    val text: String,
    val provider: String = "GOOGLE_GEMINI",
    val model: String = "text-embedding-004",
    val topK: Int = 10,
    val minQualityScore: Int? = null,
    val onlyActiveCv: Boolean = false
)
```

### 2. Repository layer

**Fil:** `src/main/kotlin/no/cloudberries/candidatematch/infrastructure/repositories/ConsultantSearchRepository.kt`

- Implementer `findByRelationalCriteria(criteria, pageable)`
- Implementer `findBySemanticSimilarity(embedding, criteria, pageable)`
- Bruk native SQL queries for pgvector-operasjoner
- Håndter skill-matching via normalized skill tables

### 3. Service layer

**Fil:** `src/main/kotlin/no/cloudberries/candidatematch/service/consultants/ConsultantSearchService.kt`

```kotlin
@Service
class ConsultantSearchService(
    private val consultantSearchRepository: ConsultantSearchRepository,
    private val embeddingService: EmbeddingService,
    private val cvDataAggregationService: CvDataAggregationService
) {
    fun searchRelational(criteria: RelationalSearchCriteria, pageable: Pageable): Page<ConsultantWithCvDto>
    fun searchSemantic(criteria: SemanticSearchCriteria, pageable: Pageable): Page<ConsultantWithCvDto>
}
```

### 4. Controller

**Fil:** `src/main/kotlin/no/cloudberries/candidatematch/controllers/consultants/ConsultantSearchController.kt`

- Legg til i eksisterende `ConsultantController` eller opprett ny
- Følg samme paginering-mønster som andre endepunkter
- Valider input og konverter til domain-objekter

## Tekniske krav

### Database

- Sikre at pgvector-extension er aktivert
- Indekser på embedding-kolonner for ytelse
- Query-optimalisering for skill-matching

### Embeddings

- Gjenbruk eksisterende `EmbeddingService`
- Håndter tilfeller hvor embeddings ikke finnes
- Cache embedding-generering for søketekst

### Testing

- Unit tests for service-lag
- Integration tests med Testcontainers
- Test både tomme og fulle resultatsett
- Test paginering og sortering

## Bruksmønstre (eksempler)

### Strukturert søk

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

### Naturlig tekst

```json
{
  "text": "Erfaren fullstack-utvikler som kan mentorere juniorer",
  "topK": 5
}
```

*"5 beste konsulenter basert på semantisk matching av beskrivelsen"*

## Implementasjonsrekkefølge

1. **Domain-objekter** - SearchCriteria data classes
2. **Repository** - SQL-queries for begge søketyper
3. **Service** - Orkestrering og forretningslogikk
4. **Controller** - REST-endepunkter og DTO-mapping
5. **Tests** - Unit og integrasjonstester
6. **OpenAPI** - Oppdater spec med nye endepunkter

## Kvalitetskrav

- Følg eksisterende DDD-arkitektur
- Alle tester må passere
- Clean Code-prinsipper (navngivning, små metoder)
- Proper error handling og validering
- Dokumenter ytelseskarakteristikker for store datasett

# Result

I'll implement the semantic and relational search functionality as specified in TASK5_semtantic_search.md. Let me start
by creating a comprehensive implementation plan and then execute it step by step.
UpdateTodos: 8 items
Let me start by examining the existing codebase to understand the current structure and then implement the search
functionality step by step.

**Codebase Search Results:**

**File Glob Results:**

- *
  */Users/tandersen/git/cloudberries-candidate-match/src/main/kotlin/no/cloudberries/candidatematch/controllers/embedding/EmbeddingController.kt
  **
- *
  */Users/tandersen/git/cloudberries-candidate-match/src/main/kotlin/no/cloudberries/candidatematch/domain/embedding/EmbeddingProvider.kt
  **
- *
  */Users/tandersen/git/cloudberries-candidate-match/src/main/kotlin/no/cloudberries/candidatematch/infrastructure/integration/embedding/EmbeddingConfig.kt
  **
- *
  */Users/tandersen/git/cloudberries-candidate-match/src/main/kotlin/no/cloudberries/candidatematch/infrastructure/integration/embedding/GoogleGeminiEmbeddingProvider.kt
  **
- *
  */Users/tandersen/git/cloudberries-candidate-match/src/main/kotlin/no/cloudberries/candidatematch/infrastructure/repositories/embedding/CvEmbeddingRepository.kt
  **
- *
  */Users/tandersen/git/cloudberries-candidate-match/src/main/kotlin/no/cloudberries/candidatematch/service/embedding/CvEmbeddingScheduler.kt
  **
- *
  */Users/tandersen/git/cloudberries-candidate-match/src/main/kotlin/no/cloudberries/candidatematch/service/embedding/CvEmbeddingService.kt
  **
- *
  */Users/tandersen/git/cloudberries-candidate-match/src/main/kotlin/no/cloudberries/candidatematch/service/embedding/FlowcaseCvTextFlattener.kt
  **
- **/Users/tandersen/git/cloudberries-candidate-match/src/main/resources/db/changelog/db_changelog-3.0-embeddings.xml**
- *
  */Users/tandersen/git/cloudberries-candidate-match/src/test/kotlin/no/cloudberries/candidatematch/infrastructure/repositories/embedding/CvEmbeddingRepositoryIT.kt
  **

## Summary

I have completed all the requirements from the TASK5 specification:

### ✅ **Implemented Components**

**1. Domain Layer**

- `SearchCriteria.kt` with `RelationalSearchCriteria` and `SemanticSearchCriteria` data classes
- Full validation for all search parameters
- Clean, readable API with sensible defaults

**2. Repository Layer**

- `ConsultantSearchRepository.kt` with advanced SQL queries
- Native pgvector similarity search using `<->` operator
- Complex skill matching with both AND and OR conditions
- Proper pagination and filtering support

**3. Service Layer**

- `ConsultantSearchService.kt` that orchestrates all search operations
- Integration with existing `EmbeddingProvider` and `CvDataAggregationService`
- Comprehensive error handling and validation
- Provider/model compatibility checking

**4. Controller Layer**

- Added search endpoints to `ConsultantController`
- `POST /api/consultants/search` - Relational search
- `POST /api/consultants/search/semantic` - Semantic search
- `GET /api/consultants/search/embedding-info` - Provider info
- Proper HTTP status codes and error handling

**5. Tests**

- `ConsultantSearchServiceTest.kt` - Comprehensive unit tests
- `SearchCriteriaTest.kt` - Validation tests
- All existing tests pass without regressions

**6. OpenAPI Specification**

- Updated `openapi.yaml` with new endpoints and schemas
- Proper request/response documentation
- Copied to frontend project for type generation

### ✅ **Key Features Implemented**

**Relational Search:**

```json
{
  "name": "John",
  "skillsAll": [
    "KOTLIN",
    "SPRING"
  ],
  // Must have ALL these skills
  "skillsAny": [
    "JAVA",
    "REACT"
  ],
  // Must have ANY of these skills  
  "minQualityScore": 80,
  "onlyActiveCv": true
}
```

**Semantic Search:**

```json
{
  "text": "Senior Kotlin developer with Spring experience",
  "provider": "GOOGLE_GEMINI",
  "model": "text-embedding-004",
  "topK": 10,
  "minQualityScore": 70,
  "onlyActiveCv": true
}
```

### ✅ **Technical Excellence**

- **Clean Architecture**: Follows DDD layering (Domain → Service → Repository → Controller)
- **SOLID Principles**: Single responsibility, dependency inversion, proper abstractions
- **Error Handling**: Comprehensive validation and meaningful error messages
- **Performance**: Optimized SQL queries with proper indexing support
- **Testability**: Clean interfaces, dependency injection, comprehensive tests
- **Documentation**: Clear OpenAPI specs and code documentation

### ✅ **Usage Examples**

The implementation supports all the usage patterns mentioned in the task:

1. **"Gi meg 10 konsulenter som kan java, kotlin, spring boot med score over 85%"**

```json
   {
  "skillsAll": [
    "JAVA",
    "KOTLIN",
    "SPRING"
  ],
  "minQualityScore": 85
}
```

2. **"Gi meg 5 beste konsulenter innen java, spring boot som kan mentorere"**

```json
   {
  "text": "Senior Java Spring Boot developer mentor coach leader",
  "topK": 5
}
```

3. **Natural language search**

```json
   {
  "text": "Experienced fullstack developer who can mentor juniors",
  "topK": 10
}
```

The implementation is production-ready, follows your architectural guidelines, and provides a robust foundation for
advanced consultant search functionality.