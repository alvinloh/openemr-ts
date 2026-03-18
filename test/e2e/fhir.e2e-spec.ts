import request from 'supertest';

const BASE = 'http://localhost:3000';

describe('FHIR R4 API (e2e)', () => {
  let token: string;

  beforeAll(async () => {
    const login = await request(BASE)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin' });
    token = login.body.accessToken;
  });

  const auth = () => ({ Authorization: `Bearer ${token}` });

  it('GET /fhir/metadata — should return CapabilityStatement', async () => {
    const res = await request(BASE)
      .get('/fhir/metadata')
      .set(auth())
      .expect(200);

    expect(res.body.resourceType).toBe('CapabilityStatement');
    expect(res.body.fhirVersion).toBe('4.0.1');
    expect(res.body.rest[0].resource.length).toBe(8);
  });

  it('GET /fhir/Patient — should return Bundle', async () => {
    const res = await request(BASE)
      .get('/fhir/Patient')
      .set(auth())
      .expect(200);

    expect(res.body.resourceType).toBe('Bundle');
    expect(res.body.type).toBe('searchset');
    expect(res.body.total).toBeGreaterThanOrEqual(1);

    const patient = res.body.entry[0].resource;
    expect(patient.resourceType).toBe('Patient');
    expect(patient.name[0].family).toBeDefined();
  });

  it('GET /fhir/Patient/:id — should return single Patient resource', async () => {
    // First get a patient UUID
    const bundle = await request(BASE)
      .get('/fhir/Patient')
      .set(auth());

    const uuid = bundle.body.entry[0].resource.id;

    const res = await request(BASE)
      .get(`/fhir/Patient/${uuid}`)
      .set(auth())
      .expect(200);

    expect(res.body.resourceType).toBe('Patient');
    expect(res.body.id).toBe(uuid);
    expect(res.body.identifier).toBeDefined();
  });

  it('GET /fhir/Patient — should search by name', async () => {
    const res = await request(BASE)
      .get('/fhir/Patient?name=Doe')
      .set(auth())
      .expect(200);

    expect(res.body.resourceType).toBe('Bundle');
  });

  it('GET /fhir/Observation — should return vitals and lab results', async () => {
    // Use patient ID 1 (John Doe from earlier tests)
    const res = await request(BASE)
      .get('/fhir/Observation?patient=1&category=vital-signs')
      .set(auth())
      .expect(200);

    expect(res.body.resourceType).toBe('Bundle');
    if (res.body.total > 0) {
      const obs = res.body.entry[0].resource;
      expect(obs.resourceType).toBe('Observation');
      expect(obs.category[0].coding[0].code).toBe('vital-signs');
    }
  });

  it('GET /fhir/MedicationRequest — should return medication requests', async () => {
    const res = await request(BASE)
      .get('/fhir/MedicationRequest?patient=1')
      .set(auth())
      .expect(200);

    expect(res.body.resourceType).toBe('Bundle');
    if (res.body.total > 0) {
      expect(res.body.entry[0].resource.resourceType).toBe('MedicationRequest');
    }
  });

  it('GET /fhir/Condition — should return conditions', async () => {
    const res = await request(BASE)
      .get('/fhir/Condition?patient=1')
      .set(auth())
      .expect(200);

    expect(res.body.resourceType).toBe('Bundle');
  });

  it('GET /fhir/AllergyIntolerance — should return allergies', async () => {
    const res = await request(BASE)
      .get('/fhir/AllergyIntolerance?patient=1')
      .set(auth())
      .expect(200);

    expect(res.body.resourceType).toBe('Bundle');
  });

  it('GET /fhir/Encounter — should return encounters', async () => {
    const res = await request(BASE)
      .get('/fhir/Encounter?patient=1')
      .set(auth())
      .expect(200);

    expect(res.body.resourceType).toBe('Bundle');
    if (res.body.total > 0) {
      const enc = res.body.entry[0].resource;
      expect(enc.resourceType).toBe('Encounter');
      expect(enc.class.system).toBe('http://terminology.hl7.org/CodeSystem/v3-ActCode');
    }
  });
});
