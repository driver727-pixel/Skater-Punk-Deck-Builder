import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildUserDisplayName,
  getConfiguredAdminEmails,
  isStrongPassword,
  normalizeEmail,
  shouldGrantAdminAccess,
} from '../lib/auth.js';

test('normalizeEmail trims and lowercases', () => {
  assert.equal(normalizeEmail('  Admin@Example.COM '), 'admin@example.com');
});

test('getConfiguredAdminEmails returns normalized non-empty emails', () => {
  assert.deepEqual(
    getConfiguredAdminEmails(' Admin@Example.com, ,second@example.com '),
    ['admin@example.com', 'second@example.com'],
  );
});

test('shouldGrantAdminAccess matches configured normalized emails', () => {
  assert.equal(
    shouldGrantAdminAccess('Admin@Example.com', ['admin@example.com']),
    true,
  );
  assert.equal(
    shouldGrantAdminAccess('player@example.com', ['admin@example.com']),
    false,
  );
});

test('isStrongPassword requires 12 chars with upper lower number and symbol', () => {
  assert.equal(isStrongPassword('Weakpass12'), false);
  assert.equal(isStrongPassword('Stronger!Pass12'), true);
});

test('buildUserDisplayName prefers explicit name and falls back to email stem', () => {
  assert.equal(buildUserDisplayName({ displayName: ' Rider ', email: 'test@example.com' }), 'Rider');
  assert.equal(buildUserDisplayName({ email: 'test@example.com' }), 'test');
  assert.equal(buildUserDisplayName({}), 'Skater');
});
