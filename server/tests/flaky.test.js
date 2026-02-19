/**
 * Flaky Test Demonstration
 * ========================
 * This file demonstrates a test that randomly fails to showcase
 * retry mechanisms in Jest and CI pipelines.
 *
 * In CI, this is handled by:
 *   - jest-circus retry: jest.retryTimes(3)
 *   - CI-level retry via workflow configuration
 *
 * The test has a ~50% chance of failing on any single run,
 * but with 3 retries the probability of all attempts failing
 * is only ~6.25% (0.5^4), making the suite reliably green.
 */

// Enable Jest retry for this file (requires jest-circus, the default runner in Jest 27+)
jest.retryTimes(3, { logErrorsBeforeRetry: true });

describe('Flaky Test Demonstration', () => {
    it('should eventually pass (randomly fails ~50% of the time)', () => {
        const randomValue = Math.random();
        console.log(`  [Flaky Test] Random value: ${randomValue.toFixed(4)} — ${randomValue > 0.5 ? 'PASS' : 'FAIL (will retry)'}`);

        // This assertion fails ~50% of the time
        expect(randomValue).toBeGreaterThan(0.5);
    });

    it('should always pass (control test)', () => {
        // This test always passes — included so the flaky suite
        // has a mix of reliable and unreliable tests.
        expect(1 + 1).toBe(2);
    });
});
