import { Module } from '@nestjs/common';
import { FhirController } from './fhir.controller.js';
import { FhirPatientMapper } from './mappers/fhir-patient.mapper.js';
import { FhirEncounterMapper } from './mappers/fhir-encounter.mapper.js';
import { FhirObservationMapper } from './mappers/fhir-observation.mapper.js';
import { FhirMedicationRequestMapper } from './mappers/fhir-medication-request.mapper.js';
import { FhirConditionMapper } from './mappers/fhir-condition.mapper.js';
import { FhirAllergyMapper } from './mappers/fhir-allergy.mapper.js';
import { FhirAppointmentMapper } from './mappers/fhir-appointment.mapper.js';
import { FhirDocumentReferenceMapper } from './mappers/fhir-document-reference.mapper.js';
import { PatientModule } from '../patient/patient.module.js';
import { EncounterModule } from '../encounter/encounter.module.js';
import { MedicationModule } from '../medication/medication.module.js';
import { LabModule } from '../lab/lab.module.js';
import { SchedulingModule } from '../scheduling/scheduling.module.js';
import { DocumentModule } from '../document/document.module.js';
import { TenantModule } from '../tenant/tenant.module.js';

@Module({
  imports: [
    PatientModule,
    EncounterModule,
    MedicationModule,
    LabModule,
    SchedulingModule,
    DocumentModule,
    TenantModule,
  ],
  controllers: [FhirController],
  providers: [
    FhirPatientMapper,
    FhirEncounterMapper,
    FhirObservationMapper,
    FhirMedicationRequestMapper,
    FhirConditionMapper,
    FhirAllergyMapper,
    FhirAppointmentMapper,
    FhirDocumentReferenceMapper,
  ],
})
export class FhirModule {}
