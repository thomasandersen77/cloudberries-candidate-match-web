/**
 * What each page is for, and how you use it.
 *
 * Two levels, because they answer two different questions. `intro` is one or two lines under the
 * title and answers "what is this page"; it is always there. `steps` answers "how do I use it" and
 * stays folded away until somebody asks, so the work surface is what you see when the page loads.
 *
 * Kept in one file rather than inline in six components, so the wording can be read, compared and
 * rewritten in one sitting. They are prose, not labels; changing them changes nothing but the text.
 *
 * Three rules for anything added here:
 *
 *  - `intro` says what the page is. The heading already says what it is called.
 *  - At most three `steps`, and each one earns its place: the order of the work, or something a
 *    reader would otherwise get wrong. Not a tour of the controls.
 *  - Never promise more than the code does. Every claim below was checked against the endpoint or
 *    the component it describes.
 *
 * What does *not* belong here: the cost of an action, or what it changes. That stays next to the
 * button, where somebody who has switched this help off still sees it.
 */
export type PageIntroKey =
  | 'consultants'
  | 'matches'
  | 'projectRequests'
  | 'cvScore'
  | 'stats'
  | 'health'
  // The superuser pages. Same component, same switch: somebody who is new to these needs the
  // explanation more than anyone, and the pages are the least self-explanatory in the app.
  | 'superuser'
  | 'skills'
  | 'embeddings'
  | 'search'
  | 'semanticSearch';

export interface PageIntroContent {
  /** One or two lines under the title. Always visible unless the reader turned the help off. */
  intro: string;
  /** Folded away behind "Slik bruker du siden". Three at most. */
  steps: string[];
}

