import test from 'node:test';
import assert from 'node:assert/strict';
import { buildImportValidationReport, parseImportPayload } from '../lib/import.js';

test('parseImportPayload accepts raw card arrays', () => {
  const result = parseImportPayload([{ id: 'card-1' }]);

  assert.deepEqual(result, {
    detectedFormat: 'raw-array',
    cardEntries: [{ id: 'card-1' }],
    language: undefined,
    vocabulary: undefined,
  });
});

test('parseImportPayload rejects Craftlingua envelopes without language metadata', () => {
  assert.throws(
    () => parseImportPayload({ source: 'craftlingua', cards: [] }),
    {
      message: 'Craftlingua envelope missing required "language" object with "name" and "code".',
      statusCode: 422,
    },
  );
});

test('buildImportValidationReport separates accepted and rejected cards', () => {
  const report = buildImportValidationReport([
    {
      id: 'card-1',
      version: '1.0.0',
      prompts: {},
      seed: 'seed-1',
      identity: {},
      stats: {},
      traits: [],
      flavorText: 'ok',
      visuals: {},
      tags: [],
      createdAt: '2026-04-20T00:00:00.000Z',
    },
    {
      id: 'card-2',
      version: '1.0.0',
      prompts: {},
      seed: 'seed-2',
      identity: {},
      stats: {},
      traits: [],
      flavorText: 'bad',
      visuals: {},
      createdAt: '2026-04-20T00:00:00.000Z',
    },
  ]);

  assert.deepEqual(report, {
    format: 'raw-array',
    total: 2,
    acceptedCount: 1,
    rejectedCount: 1,
    accepted: [{ index: 0, id: 'card-1' }],
    rejected: [{ index: 1, id: 'card-2', errors: ['Missing required field: "tags"'] }],
  });
});
