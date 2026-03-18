import request from 'supertest';

const BASE = 'http://localhost:3000';

describe('Clinical Workflow (e2e)', () => {
  let token: string;
  let patientId: number;
  let patientUuid: string;
  let encounterUuid: string;

  beforeAll(async () => {
    const login = await request(BASE)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin' });
    token = login.body.accessToken;
  });

  const auth = () => ({ Authorization: `Bearer ${token}` });

  // ── Patient CRUD ──

  it('POST /api/patient — should create patient', async () => {
    const res = await request(BASE)
      .post('/api/patient')
      .set(auth())
      .send({
        firstName: 'E2E',
        lastName: 'TestPatient',
        dateOfBirth: '2000-06-15',
        sex: 'Female',
        phoneCell: '555-9999',
        email: 'e2e@test.com',
      })
      .expect(201);

    expect(res.body.data.firstName).toBe('E2E');
    expect(res.body.data.mrn).toBeDefined();
    expect(res.body.data.uuid).toBeDefined();
    patientId = res.body.data.id;
    patientUuid = res.body.data.uuid;
  });

  it('GET /api/patient — should search patients', async () => {
    const res = await request(BASE)
      .get('/api/patient?search=E2E')
      .set(auth())
      .expect(200);

    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.meta.total).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/patient/:uuid — should get patient by UUID', async () => {
    const res = await request(BASE)
      .get(`/api/patient/${patientUuid}`)
      .set(auth())
      .expect(200);

    expect(res.body.data.firstName).toBe('E2E');
  });

  it('PUT /api/patient/:uuid — should update patient', async () => {
    const res = await request(BASE)
      .put(`/api/patient/${patientUuid}`)
      .set(auth())
      .send({ phoneHome: '555-0000' })
      .expect(200);

    expect(res.body.data.phoneHome).toBe('555-0000');
  });

  // ── Encounter ──

  it('POST /api/patient/:pid/encounter — should create encounter', async () => {
    const res = await request(BASE)
      .post(`/api/patient/${patientId}/encounter`)
      .set(auth())
      .send({
        providerId: 1,
        encounterDate: '2026-03-17T14:00:00Z',
        classCode: 'AMB',
        reasonForVisit: 'E2E test visit',
        diagnoses: [
          { code: 'J06.9', description: 'Acute upper respiratory infection', isPrimary: true },
        ],
      })
      .expect(201);

    expect(res.body.data.reasonForVisit).toBe('E2E test visit');
    encounterUuid = res.body.data.uuid;
  });

  it('GET /api/patient/:pid/encounter — should list encounters', async () => {
    const res = await request(BASE)
      .get(`/api/patient/${patientId}/encounter`)
      .set(auth())
      .expect(200);

    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  // ── Vitals ──

  it('POST /api/patient/:pid/encounter/:eid/vital — should add vitals', async () => {
    const res = await request(BASE)
      .post(`/api/patient/${patientId}/encounter/${encounterUuid}/vital`)
      .set(auth())
      .send({
        observedAt: '2026-03-17T14:10:00Z',
        temperature: 99.1,
        pulse: 88,
        bloodPressureSystolic: 130,
        bloodPressureDiastolic: 85,
        oxygenSaturation: 97,
      })
      .expect(201);

    expect(res.body.data.pulse).toBe(88);
  });

  // ── Medication ──

  it('POST /api/patient/:pid/medication — should add medication', async () => {
    const res = await request(BASE)
      .post(`/api/patient/${patientId}/medication`)
      .set(auth())
      .send({
        drugName: 'Amoxicillin',
        dosage: '500',
        unit: 'mg',
        route: 'oral',
        frequency: 'three times daily',
        startDate: '2026-03-17',
      })
      .expect(201);

    expect(res.body.data.drugName).toBe('Amoxicillin');
  });

  it('GET /api/patient/:pid/medication — should list medications', async () => {
    const res = await request(BASE)
      .get(`/api/patient/${patientId}/medication`)
      .set(auth())
      .expect(200);

    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  // ── Lab Order ──

  it('POST /api/procedure — should create lab order', async () => {
    const res = await request(BASE)
      .post('/api/procedure')
      .set(auth())
      .send({
        patientId,
        providerId: 1,
        orderDate: '2026-03-17',
        orderType: 'laboratory_test',
        codes: [{ procedureCode: '80053', procedureName: 'Comprehensive metabolic panel' }],
      })
      .expect(201);

    expect(res.body.data.status).toBe('pending');
  });

  // ── Allergy ──

  it('POST /api/patient/:pid/allergy — should add allergy', async () => {
    const res = await request(BASE)
      .post(`/api/patient/${patientId}/allergy`)
      .set(auth())
      .send({
        substance: 'Penicillin',
        reaction: 'Hives',
        severity: 'moderate',
        status: 'active',
      })
      .expect(201);

    expect(res.body.data.substance).toBe('Penicillin');
  });

  // ── Condition ──

  it('POST /api/patient/:pid/condition — should add condition', async () => {
    const res = await request(BASE)
      .post(`/api/patient/${patientId}/condition`)
      .set(auth())
      .send({
        code: 'I10',
        codeSystem: 'ICD-10',
        title: 'Essential hypertension',
        status: 'active',
        onsetDate: '2025-01-01',
      })
      .expect(201);

    expect(res.body.data.title).toBe('Essential hypertension');
  });
});
