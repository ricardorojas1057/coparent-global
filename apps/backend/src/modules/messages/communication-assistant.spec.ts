import { reviewCommunication } from './communication-assistant';

describe('reviewCommunication', () => {
  it('suggests a neutral alternative without replacing the original message', () => {
    const original = 'Nunca haces nada, idiota.';
    const review = reviewCommunication(original, 'es-AR');

    expect(review.needsReview).toBe(true);
    expect(review.reasons.length).toBeGreaterThan(0);
    expect(review.suggestion).toContain('bienestar');
    expect(original).toBe('Nunca haces nada, idiota.');
  });

  it('does not intervene in a clear neutral message', () => {
    expect(reviewCommunication('¿Puedes confirmar el horario de mañana?', 'es-AR')).toEqual({
      needsReview: false,
      reasons: [],
      suggestion: null,
    });
  });
});
