import { Injectable } from '@nestjs/common';
import { Medication } from '../../medication/entities/medication.entity.js';
import { FhirMedicationRequest } from '../types/fhir-r4.types.js';

@Injectable()
export class FhirMedicationRequestMapper {
  toFhir(med: Medication): FhirMedicationRequest {
    const resource: FhirMedicationRequest = {
      resourceType: 'MedicationRequest',
      id: med.uuid,
      meta: { lastUpdated: med.updatedAt?.toISOString() },
      status: med.active ? 'active' : 'stopped',
      intent: 'order',
      medicationCodeableConcept: {
        coding: med.rxnormCode
          ? [{ system: 'http://www.nlm.nih.gov/research/umls/rxnorm', code: med.rxnormCode, display: med.drugName }]
          : undefined,
        text: med.drugName,
      },
      subject: { reference: `Patient/${med.patientId}` },
    };

    if (med.encounterId) {
      resource.encounter = { reference: `Encounter/${med.encounterId}` };
    }

    if (med.providerId) {
      resource.requester = { reference: `Practitioner/${med.providerId}` };
    }

    // Dosage instruction
    if (med.dosage || med.frequency || med.route) {
      resource.dosageInstruction = [{
        text: [med.dosage, med.route, med.frequency].filter(Boolean).join(', '),
        timing: med.frequency ? { code: { text: med.frequency } } : undefined,
        route: med.route ? { text: med.route } : undefined,
        doseAndRate: med.dosage ? [{
          doseQuantity: { value: parseFloat(med.dosage) || undefined, unit: med.unit || undefined },
        }] : undefined,
      }];
    }

    if (med.refills || med.quantity) {
      resource.dispenseRequest = {
        numberOfRepeatsAllowed: med.refills || undefined,
        quantity: med.quantity ? { value: parseFloat(med.quantity), unit: med.unit || undefined } : undefined,
      };
    }

    return resource;
  }
}
