Nedenfor vil vi finne masse kontekst. Det er outputen fra Word-terminalen etter backend-oppgaver.
Når det kommer til scoring siden, så ønsker jeg også at det skal være mulig å score én konsulent alene. Og deretter skal
resultatet vises.
Ja. Men det skal også være mulighet for å score alle, og begge to post-endepunkter.

Jeg skal ha en side som viser skills i firma, basert på dataen du får tilbake fra endepunktet.
Finn en fornuftig måte å vise skills på, og finn en måte å vise hvor mange firmaer som har de skillset.

Og hvem som kanskje er best på de, hvis mulig.

Når du klikker på konsulenten som har en skill, så håper du til CV-siden hans/hennes.

Sørg for at CvScoreController kaller på en service og ikke direkte på repositoriet for å følge SRP.
Lag et endepunkt og en funksjon for å trigge en CvScore av 1 konsulent fra frontend
Lag et endepunkt og en funksjon for å trigge en CvScore av alle konsulent fra frontend
Gjenbruk så mye kode som er fornufig ihht til DDD, SOLID og clean code.
Sørg for å lage tester som verifiserer funksjonelitet
Oppdater openapi.yaml

Sørg for at CvScoreController kaller på en service og ikke direkte på repositoriet for å følge SRP.
Lag et endepunkt og en funksjon for å trigge en CvScore av 1 konsulent fra frontend
Lag et endepunkt og en funksjon for å trigge en CvScore av alle konsulent fra frontend
Gjenbruk så mye kode som er fornufig ihht til DDD, SOLID og clean code.
Sørg for å lage tester som verifiserer funksjonelitet
Oppdater openapi.yaml

Sørg for at CvScoreController kaller på en service og ikke direkte på repositoriet for å følge SRP.
Lag et endepunkt og en funksjon for å trigge en CvScore av 1 konsulent fra frontend
Lag et endepunkt og en funksjon for å trigge en CvScore av alle konsulent fra frontend
Gjenbruk så mye kode som er fornufig ihht til DDD, SOLID og clean code.
Sørg for å lage tester som verifiserer funksjonelitet
Oppdater openapi.yaml

OpenAPI-oppdatering
• Fil: openapi.yaml
◦ Lagt til tag “Skills” tidligere (beholdt)
◦ Lagt til:
▪ POST /api/cv-score/{candidateId} (kjør scoring for én)
▪ POST /api/cv-score/run/all (kjør scoring for alle)
▪ Schema CvScoringRunResponse
◦ Beholdt eksisterende:
▪ GET /api/cv-score/{candidateId}
▪ GET /api/cv-score/all
▪ Schema CvScoreDto, CandidateDTO

Tester
• Controller
◦ Fil: src/test/kotlin/no/cloudberries/candidatematch/controllers/scoring/CvScoreControllerTest.kt
◦ MockMvc + mock av CvScoreAppService
◦ Tester at GET/POST-endepunkter delegerer riktig og returnerer forventet JSON
• Service
◦ Fil: src/test/kotlin/no/cloudberries/candidatematch/service/scoring/CvScoreAppServiceTest.kt
◦ Mock av ConsultantRepository, CvScoreRepository og ScoreCandidateService
◦ Verifiserer:
▪ scoreCandidate upserter og mapper korrekt
▪ scoreAll returnerer riktig processedCount

Slik bruker du fra frontend (eksempler)
• Hent score for én
◦ GET /api/cv-score/{userId}
• Trigg score for én
◦ POST /api/cv-score/{userId}/run
• Trigg score for alle
◦ POST /api/cv-score/run/all
• Hent kandidatliste
◦ GET /api/cv-score/all

Hvorfor dette følger DDD, SOLID og clean code
• SRP: Controller gjør kun HTTP/DTO, mens CvScoreAppService orkestrerer use-case
• Gjenbruk: ScoreCandidateService (domene/AI) gjenbrukes for all scoring
• Testbarhet: Service og controller er isolert testet, repos og AI er mocket
• Åpen for utvidelse: Lett å legge til parametre (provider, modell) via service uten å røre controllerlogikk
