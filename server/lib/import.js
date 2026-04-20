const REQUIRED_CARD_KEYS = [
  'id',
  'version',
  'prompts',
  'seed',
  'identity',
  'stats',
  'traits',
  'flavorText',
  'visuals',
  'tags',
  'createdAt',
];

function createImportError(statusCode, message) {
  return Object.assign(new Error(message), { statusCode });
}

export function parseImportPayload(body) {
  if (!body || typeof body !== 'object') {
    throw createImportError(400, 'Request body must be a JSON object or array.');
  }

  if (Array.isArray(body)) {
    return {
      detectedFormat: 'raw-array',
      cardEntries: body,
      language: undefined,
      vocabulary: undefined,
    };
  }

  if (body.source === 'craftlingua') {
    if (!body.language || typeof body.language !== 'object' || !body.language.name || !body.language.code) {
      throw createImportError(422, 'Craftlingua envelope missing required "language" object with "name" and "code".');
    }

    return {
      detectedFormat: 'craftlingua-envelope',
      cardEntries: Array.isArray(body.cards) ? body.cards : [],
      language: body.language,
      vocabulary: Array.isArray(body.vocabulary) ? body.vocabulary : [],
    };
  }

  if (typeof body.version === 'string' && Array.isArray(body.cards)) {
    return {
      detectedFormat: 'collection-export',
      cardEntries: body.cards,
      language: undefined,
      vocabulary: undefined,
    };
  }

  throw createImportError(
    422,
    'Unrecognised JSON format. Expected CardPayload[], { version, cards }, or { source: "craftlingua", language, cards }.',
  );
}

export function buildImportValidationReport(body) {
  const { detectedFormat, cardEntries, language, vocabulary } = parseImportPayload(body);
  const accepted = [];
  const rejected = [];

  for (let index = 0; index < cardEntries.length; index += 1) {
    const card = cardEntries[index];
    const errors = [];

    if (!card || typeof card !== 'object' || Array.isArray(card)) {
      rejected.push({ index, errors: ['Entry is not an object.'] });
      continue;
    }

    for (const key of REQUIRED_CARD_KEYS) {
      if (card[key] === undefined || card[key] === null) {
        errors.push(`Missing required field: "${key}"`);
      }
    }

    if (errors.length > 0) {
      rejected.push({ index, id: card.id, errors });
    } else {
      accepted.push({ index, id: card.id });
    }
  }

  return {
    format: detectedFormat,
    total: cardEntries.length,
    acceptedCount: accepted.length,
    rejectedCount: rejected.length,
    accepted,
    rejected,
    ...(language ? { language } : {}),
    ...(vocabulary ? { vocabularyCount: vocabulary.length } : {}),
  };
}
