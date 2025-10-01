Takk for tilbakemeldingene — jeg har gjort konkrete forbedringer på begge fanene.

Hva jeg endret nå
Relasjonelt søk
• “Minimumskrav” synlig og tydelig:
◦ Jeg har gjort feltene tydeligere med labels:
▪ MÅ-krav (minimumskrav) → binder til skillsAll (AND)
▪ BØR-krav → binder til skillsAny (OR)
◦ Skjemaet bruker nå et responsivt Grid-oppsett, så alle felter (inkludert Min. kvalitet) alltid vises og ikke
forsvinner i en lang horisontal rekke.
• Navn-feltet:
◦ Endret label/placeholder og la til forklarende tekst:
▪ Navn er delvis match, ikke eksakt, og ikke case-sensitiv (inneholder-søk på konsulentens navn).
▪ Placeholder: “f.eks. Thomas”
• Hjelpetekster:
◦ Navn: “Delvis match på konsulentens navn (ikke eksakt, ikke case-sensitiv)”

Semantisk søk
• Søk er mer robust:
◦ Hvis embedding-info-kallet feiler, lar jeg fortsatt søket gå (backend bruker default-konfig). Før ble søket deaktivert
i dette tilfellet.
◦ onlyActiveCv er nå AV som standard for å øke sjansen for treff (du kan skru på ved behov).
• Veiledning når det ikke kommer treff:
◦ La til en info-boks med praktiske grep:
▪ Øk Top K
▪ Slå av “Kun aktive CV-er”
▪ Fjern “Min. kvalitet”
• Forbedret skjema:
◦ La inn placeholder-eksempel:
▪ “Konsulent som heter Thomas og kan Kotlin, Java og AWS”
• Provider/modell i request:
◦ Blir kun sendt dersom server eksplisitt sier embeddings er aktivert. Det reduserer sjansene for provider/modell
mismatch.

Svar på spørsmålene dine
• Hva betyr “navn” i relasjonelt søk?
◦ Det er et deltekst-søk på konsulentens navn (case-insensitiv). Eksempel: “tho” vil matche “Thomas”.
• Må “MÅ-krav” og “BØR-krav” legges inn eksakt for konsulenten?
◦ MÅ-krav (skillsAll) betyr at konsulenten må ha alle valgte ferdigheter.
◦ BØR-krav (skillsAny) betyr at konsulenten kan ha én eller flere av disse, men ikke nødvendigvis alle.
◦ Ferdighetsverdiene i UI kommer fra /api/skills, så du velger fra “katalogen” systemet kjenner til (normaliserte
skillnavn).
• Semantisk søk gir ingen svar for “Thomas” + “Kotlin, Java, AWS”
◦ Etter endringene vil du få bedre sjanse for treff:
▪ onlyActiveCv er AV som default
▪ Du kan øke Top K (f.eks. 20)
▪ Sørg for at embeddings er generert i backend (hvis embedding-info viser “enabled: false”, kjør embeddings-jobber
først)

Hva du kan gjøre nå
• Kjør frontend og test:
◦ npm run dev
◦ Åpne /search
◦ Relasjonelt søk:
▪ Legg inn Navn = Thomas (delvis eller full), MÅ-krav = KOTLIN, JAVA, BØR-krav = AWS (valgfritt), Min. kvalitet etter
behov
◦ Semantisk søk:
▪ Tekst: “Konsulent som heter Thomas og kan Kotlin, Java og AWS”
▪ Øk Top K (f.eks. 20)
▪ Sørg for “Kun aktive CV-er” er av når du ikke får treff
• Tester:
◦ Enhetstester: npm run test
◦ e2e for Playwright (oppsatt, men valgfritt å kjøre nå):
▪ npm i
▪ npx playwright install
▪ npm run test:e2e