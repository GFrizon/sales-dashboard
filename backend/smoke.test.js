const app = require('./src/server');

describe('API smoke', () => {
  let server;
  let baseUrl;

  beforeAll((done) => {
    server = app.listen(0, () => {
      const { port } = server.address();
      baseUrl = `http://127.0.0.1:${port}`;
      done();
    });
  });

  afterAll((done) => {
    if (!server) return done();
    server.close(done);
  });

  test('GET /health responde status ok', async () => {
    const res = await fetch(`${baseUrl}/health`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('status', 'ok');
    expect(body).toHaveProperty('cache');
  });

  test('POST /auth/login responde JSON (rota ativa)', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect([400, 401]).toContain(res.status);
    const body = await res.json();
    expect(body).toHaveProperty('error');
  });
});

