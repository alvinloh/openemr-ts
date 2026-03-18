import { Injectable } from '@nestjs/common';
import { Condition } from '../../encounter/entities/condition.entity.js';
import { FhirCondition } from '../types/fhir-r4.types.js';

@Injectable()
export class FhirConditionMapper {
  toFhir(condition: Condition): FhirCondition {
    const codeSystem = condition.codeSystem === 'SNOMED'
      ? 'http://snomed.info/sct'
      : 'http://hl7.org/fhir/sid/icd-10-cm';

    return {
      resourceType: 'Condition',
      id: condition.uuid,
      meta: { lastUpdated: condition.updatedAt?.toISOString() },
      clinicalStatus: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
          code: condition.status,
        }],
      },
      code: {
        coding: [{ system: codeSystem, code: condition.code, display: condition.title }],
        text: condition.title,
      },
      subject: { reference: `Patient/${condition.patientId}` },
      onsetDateTime: condition.onsetDate || undefined,
      abatementDateTime: condition.endDate || undefined,
    };
  }
}
