import { Controller, Get, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { OAuth2OrJwtGuard } from '../oauth2/guards/oauth2-or-jwt.guard.js';
import { JwtOrApiKeyGuard } from '../common/guards/jwt-or-apikey.guard.js';
import { Public } from '../common/decorators/public.decorator.js';
import { Request } from 'express';
import { PatientService } from '../patient/patient.service.js';
import { EncounterService } from '../encounter/encounter.service.js';
import { MedicationService } from '../medication/medication.service.js';
import { LabService } from '../lab/lab.service.js';
import { SchedulingService } from '../scheduling/scheduling.service.js';
import { DocumentService } from '../document/document.service.js';
import { FhirPatientMapper } from './mappers/fhir-patient.mapper.js';
import { FhirEncounterMapper } from './mappers/fhir-encounter.mapper.js';
import { FhirObservationMapper } from './mappers/fhir-observation.mapper.js';
import { FhirMedicationRequestMapper } from './mappers/fhir-medication-request.mapper.js';
import { FhirConditionMapper } from './mappers/fhir-condition.mapper.js';
import { FhirAllergyMapper } from './mappers/fhir-allergy.mapper.js';
import { FhirAppointmentMapper } from './mappers/fhir-appointment.mapper.js';
import { FhirDocumentReferenceMapper } from './mappers/fhir-document-reference.mapper.js';
import { FhirBundle, FhirCapabilityStatement, FhirResource } from './types/fhir-r4.types.js';
import { PaginationDto } from '../common/dto/pagination.dto.js';

function buildBundle(resources: FhirResource[], baseUrl: string): FhirBundle {
  return {
    resourceType: 'Bundle',
    type: 'searchset',
    total: resources.length,
    entry: resources.map((r) => ({
      fullUrl: `${baseUrl}/fhir/${r.resourceType}/${r.id}`,
      resource: r,
      search: { mode: 'match' as const },
    })),
  };
}

@ApiTags('FHIR R4')
@ApiBearerAuth()
@UseGuards(JwtOrApiKeyGuard)
@Controller('fhir')
export class FhirController {
  constructor(
    private readonly patientService: PatientService,
    private readonly encounterService: EncounterService,
    private readonly medicationService: MedicationService,
    private readonly labService: LabService,
    private readonly schedulingService: SchedulingService,
    private readonly documentService: DocumentService,
    private readonly patientMapper: FhirPatientMapper,
    private readonly encounterMapper: FhirEncounterMapper,
    private readonly observationMapper: FhirObservationMapper,
    private readonly medRequestMapper: FhirMedicationRequestMapper,
    private readonly conditionMapper: FhirConditionMapper,
    private readonly allergyMapper: FhirAllergyMapper,
    private readonly appointmentMapper: FhirAppointmentMapper,
    private readonly docRefMapper: FhirDocumentReferenceMapper,
  ) {}

  @Get('metadata')
  @Public()
  @ApiOperation({ summary: 'FHIR CapabilityStatement' })
  getMetadata(): FhirCapabilityStatement {
    return {
      resourceType: 'CapabilityStatement',
      status: 'active',
      kind: 'instance',
      fhirVersion: '4.0.1',
      format: ['json'],
      rest: [{
        mode: 'server',
        resource: [
          { type: 'Patient', interaction: [{ code: 'read' }, { code: 'search-type' }], searchParam: [{ name: 'name', type: 'string' }, { name: '_id', type: 'token' }] },
          { type: 'Encounter', interaction: [{ code: 'read' }, { code: 'search-type' }], searchParam: [{ name: 'patient', type: 'reference' }] },
          { type: 'Observation', interaction: [{ code: 'read' }, { code: 'search-type' }], searchParam: [{ name: 'patient', type: 'reference' }, { name: 'category', type: 'token' }] },
          { type: 'MedicationRequest', interaction: [{ code: 'read' }, { code: 'search-type' }], searchParam: [{ name: 'patient', type: 'reference' }] },
          { type: 'Condition', interaction: [{ code: 'read' }, { code: 'search-type' }], searchParam: [{ name: 'patient', type: 'reference' }] },
          { type: 'AllergyIntolerance', interaction: [{ code: 'read' }, { code: 'search-type' }], searchParam: [{ name: 'patient', type: 'reference' }] },
          { type: 'Appointment', interaction: [{ code: 'read' }, { code: 'search-type' }], searchParam: [{ name: 'patient', type: 'reference' }] },
          { type: 'DocumentReference', interaction: [{ code: 'read' }, { code: 'search-type' }], searchParam: [{ name: 'patient', type: 'reference' }] },
        ],
      }],
    };
  }

  // ── Patient ──

  @Get('Patient')
  @ApiOperation({ summary: 'Search patients (FHIR)' })
  async searchPatients(
    @Query() query: PaginationDto,
    @Query('name') name?: string,
    @Query('_id') _id?: string,
    @Req() req?: Request,
  ) {
    const baseUrl = `${req?.protocol}://${req?.get('host')}`;
    const { data } = await this.patientService.findAll({
      ...query,
      search: name,
    } as any);
    return buildBundle(data.map((p) => this.patientMapper.toFhir(p)), baseUrl);
  }

  @Get('Patient/:id')
  async getPatient(@Param('id') id: string) {
    const patient = await this.patientService.findByUuid(id);
    return this.patientMapper.toFhir(patient);
  }

  // ── Encounter ──

  @Get('Encounter')
  async searchEncounters(
    @Query('patient') patient?: string,
    @Req() req?: Request,
  ) {
    const baseUrl = `${req?.protocol}://${req?.get('host')}`;
    if (!patient) return buildBundle([], baseUrl);
    const { data } = await this.encounterService.findEncountersByPatient(
      Number(patient),
      { page: 1, limit: 100, skip: 0 } as PaginationDto,
    );
    return buildBundle(data.map((e) => this.encounterMapper.toFhir(e)), baseUrl);
  }

  @Get('Encounter/:id')
  async getEncounter(@Param('id') id: string) {
    const enc = await this.encounterService.findEncounterByUuid(id);
    return this.encounterMapper.toFhir(enc);
  }

  // ── Observation (vitals + lab results) ──

  @Get('Observation')
  async searchObservations(
    @Query('patient') patient?: string,
    @Query('category') category?: string,
    @Req() req?: Request,
  ) {
    const baseUrl = `${req?.protocol}://${req?.get('host')}`;
    if (!patient) return buildBundle([], baseUrl);
    const pid = Number(patient);
    const observations: FhirResource[] = [];

    if (!category || category === 'vital-signs') {
      // Get vitals from all encounters
      const { data: encounters } = await this.encounterService.findEncountersByPatient(
        pid,
        { page: 1, limit: 50, skip: 0 } as PaginationDto,
      );
      for (const enc of encounters) {
        const vitals = await this.encounterService.getVitals(enc.id);
        for (const v of vitals) {
          observations.push(...this.observationMapper.vitalsToFhir(v));
        }
      }
    }

    if (!category || category === 'laboratory') {
      const results = await this.labService.getResultsByPatient(pid);
      for (const r of results) {
        observations.push(this.observationMapper.labResultToFhir(r, pid));
      }
    }

    return buildBundle(observations, baseUrl);
  }

  // ── MedicationRequest ──

  @Get('MedicationRequest')
  async searchMedicationRequests(
    @Query('patient') patient?: string,
    @Req() req?: Request,
  ) {
    const baseUrl = `${req?.protocol}://${req?.get('host')}`;
    if (!patient) return buildBundle([], baseUrl);
    const meds = await this.medicationService.findByPatient(Number(patient));
    return buildBundle(meds.map((m) => this.medRequestMapper.toFhir(m)), baseUrl);
  }

  @Get('MedicationRequest/:id')
  async getMedicationRequest(@Param('id') id: string) {
    // Find by UUID across all patients
    const med = await this.medicationService.findOne(undefined as any, id);
    return this.medRequestMapper.toFhir(med);
  }

  // ── Condition ──

  @Get('Condition')
  async searchConditions(
    @Query('patient') patient?: string,
    @Req() req?: Request,
  ) {
    const baseUrl = `${req?.protocol}://${req?.get('host')}`;
    if (!patient) return buildBundle([], baseUrl);
    const conditions = await this.encounterService.getConditions(Number(patient));
    return buildBundle(conditions.map((c) => this.conditionMapper.toFhir(c)), baseUrl);
  }

  // ── AllergyIntolerance ──

  @Get('AllergyIntolerance')
  async searchAllergies(
    @Query('patient') patient?: string,
    @Req() req?: Request,
  ) {
    const baseUrl = `${req?.protocol}://${req?.get('host')}`;
    if (!patient) return buildBundle([], baseUrl);
    const allergies = await this.encounterService.getAllergies(Number(patient));
    return buildBundle(allergies.map((a) => this.allergyMapper.toFhir(a)), baseUrl);
  }

  // ── Appointment ──

  @Get('Appointment')
  async searchAppointments(
    @Query('patient') patient?: string,
    @Req() req?: Request,
  ) {
    const baseUrl = `${req?.protocol}://${req?.get('host')}`;
    if (!patient) return buildBundle([], baseUrl);
    const appts = await this.schedulingService.findByPatient(Number(patient));
    return buildBundle(appts.map((a) => this.appointmentMapper.toFhir(a)), baseUrl);
  }

  // ── DocumentReference ──

  @Get('DocumentReference')
  async searchDocumentReferences(
    @Query('patient') patient?: string,
    @Req() req?: Request,
  ) {
    const baseUrl = `${req?.protocol}://${req?.get('host')}`;
    if (!patient) return buildBundle([], baseUrl);
    const docs = await this.documentService.findByPatient(Number(patient));
    return buildBundle(docs.map((d) => this.docRefMapper.toFhir(d, baseUrl)), baseUrl);
  }
}
