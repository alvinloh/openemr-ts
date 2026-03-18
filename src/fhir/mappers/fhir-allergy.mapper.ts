import { Injectable } from '@nestjs/common';
import { Allergy } from '../../encounter/entities/allergy.entity.js';
import { FhirAllergyIntolerance } from '../types/fhir-r4.types.js';

@Injectable()
export class FhirAllergyMapper {
  toFhir(allergy: Allergy): FhirAllergyIntolerance {
    const resource: FhirAllergyIntolerance = {
      resourceType: 'AllergyIntolerance',
      id: allergy.uuid,
      meta: { lastUpdated: allergy.updatedAt?.toISOString() },
      clinicalStatus: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical',
          code: allergy.status,
        }],
      },
      code: {
        coding: allergy.code
          ? [{ system: allergy.codeSystem || undefined, code: allergy.code, display: allergy.substance }]
          : undefined,
        text: allergy.substance,
      },
      patient: { reference: `Patient/${allergy.patientId}` },
      onsetDateTime: allergy.onsetDate || undefined,
    };

    if (allergy.reaction || allergy.severity) {
      resource.reaction = [{
        manifestation: allergy.reaction ? [{ text: allergy.reaction }] : undefined,
        severity: allergy.severity as any || undefined,
      }];
    }

    return resource;
  }
}