export const PAGE_INTROS: Record<PageIntroKey, PageIntroContent> = {
  consultants: {
    intro:
      'Finn konsulenter på navn og utforsk kompetansen deres. Åpne en profil for detaljer, eller ' +
      'se hele CV-en.',
    steps: [
      'Detaljer viser nøkkeltall og kompetanse. «Se hele CV-en» viser dokumentet slik kunden får det.',
      'CV-skåren til høyre er en AI-vurdering av hvor komplett CV-en er, ikke av konsulenten.',
      'Søkefeltet leter bare i navn. Skal du lete etter kompetanse, spør Assistenten i stedet.',
    ],
  },

  matches: {
    intro:
      'Vurder kandidater mot en kundeforespørsel. Forhåndsvis kandidatene, velg hvem du vil ' +
      'vurdere, og sammenlign resultatene fra AI-matching.',
    steps: [
      'Velg en forespørsel, forhåndsvis kandidatene, og kryss av for dem du vil ha vurdert.',
      'Forhåndsvisningen er en kortliste ut fra registrerte ferdigheter og CV-kvalitet. Den er ikke en egnethetsvurdering.',
      'AI-vurderingen starter først når du ber om den, og gir en begrunnelse per kandidat.',
    ],
  },

  projectRequests: {
    intro:
      'Last opp en kundeforespørsel som PDF. AI trekker ut informasjon og må- og bør-krav, som du ' +
      'kan kontrollere før du går videre til Matcher.',
    steps: [
      'Velg PDF, last opp, og åpne forespørselen for å kontrollere kravene som ble tolket ut.',
      'Skillet mellom må-krav og bør-krav er AI-ens lesning av dokumentet. Les gjennom før du bruker det videre.',
      'Opplasting og matching er to handlinger. Kandidater finner du under Matcher, ikke her.',
    ],
  },

  cvScore: {
    intro:
      'Se AI-vurderinger av CV-kvalitet. Åpne en vurdering for å se styrker og forslag til ' +
      'hvordan CV-en kan forbedres.',
    steps: [
      'Åpne en rad for å lese hva vurderingen fant, og hva den foreslår å gjøre med CV-en.',
      'Kjør en ny vurdering når CV-en er oppdatert i Flowcase.',
      'CV-kvalitet er ikke det samme som egnethet for et oppdrag. Den måler dokumentet.',
    ],
  },

  stats: {
    intro:
      'Få oversikt over registrerte programmeringsspråk og roller. Sammenlign antall konsulenter, ' +
      'andeler og samlet språkerfaring.',
    steps: [
      'Filtrer på språk, sorter tabellene på kolonne, og velg hvordan rollene skal vises.',
      '«Samlet erfaring» legger sammen år på tvers av konsulenter. Det er kapasitet, ikke én persons erfaring.',
      'Tallene beskriver det som står i CV-ene, ikke hvem som er ledig for oppdrag.',
    ],
  },

  health: {
    intro:
      'Se rapportert status for systemets tjenester og hvilke AI-modeller som er konfigurert. ' +
      'Bruk siden som utgangspunkt hvis noe ikke fungerer.',
    steps: [
      '«Operasjonell» betyr at tjenesten svarte da siden ble lastet. «Ingen kontakt» betyr at den ikke gjorde det.',
      '«Konfigurert riktig» sier at nøklene er på plass, ikke at leverandøren svarer akkurat nå.',
      'Tabellen med AI-modeller viser hva som er satt opp for hvert nivå, fra det raske til kvalitetsnivået.',
    ],
  },

  superuser: {
    intro:
      'Verktøyene som ligger under selve arbeidsflaten: ferdighetstabellen, embeddingene det ' +
      'semantiske søket leser fra, og søk uten assistenten.',
    steps: [
      'Ingenting her er nødvendig for vanlig bruk. Assistenten og konsulentlisten svarer på det samme, med mer kontekst.',
      'Embeddings er den eneste siden som endrer noe. De to andre leser bare.',
      'Sidene viser grunnlaget slik det faktisk ligger. Ser et svar rart ut, er det her du finner ut hvorfor.',
    ],
  },

  skills: {
    intro:
      'Alle ferdigheter som er registrert i CV-ene, med hvor mange som har hver av dem og hvem ' +
      'de beste er.',
    steps: [
      'Søk i ferdighetsnavn, eller velg blant de mest brukte, og åpne en ferdighet for å se konsulentene.',
      'Rangeringen bygger på dokumentert varighet i CV-en, og CV-kvalitet teller med som et mindre ledd.',
      'En ferdighet som ikke står i noen CV finnes ikke her, uansett hvem som kan den.',
    ],
  },

  embeddings: {
    intro:
      'En embedding er en CV oversatt til tall, slik at to tekster kan sammenlignes på mening og ' +
      'ikke på ord. Det er dette det semantiske søket leser fra.',
    steps: [
      'Uten embeddinger virker søk på navngitte ferdigheter fortsatt. Det er den semantiske halvdelen som faller bort.',
      'De lages av Googles gemini-embedding-001 på gratisnivået: ingen regning, men 1000 kall i døgnet per modell.',
      '«Rebuild» tar bare dem som mangler. «Force rebuild» tar alle om igjen, og bruker kvoten deretter.',
    ],
  },

  search: {
    intro:
      'Søk i konsulentene uten assistenten: du setter kriteriene selv, og får treffene uten en ' +
      'AI-formulert forklaring.',
    steps: [
      'Relasjonelt søk filtrerer på navn, må-krav, bør-krav, minste CV-kvalitet og aktiv CV.',
      'Semantisk søk leter på mening i stedet for på ferdighetsnavn, og krever at embeddingene er bygget.',
      'Treffene er søketreff, ikke en vurdering. Skal noen måles mot et avrop, gjøres det under Matcher.',
    ],
  },

  semanticSearch: {
    intro:
      'Skriv hva du leter etter med egne ord. Søket leter på mening i CV-ene, ikke på at akkurat ' +
      'de ordene står der.',
    steps: [
      'Det finner en konsulent som skrev «migrerte monolitt til mikrotjenester» når du spør om modernisering av gamle systemer.',
      'Det krever embeddinger. Mangler de, sier siden fra, og svaret blir tomt framfor feil.',
      'En CV som nettopp er endret i Flowcase har fortsatt sin gamle embedding til den bygges om.',
    ],
  },
};
