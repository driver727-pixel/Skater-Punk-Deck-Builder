import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildFallbackDistrictWeatherPayload,
  buildWeatherAccessRule,
  registerWeatherRoutes,
  resolveWeatherSummary,
} from '../routes/weather.js';

function createAppHarness() {
  const routes = [];
  return {
    routes,
    get(path, ...handlers) {
      routes.push({ method: 'GET', path, handlers });
    },
  };
}

async function invokeRoute(route) {
  const req = {};
  const res = {
    statusCode: 200,
    body: undefined,
    ended: false,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      this.ended = true;
      return this;
    },
  };

  for (let index = 0; index < route.handlers.length && !res.ended;) {
    const handler = route.handlers[index];
    if (handler.length >= 3) {
      let nextCalled = false;
      await handler(req, res, () => {
        nextCalled = true;
      });
      if (!nextCalled) break;
      index += 1;
      continue;
    }
    await handler(req, res);
    index += 1;
  }

  return res;
}

test('resolveWeatherSummary prioritizes rain hazards before wind and heat', () => {
  assert.equal(resolveWeatherSummary({ rainMm: 7, weatherCode: 0, windSpeedKph: 0, temperatureC: 0 }), 'Heavy rain');
  assert.equal(resolveWeatherSummary({ rainMm: 0, weatherCode: 95, windSpeedKph: 0, temperatureC: 0 }), 'Heavy rain');
  assert.equal(resolveWeatherSummary({ rainMm: 0.2, weatherCode: 0, windSpeedKph: 60, temperatureC: 40 }), 'Rain');
  assert.equal(resolveWeatherSummary({ rainMm: 0, weatherCode: 0, windSpeedKph: 45, temperatureC: 40 }), 'Strong wind');
  assert.equal(resolveWeatherSummary({ rainMm: 0, weatherCode: 0, windSpeedKph: 10, temperatureC: 35 }), 'Heatwave');
  assert.equal(resolveWeatherSummary({ rainMm: null, weatherCode: null, windSpeedKph: null, temperatureC: null }), 'Clear');
});

test('buildWeatherAccessRule only restricts districts during heavy rain', () => {
  assert.equal(buildWeatherAccessRule('The Grid', 'Canberra', 'Rain'), null);
  assert.deepEqual(
    buildWeatherAccessRule('The Forest', 'Hobart', 'Heavy rain'),
    {
      requiredBoardType: 'Mountain',
      reason: 'Heavy rain over Hobart has turned The Forest into Mountain-board-only territory.',
      source: 'heavy-rain',
    },
  );
});

test('buildFallbackDistrictWeatherPayload returns offline entries for every district', () => {
  const payload = buildFallbackDistrictWeatherPayload();
  assert.equal(payload.stale, true);
  assert.equal(payload.source, 'fallback');
  assert.equal(payload.districts.length, 8);
  assert.equal(payload.districts.every((district) => district.summary === 'Weather uplink offline'), true);
  assert.equal(payload.districts.every((district) => district.accessRule === null), true);
});

test('registerWeatherRoutes serves district weather through rate limit middleware', async () => {
  const app = createAppHarness();
  let rateLimitCalls = 0;
  const expectedPayload = {
    generatedAt: '2026-04-28T00:00:00.000Z',
    stale: false,
    source: 'test',
    districts: [],
  };

  registerWeatherRoutes(app, {
    weatherRateLimit: (_req, _res, next) => {
      rateLimitCalls += 1;
      next();
    },
    districtWeatherService: {
      getDistrictWeatherPayload: async () => expectedPayload,
    },
  });

  assert.equal(app.routes.length, 1);
  assert.equal(app.routes[0].path, '/api/district-weather');

  const res = await invokeRoute(app.routes[0]);
  assert.equal(rateLimitCalls, 1);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, expectedPayload);
});
