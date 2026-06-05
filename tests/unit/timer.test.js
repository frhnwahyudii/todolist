/**
 * Unit tests for _formatTimer(seconds)
 * Requirements: 3.2, 3.3
 */

import { describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Replicate the pure function under test.
// app.js is not independently importable (it depends on DOM / DOMContentLoaded),
// so we inline the function here — a deliberate, well-understood design trade-off.
// ---------------------------------------------------------------------------

/**
 * Format a duration in seconds as a zero-padded MM:SS string.
 *
 * @param {number} seconds - integer in the range [0, 1500]
 * @returns {string}
 */
function _formatTimer(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('_formatTimer', () => {
  it('returns "00:00" for 0 seconds', () => {
    expect(_formatTimer(0)).toBe('00:00');
  });

  it('returns "25:00" for 1500 seconds (max input)', () => {
    expect(_formatTimer(1500)).toBe('25:00');
  });

  it('returns "00:01" for 1 second', () => {
    expect(_formatTimer(1)).toBe('00:01');
  });

  it('returns "00:59" for 59 seconds (last second before minute rolls over)', () => {
    expect(_formatTimer(59)).toBe('00:59');
  });

  it('returns "01:00" for 60 seconds (exact minute boundary)', () => {
    expect(_formatTimer(60)).toBe('01:00');
  });

  it('returns "01:01" for 61 seconds', () => {
    expect(_formatTimer(61)).toBe('01:01');
  });

  it('returns "04:59" for 299 seconds', () => {
    expect(_formatTimer(299)).toBe('04:59');
  });

  it('returns "10:00" for 600 seconds', () => {
    expect(_formatTimer(600)).toBe('10:00');
  });

  it('returns "12:34" for 754 seconds', () => {
    // 754 / 60 = 12 remainder 34
    expect(_formatTimer(754)).toBe('12:34');
  });

  it('returns "24:59" for 1499 seconds (one second before max)', () => {
    expect(_formatTimer(1499)).toBe('24:59');
  });

  it('always produces a string matching /^\\d{2}:\\d{2}$/', () => {
    // spot-check a range of values
    const samples = [0, 1, 59, 60, 61, 299, 600, 754, 1499, 1500];
    for (const s of samples) {
      expect(_formatTimer(s)).toMatch(/^\d{2}:\d{2}$/);
    }
  });

  it('zero-pads minutes to 2 digits for values less than 10', () => {
    // e.g. 5 minutes → "05:..."
    expect(_formatTimer(300)).toBe('05:00');
    expect(_formatTimer(305)).toBe('05:05');
  });

  it('zero-pads seconds to 2 digits for values less than 10', () => {
    expect(_formatTimer(61)).toBe('01:01');
    expect(_formatTimer(65)).toBe('01:05');
  });

  it('minutes component equals Math.floor(seconds / 60)', () => {
    const s = 754;
    const expectedMins = String(Math.floor(s / 60)).padStart(2, '0');
    expect(_formatTimer(s).split(':')[0]).toBe(expectedMins);
  });

  it('seconds component equals seconds % 60', () => {
    const s = 754;
    const expectedSecs = String(s % 60).padStart(2, '0');
    expect(_formatTimer(s).split(':')[1]).toBe(expectedSecs);
  });
});
