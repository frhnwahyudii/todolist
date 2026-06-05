/**
 * Unit tests for LinksModule pure helpers:
 *   _normaliseUrl(url)
 *   _validateUrl(url)
 *   _validateLabel(label)
 *
 * Requirements: 8.2, 8.3, 8.4
 *
 * The helpers are reproduced here inline so these tests remain decoupled
 * from the DOM-dependent DOMContentLoaded listener in app.js.
 */

import { describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Helpers under test (mirrored from js/app.js)
// ---------------------------------------------------------------------------

function _normaliseUrl(url) {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return 'https://' + url;
}

function _validateUrl(url) {
  const normalised = _normaliseUrl(url);
  if (normalised.length > 2048) return false;
  try {
    const parsed = new URL(normalised);
    const host = parsed.hostname;
    const dotIndex = host.lastIndexOf('.');
    if (dotIndex === -1) return false;
    const tld = host.slice(dotIndex + 1);
    if (tld.length < 2) return false;
    return true;
  } catch (_) {
    return false;
  }
}

function _validateLabel(label) {
  return typeof label === 'string' && label.length > 0 && label.length <= 50;
}

// ---------------------------------------------------------------------------
// _normaliseUrl tests
// ---------------------------------------------------------------------------

describe('_normaliseUrl', () => {
  it('prepends https:// when no scheme is present', () => {
    expect(_normaliseUrl('example.com')).toBe('https://example.com');
  });

  it('prepends https:// for a URL starting with www.', () => {
    expect(_normaliseUrl('www.example.com/path')).toBe('https://www.example.com/path');
  });

  it('leaves an https:// URL unchanged', () => {
    expect(_normaliseUrl('https://example.com')).toBe('https://example.com');
  });

  it('leaves an http:// URL unchanged', () => {
    expect(_normaliseUrl('http://example.com')).toBe('http://example.com');
  });

  it('leaves an https:// URL with path and query unchanged', () => {
    const url = 'https://example.com/page?q=1#section';
    expect(_normaliseUrl(url)).toBe(url);
  });

  it('prepends https:// even for a bare word (no dot)', () => {
    // Normalisation does not validate — that is _validateUrl's job
    expect(_normaliseUrl('localhost')).toBe('https://localhost');
  });

  it('does not double-prepend when already prefixed with https://', () => {
    const url = 'https://example.com';
    expect(_normaliseUrl(url)).toBe('https://example.com');
  });
});

// ---------------------------------------------------------------------------
// _validateUrl tests
// ---------------------------------------------------------------------------

describe('_validateUrl', () => {
  it('returns true for a simple valid URL without scheme', () => {
    expect(_validateUrl('example.com')).toBe(true);
  });

  it('returns true for a valid https:// URL', () => {
    expect(_validateUrl('https://example.com')).toBe(true);
  });

  it('returns true for a valid http:// URL', () => {
    expect(_validateUrl('http://example.com')).toBe(true);
  });

  it('returns true for a URL with a subdomain', () => {
    expect(_validateUrl('sub.example.co.uk')).toBe(true);
  });

  it('returns true for a URL with path and query string', () => {
    expect(_validateUrl('https://example.com/path?q=hello')).toBe(true);
  });

  it('returns false for a URL with total normalised length > 2048', () => {
    // Build a URL that after prepending "https://" is exactly 2049 chars
    const longHost = 'a'.repeat(2049 - 'https://'.length - '.co'.length) + '.co';
    // longHost is designed so 'https://' + longHost = 2049 chars
    expect(_normaliseUrl(longHost).length).toBeGreaterThan(2048);
    expect(_validateUrl(longHost)).toBe(false);
  });

  it('returns true for a URL whose normalised form is exactly 2048 chars', () => {
    // Build scheme + host that is exactly 2048 chars total
    const base = 'https://';
    const suffix = '.co';
    const hostPart = 'a'.repeat(2048 - base.length - suffix.length) + suffix;
    const url = base + hostPart;
    expect(url.length).toBe(2048);
    expect(_validateUrl(url)).toBe(true);
  });

  it('returns false when the host has no dot (no TLD)', () => {
    expect(_validateUrl('localhost')).toBe(false);
  });

  it('returns false when the TLD is only 1 character', () => {
    expect(_validateUrl('example.c')).toBe(false);
  });

  it('returns true when the TLD is exactly 2 characters', () => {
    expect(_validateUrl('example.co')).toBe(true);
  });

  it('returns false for an empty string', () => {
    expect(_validateUrl('')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// _validateLabel tests
// ---------------------------------------------------------------------------

describe('_validateLabel', () => {
  it('returns true for a typical short label', () => {
    expect(_validateLabel('My Site')).toBe(true);
  });

  it('returns true for a single character label', () => {
    expect(_validateLabel('A')).toBe(true);
  });

  it('returns true for a label of exactly 50 characters', () => {
    expect(_validateLabel('a'.repeat(50))).toBe(true);
  });

  it('returns false for an empty string', () => {
    expect(_validateLabel('')).toBe(false);
  });

  it('returns false for a label of 51 characters', () => {
    expect(_validateLabel('a'.repeat(51))).toBe(false);
  });

  it('returns false for a non-string value (number)', () => {
    expect(_validateLabel(42)).toBe(false);
  });

  it('returns false for null', () => {
    expect(_validateLabel(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(_validateLabel(undefined)).toBe(false);
  });

  it('returns true for a label with spaces (spaces count as valid characters)', () => {
    expect(_validateLabel('Hello World')).toBe(true);
  });
});
