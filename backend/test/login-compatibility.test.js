import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import request from 'supertest';
process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters';
const { createApp } = await import('../src/app.js');
const { pool } = await import('../src/config/database.js');
const { createAccessToken } = await import('../src/services/token.service.js');
const { loginUser, loginAdminUser } = await import('../src/services/auth.service.js');

test('existing passwords continue working and admin cannot use customer login', async () => {
  const password = 'a'.repeat(72) + 'existing-long-password';
  const user = { id: 7, email: 'admin@example.com', role: 'admin', status: 'active', password_hash: await bcrypt.hash(password, 4) };
  mock.method(pool, 'execute', async () => [[user]]);
  mock.method(pool, 'getConnection', async () => ({ execute: async () => [{ affectedRows: 1 }], release() {} }));
  try {
    await assert.rejects(loginUser({ email: user.email, password }), error => error.code === 'INVALID_CREDENTIALS');
    const result = await loginAdminUser({ email: user.email, password });
    assert.equal(result.user.role, 'admin');
    assert.ok(result.accessToken);
    assert.equal(result.user.password_hash, undefined);
    user.role = 'customer';
    const customer = await loginUser({ email: user.email, password });
    assert.equal(customer.user.role, 'customer');
    assert.ok(customer.accessToken);
  } finally { mock.restoreAll(); }
});

test('changing password hash invalidates existing access token immediately', async () => {
  const user = { id: 7, email: 'admin@example.com', role: 'admin', status: 'active', password_hash: await bcrypt.hash('old-password', 4) };
  const token = createAccessToken(user);
  mock.method(pool, 'execute', async () => [[user]]);
  try {
    const app = createApp();
    let response = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    assert.equal(response.status, 200);
    assert.equal(response.body.data.user.password_hash, undefined);
    user.password_hash = await bcrypt.hash('new-password', 4);
    response = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    assert.equal(response.status, 401);
    response = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${createAccessToken(user)}`);
    assert.equal(response.status, 200);
  } finally { mock.restoreAll(); }
});

test('new registrations reject passwords over 72 UTF-8 bytes', async () => {
  const response = await request(createApp()).post('/api/auth/register').send({ email: 'customer@example.com', fullName: 'Customer', password: '密'.repeat(25) });
  assert.equal(response.status, 422);
  assert.ok(response.body.error.fields.password);
});
