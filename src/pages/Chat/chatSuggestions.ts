import type { ChatAnswerKind, ChatSource } from '../../types/api';

/**
 * What the assistant can be asked, as something to click.
 *
 * Clicking fills the field and does not send. Some of these are a database lookup and some start a
 * run of paid screenings, and the reader should see the question, and be able to change it, before
 * it costs anything. [assessment] marks the ones that do: a fitness search screens five requests,
 * which is five model calls and over a minute, and a button that hides that is a button that
 * surprises.
 */
export interface PromptSuggestion {
  text: string;
  assessment?: boolean;
}

/**
 * The rows the examples are built from.
 *
 * Names in an example are only useful if they are in this database. "Hva kan Thomas Andersen best?"
 * is a good example here and a guaranteed "fant ingenting" anywhere else, so the subjects are read
 * from the database at load time and every example that needs one it did not get is left out.
 * Offering a question that cannot work is worse than offering fewer.
 */
export interface SuggestionSubjects {
  /** Consultants with a CV, most relevant first. The first is used alone, three for a comparison. */
  consultants?: string[];
  /** A customer the request resolver can actually place. See [placeableCustomer]. */
  customer?: string;
  /** Documented skills, most common first. */
  skills?: string[];
}

/**
 * How a reader would name a customer's request, or nothing if no name here works.
 *
 * Two rules, both taken from the resolver rather than from what reads nicely. It matches a request
 * by distinctive words of at least five characters, so "Skatteetaten-avropet" finds request 8 while
 * "Oslo-avropet" finds nothing: Oslo is four letters and never becomes distinctive. And a word two
 * customers share resolves to neither, so "Sparebank-avropet" is a clarification rather than an
 * example, and an example whose answer is a question teaches nothing.
 *
 * The whole name is kept when it is short enough to be one, because "Norges Bank-avropet" is what
 * somebody would write and "Norges-avropet" is not. A name with a comma in it is a department path,
 * never short enough, and falls back to its first word.
 */
export function placeableCustomer(customerNames: string[]): string | undefined {
  const names = customerNames.map(name => name.trim()).filter(Boolean);

  const findableAmongTheRest = (name: string) => distinctiveWords(name).some(word =>
    names.filter(other => other.toLowerCase().includes(word)).length === 1
  );

  const asWritten = (name: string) => name.includes(',') || name.length > LONGEST_WHOLE_NAME
    ? name.split(/[\s,]+/)[0] ?? ''
    : name;

  return names
    .filter(findableAmongTheRest)
    .map(asWritten)
    // The fallback to a first word can land on one too short to match anything, which is where
    // "Oslo kommune, Utviklings- og kompetanseetaten" ends up.
    .find(phrase => distinctiveWords(phrase).length > 0);
}

/** The words the request resolver can match on: five characters or more. */
function distinctiveWords(name: string): string[] {
  return name
    .toLowerCase()
    .split(/[^a-zæøå0-9]+/i)
    .filter(word => word.length >= DISTINCTIVE_WORD_LENGTH);
}

const DISTINCTIVE_WORD_LENGTH = 5;

/** Past this a customer name is a mouthful rather than something a reader would type. */
const LONGEST_WHOLE_NAME = 24;

/**
 * The examples for the empty state, in the order they should be offered.
 *
 * Every phrasing here was sent to a running backend and its intent read back out of the log, so a
 * chip lands on the route it looks like it should: consultant search, the request index, request
 * facts, consultant facts, a filtered search, stored matches, a request's candidates, one fitness
 * assessment, a fitness search and a comparison.
 */
export function databaseSuggestions({ consultants, customer, skills }: SuggestionSubjects): PromptSuggestion[] {
  const [consultant, second, third] = consultants ?? [];
  const [skillA, skillB] = skills ?? [];
  const suggestions: PromptSuggestion[] = [];

  if (skillA && skillB) suggestions.push({ text: `Hvem kan ${skillA} og ${skillB}?` });
  else if (skillA) suggestions.push({ text: `Hvem kan ${skillA}?` });

  // Needs nothing from the database, and is the one question that always has an answer.
  suggestions.push({ text: 'Hvilke avrop har vi?' });

  if (customer) suggestions.push({ text: `Hva krever ${customer}-avropet?` });
  if (consultant) suggestions.push({ text: `Hva kan ${consultant} best?` });
  if (consultant && customer) {
    suggestions.push({ text: `Passer ${consultant} til ${customer}-avropet?`, assessment: true });
  }
  if (consultant) {
    suggestions.push({ text: `Hvilke avrop passer ${consultant} til?`, assessment: true });
    suggestions.push({ text: `Hvilke avrop har ${consultant} blitt vurdert mot?` });
  }
  if (customer) {
    suggestions.push({ text: `Hvem kan jobbe for ${customer} og har minst 10 års erfaring?` });
    suggestions.push({ text: `Hvem er tidligere vurdert mot ${customer}-avropet?` });
  }
  if (consultant && second && third && customer) {
    suggestions.push({
      text: `Hvem passer best av ${consultant}, ${second} og ${third} til ${customer}-avropet?`,
      assessment: true
    });
  }

  return suggestions;
}

