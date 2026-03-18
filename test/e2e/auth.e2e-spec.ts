import request from 'supertest';

const BASE = 'http://localhost:3000';

describe('Auth (e2e)', () => {
  it('POST /api/auth/login — should return JWT token', async () => {
    const res = await request(BASE)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin' })
      .expect(200);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.user.username).toBe('admin');
    expect(res.body.user.role).toBe('admin');
  });

  it('POST /api/auth/login — should reject invalid credentials', async () => {
    await request(BASE)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'wrong' })
      .expect(401);
  });

  it('POST /api/auth/refresh — should return new tokens', async () => {
    const login = await request(BASE)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin' });

    const res = await request(BASE)
      .post('/api/auth/refresh')
      .send({ refreshToken: login.body.refreshToken })
      .expect(200);

    expect(res.body.accessToken).toBeDefined();
  });

  it('GET /api/patient — should reject without token', async () => {
    await request(BASE).get('/api/patient').expect(401);
  });
});
