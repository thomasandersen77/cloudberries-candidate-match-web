import { describe, it, expect } from 'vitest';
import {
  databaseSuggestions, exampleConsultants, followUpSuggestions, placeableCustomer
} from './chatSuggestions';

/**
 * The examples and the follow-ups, as data.
 *
 * Kept apart from the page because the rules are about what can be asked, not about what a chip
 * looks like: a name that is not in this database, or a customer word the request resolver cannot
 * place, produces an example whose answer is "fant ingenting".
 */
describe('chatSuggestions', () => {
  describe('placeableCustomer', () => {
    /**
     * The chat matches a request by distinctive words of at least five characters, so the customer
     * word in an example has to clear the same bar the resolver sets.
     */
    it('takes a first word long enough for the request resolver to match', () => {
      expect(placeableCustomer(['Skatteetaten'])).toBe('Skatteetaten');
    });

    it('skips a customer with no word long enough to be distinctive', () => {
      // Falls back to the first word because of the comma, and "Oslo" is four letters, so
      // "Oslo-avropet" would match nothing.
      expect(placeableCustomer(['Oslo kommune, Utviklings- og kompetanseetaten'])).toBeUndefined();
    });

    /**
     * Two customers sharing a word is not the same as neither being findable. "Sparebank" matches
     * both rows and "Østlandet" matches one, and the whole name carries both: sent to the running
     * backend, "Hva krever Sparebank 1 Østlandet-avropet?" resolves to request 9002 and nothing
     * else. Keeping the whole name is what makes that work.
     */
    it('keeps a whole name when part of it is shared with another customer', () => {
      expect(placeableCustomer(['Sparebank 1 Østlandet', 'Sparebank 1 Nord-Norge']))
        .toBe('Sparebank 1 Østlandet');
    });

    /**
     * A short first word does not rule a customer out when the rest of the name carries it. "Vy" is
     * two letters, and "Vy Group-avropet" still resolves, to request 9001.
     */
    it('uses the whole name when the first word alone is too short', () => {
      expect(placeableCustomer(['Vy Group', 'Øren', 'Husbanken'])).toBe('Vy Group');
    });

    it('takes the first word when the whole name is a department path', () => {
      expect(placeableCustomer(['Skatteetaten, Divisjon for utvikling og IT som er langt']))
        .toBe('Skatteetaten');
    });
  });

  describe('exampleConsultants', () => {
    /**
     * A name in an example is personal data shown to people outside the company, so the one the
     * examples name is chosen rather than ranked into place.
     */
    it('puts the preferred person first', () => {
      expect(exampleConsultants('Thomas Andersen', ['Einar Flobak', 'Joachim Lous']))
        .toEqual(['Thomas Andersen', 'Einar Flobak', 'Joachim Lous']);
    });

    it('does not name the same person twice when the ranking already found them', () => {
      expect(exampleConsultants('Thomas Andersen', ['Einar Flobak', 'Thomas Andersen']))
        .toEqual(['Thomas Andersen', 'Einar Flobak']);
    });

    /** Another Flowcase tenant has its own people, and none of them is this one. */
    it('falls back to the ranking when the preferred person is not in this database', () => {
      expect(exampleConsultants(undefined, ['Einar Flobak', 'Joachim Lous']))
        .toEqual(['Einar Flobak', 'Joachim Lous']);
    });
  });

  describe('databaseSuggestions', () => {
    it('writes the questions around the rows it was given', () => {
      const texts = databaseSuggestions({
        consultants: ['Thomas Andersen', 'Joachim Lous', 'Einar Flobak'],
        customer: 'Skatteetaten',
        skills: ['Kotlin', 'Kafka']
      }).map(s => s.text);

      expect(texts).toContain('Hvem kan Kotlin og Kafka?');
      expect(texts).toContain('Hva krever Skatteetaten-avropet?');
      expect(texts).toContain('Hva kan Thomas Andersen best?');
      expect(texts).toContain(
        'Hvem passer best av Thomas Andersen, Joachim Lous og Einar Flobak til Skatteetaten-avropet?'
      );
    });

    /** An example that cannot work is worse than one example fewer. */
    it('leaves out every question whose subject it does not have', () => {
      const suggestions = databaseSuggestions({});

      expect(suggestions.map(s => s.text)).toEqual(['Hvilke avrop har vi?']);
    });

    it('asks about one technology when only one is documented', () => {
      const texts = databaseSuggestions({ skills: ['Kotlin'] }).map(s => s.text);

      expect(texts).toContain('Hvem kan Kotlin?');
    });

    /** The screenings cost money and over a minute, so they are the ones that get marked. */
    it('marks the questions that start a new assessment', () => {
      const marked = databaseSuggestions({
        consultants: ['Thomas Andersen'],
        customer: 'Skatteetaten',
        skills: ['Kotlin', 'Kafka']
      }).filter(s => s.assessment).map(s => s.text);

      expect(marked).toEqual([
        'Passer Thomas Andersen til Skatteetaten-avropet?',
        'Hvilke avrop passer Thomas Andersen til?'
      ]);
    });
  });

  describe('followUpSuggestions', () => {
    const consultant = {
      ref: 'K1',
      kind: 'CONSULTANT' as const,
      label: 'Thomas Andersen',
      consultantUserId: 'user-thomas'
    };
    // As the server writes it: customer first, title after an em dash.
    const request = {
      ref: 'A1',
      kind: 'PROJECT_REQUEST' as const,
      label: 'Norges Bank — Konsulentoppdrag: sikkerhetsarkitekt',
      projectRequestId: 9010
    };

    /**
     * The failure this is written around. "Hva krever Norges Bank-avropet?" came back with the
     * requirements and a chip underneath offering to fetch the requirements, with the customer
     * truncated to "Norges" on the way, because the whole label was too long to keep.
     */
    it('does not offer the requirements under an answer that is the requirements', () => {
      const texts = followUpSuggestions('FACTUAL', [request], 'Hva krever Norges Bank-avropet?',
        ['Norges Bank']).map(s => s.text);

      expect(texts).not.toContain('Hva krever Norges Bank-avropet?');
      expect(texts.join(' ')).not.toContain('Norges-avropet');
      // The question the requirements raise is who meets them.
      expect(texts).toContain('Hvem kan jobbe for Norges Bank og har minst 10 års erfaring?');
    });

    it('takes the customer from the label rather than the whole label', () => {
      const texts = followUpSuggestions('SEARCH_RESULT', [request], 'Hvem kan Kotlin?',
        ['Norges Bank']).map(s => s.text);

      expect(texts).toContain('Hva krever Norges Bank-avropet?');
    });

    it('follows a consultant answer with what it did not say about that consultant', () => {
      const texts = followUpSuggestions('FACTUAL', [consultant], 'Hva kan Thomas Andersen best?')
        .map(s => s.text);

      expect(texts).not.toContain('Hva kan Thomas Andersen best?');
      expect(texts).toContain('Hvilke avrop passer Thomas Andersen til?');
      expect(texts).toContain('Hvilke avrop har Thomas Andersen blitt vurdert mot?');
    });

    /** A search hands its hits forward as a set, which is what "alle kandidatene" resolves against. */
    it('follows a search with the set it just produced', () => {
      const texts = followUpSuggestions('SEARCH_RESULT', [consultant], 'Hvem kan Kotlin?')
        .map(s => s.text);

      expect(texts[0]).toBe('Sjekk erfaringen til alle kandidatene');
    });

    /** Scores made a moment ago. Offering to make them again is not a next step. */
    it('does not offer a new assessment under a new assessment', () => {
      const texts = followUpSuggestions(
        'AD_HOC_EVALUATION',
        [consultant, request],
        'Hvem passer best av Thomas Andersen og Joachim Lous til Norges Bank-avropet?',
        ['Norges Bank']
      ).map(s => s.text);

      expect(texts).not.toContain('Hvilke avrop passer Thomas Andersen til?');
      expect(texts).not.toContain('Passer Thomas Andersen til Norges Bank-avropet?');
      // What the scores came from is a question they have not answered.
      expect(texts).toContain('Hva krever Norges Bank-avropet?');
    });

    it('does not offer stored results under stored results', () => {
      const texts = followUpSuggestions(
        'STORED_MATCH',
        [consultant, request],
        'Hvilke avrop har Thomas Andersen blitt vurdert mot?',
        ['Norges Bank']
      ).map(s => s.text);

      expect(texts).not.toContain('Hvilke avrop har Thomas Andersen blitt vurdert mot?');
      expect(texts).not.toContain('Hvem er tidligere vurdert mot Norges Bank-avropet?');
      expect(texts).toContain('Hvilke avrop passer Thomas Andersen til?');
    });

    /**
     * A chip is text and goes back through the resolver, so naming the cited row is not enough: the
     * words have to find that row and no other. "Statens" would reach two of these.
     */
    it('does not name a request whose words reach another one too', () => {
      const statens = {
        ref: 'A1',
        kind: 'PROJECT_REQUEST' as const,
        label: 'Statens vegvesen — Modernisering av fagsystem',
        projectRequestId: 9005
      };

      const alene = followUpSuggestions('SEARCH_RESULT', [statens], 'Hvem kan Kotlin?',
        ['Statens vegvesen', 'Norges Bank']).map(s => s.text);
      const medTvilling = followUpSuggestions('SEARCH_RESULT', [statens], 'Hvem kan Kotlin?',
        ['Statens vegvesen', 'Statens Pensjonskasse']).map(s => s.text);

      expect(alene).toContain('Hva krever Statens vegvesen-avropet?');
      // The whole name is kept, and "Statens" in it reaches both rows.
      expect(medTvilling.join(' ')).not.toContain('avropet');
    });

    it('offers nothing about a request when the database has no matching row', () => {
      const ukjent = {
        ref: 'A1',
        kind: 'PROJECT_REQUEST' as const,
        label: 'Findus Norge — Noe helt annet',
        projectRequestId: 4242
      };

      const texts = followUpSuggestions('SEARCH_RESULT', [ukjent], 'Hvem kan Kotlin?',
        ['Norges Bank', 'Husbanken']).map(s => s.text);

      expect(texts.join(' ')).not.toContain('Findus');
    });

    it('offers nothing when the answer cited nothing', () => {
      expect(followUpSuggestions('NO_GROUNDING', [], 'Passer Thomas?')).toEqual([]);
    });

    /** Three is a nudge; more is a menu, and the answer above it is what the reader came for. */
    it('stops at three', () => {
      expect(followUpSuggestions('SEARCH_RESULT', [consultant, request], 'Hvem kan Kotlin?',
        ['Norges Bank'])).toHaveLength(3);
    });
  });
});
