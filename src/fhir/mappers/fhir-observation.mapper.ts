import { Injectable } from '@nestjs/common';
import { Vitals } from '../../encounter/entities/vitals.entity.js';
import { LabResult } from '../../lab/entities/lab-result.entity.js';
import { FhirObservation } from '../types/fhir-r4.types.js';

@Injectable()
export class FhirObservationMapper {
  vitalsToFhir(vitals: Vitals): FhirObservation[] {
    const observations: FhirObservation[] = [];
    const base = {
      subject: { reference: `Patient/${vitals.patientId}` },
      encounter: { reference: `Encounter/${vitals.encounterId}` },
      effectiveDateTime: vitals.observedAt?.toISOString(),
      status: 'final' as const,
      category: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/observation-category',
          code: 'vital-signs',
          display: 'Vital Signs',
        }],
      }],
    };

    if (vitals.bloodPressureSystolic != null || vitals.bloodPressureDiastolic != null) {
      observations.push({
        ...base,
        resourceType: 'Observation',
        id: `${vitals.uuid}-bp`,
        code: { coding: [{ system: 'http://loinc.org', code: '85354-9', display: 'Blood pressure panel' }] },
      });
    }

    const vitalMaps: Array<[keyof Vitals, string, string, string]> = [
      ['temperature', '8310-5', 'Body temperature', 'Cel'],
      ['pulse', '8867-4', 'Heart rate', '/min'],
      ['respirations', '9279-1', 'Respiratory rate', '/min'],
      ['height', '8302-2', 'Body height', 'cm'],
      ['weight', '29463-7', 'Body weight', 'kg'],
      ['bmi', '39156-5', 'BMI', 'kg/m2'],
      ['oxygenSaturation', '2708-6', 'Oxygen saturation', '%'],
    ];

    for (const [field, loincCode, display, unit] of vitalMaps) {
      const value = vitals[field] as number | null;
      if (value != null) {
        observations.push({
          ...base,
          resourceType: 'Observation',
          id: `${vitals.uuid}-${field}`,
          code: { coding: [{ system: 'http://loinc.org', code: loincCode, display }] },
          valueQuantity: {
            value,
            unit,
            system: 'http://unitsofmeasure.org',
            code: unit,
          },
        });
      }
    }

    return observations;
  }

  labResultToFhir(result: LabResult, patientId: number): FhirObservation {
    const obs: FhirObservation = {
      resourceType: 'Observation',
      id: result.uuid,
      meta: { lastUpdated: result.updatedAt?.toISOString() },
      status: this.mapResultStatus(result.status),
      category: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/observation-category',
          code: 'laboratory',
          display: 'Laboratory',
        }],
      }],
      code: {
        coding: result.resultCode
          ? [{ system: 'http://loinc.org', code: result.resultCode, display: result.resultText || undefined }]
          : undefined,
        text: result.resultText || undefined,
      },
      subject: { reference: `Patient/${patientId}` },
      effectiveDateTime: result.date?.toISOString(),
    };

    if (result.value != null) {
      const numVal = parseFloat(result.value);
      if (!isNaN(numVal) && result.resultDataType === 'NM') {
        obs.valueQuantity = {
          value: numVal,
          unit: result.units || undefined,
        };
      } else {
        obs.valueString = result.value;
      }
    }

    if (result.referenceRange) {
      obs.referenceRange = [{ text: result.referenceRange }];
    }

    if (result.abnormal && result.abnormal !== 'no') {
      obs.interpretation = [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
          code: result.abnormal === 'high' ? 'H' : result.abnormal === 'low' ? 'L' : 'A',
        }],
      }];
    }

    return obs;
  }

  private mapResultStatus(status: string): string {
    switch (status) {
      case 'preliminary': return 'preliminary';
      case 'final': return 'final';
      case 'corrected': return 'corrected';
      default: return 'unknown';
    }
  }
}