export const GENERAL_SUGGESTIONS: PromptSuggestion[] = [
  { text: 'Hva er Kafka?' },
  { text: 'Forklar forskjellen på MÅ- og BØR-krav' },
  { text: 'Hvordan bør et tilbud struktureres?' }
];

/**
 * The customer out of a source's label.
 *
 * A request source reads "Norges Bank — Konsulentoppdrag: sikkerhetsarkitekt", customer first and
 * title after an em dash. Handing the whole thing to [placeableCustomer] made it too long to keep
 * whole, so it fell back to the first word and the chip asked about "Norges-avropet".
 */
function customerFrom(label: string): string {
  return label.split('—')[0].trim();
}

/**
 * What the answer already told the reader, which is what a follow-up must not ask for again.
 *
 * Read off the answer's kind and the kinds of its sources, never off its prose. "Hva krever Norges
 * Bank-avropet?" came back with the requirements and a chip underneath offering to fetch the
 * requirements, which is the shape of a menu rather than of a next step.
 */
type AnswerTopic =
  | 'search'            // who matches some criteria
  | 'consultantFacts'   // what one person can do
  | 'requestFacts'      // what one request demands
  | 'storedMatches'     // what an earlier run decided
  | 'newAssessment'     // scores made just now
  | 'nothing';

function topicOf(answerKind: ChatAnswerKind | undefined, sources: ChatSource[]): AnswerTopic {
  if (answerKind === 'SEARCH_RESULT') return 'search';
  if (answerKind === 'STORED_MATCH') return 'storedMatches';
  if (answerKind === 'AD_HOC_EVALUATION') return 'newAssessment';
  if (answerKind === 'NO_GROUNDING') return 'nothing';
  // Both are FACTUAL, and only the sources say which. A turn citing a person answered about the
  // person even when a request is cited alongside them.
  if (sources.some(s => s.kind === 'CONSULTANT')) return 'consultantFacts';
  if (sources.some(s => s.kind === 'PROJECT_REQUEST')) return 'requestFacts';
  return 'nothing';
}

/**
 * Where a reader usually goes next, from what the answer actually was.
 *
 * Built from the answer's kind and its typed sources rather than its prose. The sources carry ids
 * and labels the server chose; the prose is written by a model and can name somebody it only
 * mentioned in passing. That is the same reason the comparison table is built from a typed field
 * rather than parsed out of the text.
 *
 * Each topic leaves out the question it has just answered. Asking what a request requires, right
 * under the requirements, is the failure this is written around.
 */
export function followUpSuggestions(
  answerKind: ChatAnswerKind | undefined,
  sources: ChatSource[] | undefined,
  askedQuestion: string | undefined
): PromptSuggestion[] {
  const rows = sources ?? [];
  const topic = topicOf(answerKind, rows);
  if (topic === 'nothing') return [];

  const consultant = rows.find(s => s.kind === 'CONSULTANT' && s.label)?.label;
  const customer = placeableCustomer(
    rows.filter(s => s.kind === 'PROJECT_REQUEST').map(s => customerFrom(s.label))
  );

  const suggestions: PromptSuggestion[] = [];

  // A search hands its hits to the next turn as a set, which is what "alle kandidatene" resolves
  // against. First, because the set is what is on screen.
  if (topic === 'search') {
    suggestions.push({ text: 'Sjekk erfaringen til alle kandidatene' });
  }

  if (consultant) {
    if (topic !== 'consultantFacts') {
      suggestions.push({ text: `Hva kan ${consultant} best?` });
    }
    if (topic !== 'newAssessment') {
      suggestions.push({ text: `Hvilke avrop passer ${consultant} til?`, assessment: true });
    }
    if (topic !== 'storedMatches') {
      suggestions.push({ text: `Hvilke avrop har ${consultant} blitt vurdert mot?` });
    }
  }

  if (customer) {
    if (topic !== 'requestFacts') {
      suggestions.push({ text: `Hva krever ${customer}-avropet?` });
    } else {
      // The requirements are already on screen; the question they raise is who meets them.
      suggestions.push({ text: `Hvem kan jobbe for ${customer} og har minst 10 års erfaring?` });
    }
    if (topic !== 'storedMatches') {
      suggestions.push({ text: `Hvem er tidligere vurdert mot ${customer}-avropet?` });
    }
    if (consultant && topic !== 'newAssessment') {
      suggestions.push({ text: `Passer ${consultant} til ${customer}-avropet?`, assessment: true });
    }
  }

  // A backstop for the wording, on top of the rules above: a turn never offers itself back.
  const asked = askedQuestion?.trim().toLowerCase();
  return suggestions
    .filter(s => s.text.toLowerCase() !== asked)
    .slice(0, MAX_FOLLOW_UPS);
}

/** Three is a nudge. More is a menu, and the answer above it is what the reader came for. */
const MAX_FOLLOW_UPS = 3;
