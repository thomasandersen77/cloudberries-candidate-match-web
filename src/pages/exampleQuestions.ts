/**
 * Questions that answer from the database as it is, one per kind of grounding: a skill search, a
 * request's requirements, the candidates already assessed. Each opens the assistant with the
 * question filled in and not sent, so trying one costs nothing until the reader presses send.
 */
export const EXAMPLE_QUESTIONS = [
  'Hvem kan Kotlin og Kafka?',
  'Hva krever Skatteetaten-avropet?',
  'Hvilke kandidater er vurdert mot avrop 8?',
];
