# Warp guide for Cloudberries Candidate Match (backend) and Web (frontend)

This guide helps Warp operate both repos:
- Backend: /Users/tandersen/git/cloudberries-candidate-match (Spring Boot 3 + Kotlin)
- Frontend: /Users/tandersen/git/cloudberries-candidate-match-web (React + Vite)

## Prerequisites
- macOS + Warp
- Homebrew
- SDKMAN
- Node.js (nvm recommended)
- Java 21.0.7 Temurin (SDKMAN)
- Maven (SDKMAN)

```bash
curl -s "https://get.sdkman.io" | bash
source "$HOME/.sdkman/bin/sdkman-init.sh"
sdk install java 21.0.7-tem
sdk install maven
```

## Backend (Spring Boot)
```bash
# Path: backend
cd /Users/tandersen/git/cloudberries-candidate-match

# Unit tests only (fast - Surefire plugin)
mvn -q -DskipITs=true clean test

# Integration tests only (requires Docker/Testcontainers - Failsafe plugin)
mvn -q -DskipTests=true -DskipITs=false clean verify

# All tests (unit + integration)
mvn -q -DskipITs=false clean verify

# Build without tests
mvn -q -DskipTests=true -DskipITs=true clean package

# Run locally
mvn -q spring-boot:run -Dspring-boot.run.profiles=local
```

## Frontend (React + Vite)
```bash
# Path: frontend
cd /Users/tandersen/git/cloudberries-candidate-match-web
npm install
npm run dev
npm run build
npm run preview
npm run test
```

## OpenAPI → Frontend types
```bash
# From backend repo
cp /Users/tandersen/git/cloudberries-candidate-match/openapi.yaml \
   /Users/tandersen/git/cloudberries-candidate-match-web/openapi.yaml
npm --prefix /Users/tandersen/git/cloudberries-candidate-match-web run gen:api
```
Or generate from a running backend:
```bash
curl -s http://localhost:8080/v3/api-docs.yaml > \
  /Users/tandersen/git/cloudberries-candidate-match-web/openapi.yaml
npm --prefix /Users/tandersen/git/cloudberries-candidate-match-web run gen:api
```

## Key endpoints
- Project Requests
  - GET /api/project-requests
  - POST /api/project-requests/upload (multipart: file)
  - GET /api/project-requests/{id}
- CV Scoring
  - GET /api/cv-score/{candidateId}
  - POST /api/cv-score/{candidateId}/run
  - POST /api/cv-score/run/all
  - GET /api/cv-score/all
- Skills
  - GET /api/skills?skill=JAVA&skill=KOTLIN

## Maven Test Structure
The project uses separate Maven plugins for different test types:

**Unit Tests (Surefire)**:
- Pattern: `*Test.kt` (e.g., `UserServiceTest.kt`)
- Location: `src/test/kotlin`
- Plugin: `maven-surefire-plugin`
- Fast execution, no external dependencies
- Reports: `target/surefire-reports/`

**Integration Tests (Failsafe)**:
- Pattern: `*IntegrationTest.kt` or `*IT.kt`
- Location: `src/test/kotlin` 
- Plugin: `maven-failsafe-plugin`
- Uses Testcontainers, embedded databases, WireMock
- Reports: `target/failsafe-reports/`

## Notes
- Embedded Postgres used in tests may require Rosetta 2 on Apple Silicon.
- Health check errors in test logs are expected in isolation.
- Ensure Java 21.0.7 Temurin is active.
- Maven plugins use `useModulePath=false` to avoid classpath issues.
