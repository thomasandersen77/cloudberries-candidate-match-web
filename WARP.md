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

# Build (unit tests only)
mvn -q -DskipITs=true -Dtest='*Test' verify

# Full tests (requires Docker/Testcontainers)
mvn -q -DskipITs=false verify

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

## Notes
- Embedded Postgres used in tests may require Rosetta 2 on Apple Silicon.
- Health check errors in test logs are expected in isolation.
- Ensure Java 21.0.7 Temurin is active.
