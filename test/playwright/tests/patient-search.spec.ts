import { test, expect } from '@playwright/test';

let apiKey: string;

test.beforeAll(async ({ request }) => {
  const uniqueEmail = `search-test-${Date.now()}@playwright.com`;
  const signupRes = await request.post('/api/signup', {
    data: {
      organizationName: 'Search Test Clinic',
      email: uniqueEmail,
      password: 'password123',
      firstName: 'Search',
      lastName: 'Tester',
    },
  });
  const body = await signupRes.json();
  apiKey = body.apiKey;

  // Create a known patient
  await request.post('/api/patient', {
    headers: { 'x-api-key': apiKey },
    data: {
      firstName: 'Jane',
      lastName: 'Smithson',
      dateOfBirth: '1985-03-15',
      sex: 'Female',
    },
  });
});

test.describe('Patient Search', () => {
  test('should find patient by first name', async ({ request }) => {
    const response = await request.get('/api/patient?search=Jane', {
      headers: { 'x-api-key': apiKey },
    });
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data[0].firstName).toBe('Jane');
  });

  test('should find patient by last name', async ({ request }) => {
    const response = await request.get('/api/patient?search=Smithson', {
      headers: { 'x-api-key': apiKey },
    });
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data[0].lastName).toBe('Smithson');
  });

  test('should find patient by full name (space-split search)', async ({ request }) => {
    const response = await request.get('/api/patient?search=Jane%20Smithson', {
      headers: { 'x-api-key': apiKey },
    });
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data[0].firstName).toBe('Jane');
    expect(body.data[0].lastName).toBe('Smithson');
  });

  test('should find patient by reversed full name', async ({ request }) => {
    const response = await request.get('/api/patient?search=Smithson%20Jane', {
      headers: { 'x-api-key': apiKey },
    });
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.data.length).toBeGreaterThan(0);
  });

  test('should return empty for non-existent patient', async ({ request }) => {
    const response = await request.get('/api/patient?search=Zzzznonexistent', {
      headers: { 'x-api-key': apiKey },
    });
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.data.length).toBe(0);
  });
});
