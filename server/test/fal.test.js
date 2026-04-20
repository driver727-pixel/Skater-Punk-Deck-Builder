import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractFalRequestConfigCandidate,
  normalizeBoardReferenceUrls,
  sanitizeFalRequestConfig,
} from '../lib/fal.js';

test('extractFalRequestConfigCandidate finds nested config payloads', () => {
  const candidate = extractFalRequestConfigCandidate({
    settings: { guidance_scale: 4, lora_path: 'https://fal.media/files/x/model.safetensors' },
  });
  assert.deepEqual(candidate, {
    guidance_scale: 4,
    lora_path: 'https://fal.media/files/x/model.safetensors',
  });
});

test('sanitizeFalRequestConfig normalizes lora shorthand into loras array', () => {
  const config = sanitizeFalRequestConfig({
    guidance_scale: 4,
    lora_path: 'https://fal.media/files/x/model.safetensors',
    lora_scale: '0.75',
  });

  assert.deepEqual(config, {
    guidance_scale: 4,
    loras: [{ path: 'https://fal.media/files/x/model.safetensors', scale: 0.75 }],
  });
});

test('normalizeBoardReferenceUrls accepts canonical board asset URLs including webp', () => {
  const urls = normalizeBoardReferenceUrls([
    'https://punchskater.com/assets/boards/deck/street.webp',
    'https://punchskater.com/assets/boards/drivetrain/gear-drive.webp',
    'https://punchskater.com/assets/boards/wheels/cloud-wheels.webp',
    'https://punchskater.com/assets/boards/battery/peli.webp',
  ]);

  assert.deepEqual(urls, [
    'https://punchskater.com/assets/boards/deck/street.webp',
    'https://punchskater.com/assets/boards/drivetrain/gear-drive.webp',
    'https://punchskater.com/assets/boards/wheels/cloud-wheels.webp',
    'https://punchskater.com/assets/boards/battery/peli.webp',
  ]);
});

test('normalizeBoardReferenceUrls rejects non-canonical origins and paths', () => {
  assert.equal(
    normalizeBoardReferenceUrls([
      'https://evil.example/assets/boards/deck/street.webp',
      'https://punchskater.com/assets/boards/drivetrain/gear-drive.webp',
      'https://punchskater.com/assets/boards/wheels/cloud-wheels.webp',
      'https://punchskater.com/assets/boards/battery/peli.webp',
    ]),
    null,
  );
});
