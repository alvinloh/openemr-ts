import { test, expect } from '@playwright/test';

let apiKey: string;
let endpointUuid: string;

test.describe.configure({ mode: 'serial' });

test.describe('Endpoint Registration API', () => {
  test('setup: create tenant', async ({ request }) => {
    const ts = Date.now();
    const response = await request.post('/api/signup', {
      data: {
        organizationName: `Endpoint Test ${ts}`,
        email: `ep-test-${ts}@playwright.com`,
        password: 'password123',
        firstName: 'EP',
        lastName: 'Tester',
      },
    });
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    apiKey = body.apiKey;
  });

  test('should register an HTTP endpoint', async ({ request }) => {
    const response = await request.post('/api/tenant/endpoints', {
      headers: { 'x-api-key': apiKey },
      data: {
        name: 'test-lab-http',
        transport: 'HTTP',
        url: 'https://httpbin.org/post',
      },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.name).toBe('test-lab-http');
    expect(body.transport).toBe('HTTP');
    expect(body.status).toBe('active');
    endpointUuid = body.uuid;
  });

  test('should list endpoints', async ({ request }) => {
    const response = await request.get('/api/tenant/endpoints', {
      headers: { 'x-api-key': apiKey },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.length).toBe(1);
    expect(body[0].name).toBe('test-lab-http');
  });

  test('should get endpoint details', async ({ request }) => {
    const response = await request.get(`/api/tenant/endpoints/${endpointUuid}`, {
      headers: { 'x-api-key': apiKey },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.name).toBe('test-lab-http');
    expect(body.consecutiveFailures).toBe(0);
  });

  test('should update an endpoint', async ({ request }) => {
    const response = await request.put(`/api/tenant/endpoints/${endpointUuid}`, {
      headers: { 'x-api-key': apiKey },
      data: { name: 'updated-lab-http' },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.name).toBe('updated-lab-http');
  });

  test('should delete an endpoint', async ({ request }) => {
    const response = await request.delete(`/api/tenant/endpoints/${endpointUuid}`, {
      headers: { 'x-api-key': apiKey },
    });
    expect(response.status()).toBe(204);

    const listRes = await request.get('/api/tenant/endpoints', {
      headers: { 'x-api-key': apiKey },
    });
    const body = await listRes.json();
    expect(body.length).toBe(0);
  });

  test('should enforce endpoint limit on free plan', async ({ request }) => {
    await request.post('/api/tenant/endpoints', {
      headers: { 'x-api-key': apiKey },
      data: { name: 'ep-1', transport: 'HTTP', url: 'https://example.com/1' },
    });

    const response = await request.post('/api/tenant/endpoints', {
      headers: { 'x-api-key': apiKey },
      data: { name: 'ep-2', transport: 'HTTP', url: 'https://example.com/2' },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.message).toContain('limit');
  });
});
