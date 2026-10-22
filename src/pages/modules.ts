/**
 * What the application offers, split by who needs it.
 *
 * The dashboard listed all ten modules as equals, and most of a working day touches six of them.
 * Embeddings runs a batch job, Ferdigheter and Søk are narrower ways into what the assistant and
 * the consultant list already answer, and putting them beside "Last opp kundeforespørsel" said
 * they were equally often the right thing to click.
 *
 * Nothing is removed. The rest live on their own page, still routed and still linked, one click
 * further away.
 */
export interface ModuleLink {
  to: string;
  title: string;
  desc: string;
  /** Takes the full width and leads the list. Only the assistant, and only on the dashboard. */
  featured?: boolean;
}

/**
 * The assistant leads and takes the full width, because it is the way in for most questions. It
 * used to be the seventh card, titled "Chat Analyze" and described as "Analyser tekst med AI",
 * which says nothing about it answering from the consultant and request data.
 */
export const EVERYDAY_MODULES: ModuleLink[] = [
  {
    to: '/chat',
    title: 'Assistent',
    desc: 'Spør om konsulenter, avrop og tidligere vurderinger. Svarene bygger på databasen og viser kildene sine. Kan også svare generelt, uten interne data.',
    featured: true,
  },
  // One line each: the front page shows them as tiles, and a description that wraps is a tile that
  // grows taller than its neighbours.
  { to: '/consultants', title: 'Konsulenter', desc: 'Konsulentliste med CV-score' },
  { to: '/matches', title: 'Matcher', desc: 'Kandidater vurdert mot avrop' },
  { to: '/project-requests/upload', title: 'Last opp avrop', desc: 'PDF inn, krav ut, klar for matching' },
  { to: '/cv-score', title: 'CV-score', desc: 'Score og forbedringer per CV' },
  { to: '/stats', title: 'Statistikk', desc: 'Programmeringsspråk og roller' },
  { to: '/health', title: 'Systemstatus', desc: 'Tjenester, modeller og tilgjengelighet' },
];

/** The rest: batch jobs and the narrower ways into data the pages above already show. */
export const SUPERUSER_MODULES: ModuleLink[] = [
  { to: '/skills', title: 'Ferdigheter', desc: 'Oversikt over ferdigheter og tilknyttede konsulenter' },
  { to: '/embeddings', title: 'Embeddings', desc: 'Kjør embedding-oppgaver for semantisk søk' },
  { to: '/search', title: 'Søk', desc: 'Søk i konsulenter og kompetanse, uten assistenten' },
  { to: '/cv-score-grunnlag', title: 'CV-scoregrunnlag', desc: 'Hva en CV-score bygger på: kriterier, trekk, modellens merknader og tellinger' },
];
