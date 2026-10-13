import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { closeDatabase } from '../src/config/database.js';

after(async () => {
  await closeDatabase();
});

test('GET /api/health returns service status', async () => {
  const response = await request(createApp()).get('/api/health');

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.status, 'ok');
  assert.match(response.headers['x-request-id'], /^[0-9a-f-]{36}$/i);
});

test('unknown routes use the common error format', async () => {
  const response = await request(createApp()).get('/api/unknown');

  assert.equal(response.status, 404);
  assert.deepEqual(response.body, {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route GET /api/unknown was not found.'
    }
  });
});

test('POST /api/auth/register validates input before database access', async () => {
  const response = await request(createApp()).post('/api/auth/register').send({
    email: 'not-an-email',
    password: 'short',
    fullName: ''
  });

  assert.equal(response.status, 422);
  assert.equal(response.body.error.code, 'VALIDATION_ERROR');
  assert.ok(response.body.error.fields.email);
  assert.ok(response.body.error.fields.password);
  assert.ok(response.body.error.fields.fullName);
});

test('GET /api/auth/me requires authentication', async () => {
  const response = await request(createApp()).get('/api/auth/me');

  assert.equal(response.status, 401);
  assert.equal(response.body.error.code, 'AUTHENTICATION_REQUIRED');
});
