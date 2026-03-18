import { Injectable } from '@nestjs/common';
import { Encounter } from '../../encounter/entities/encounter.entity.js';
import { FhirEncounter } from '../types/fhir-r4.types.js';

const CLASS_MAP: Record<string, { code: string; display: string }> = {
  AMB: { code: 'AMB', display: 'ambulatory' },
  EMER: { code: 'EMER', display: 'emergency' },
  IMP: { code: 'IMP', display: 'inpatient encounter' },
  OBSENC: { code: 'OBSENC', display: 'observation encounter' },
  SS: { code: 'SS', display: 'short stay' },
};

@Injectable()
export class FhirEncounterMapper {
  toFhir(encounter: Encounter): FhirEncounter {
    const classInfo = CLASS_MAP[encounter.classCode] || CLASS_MAP.AMB;

    const resource: FhirEncounter = {
      resourceType: 'Encounter',
      id: encounter.uuid,
      meta: { lastUpdated: encounter.updatedAt?.toISOString() },
      status: this.mapStatus(encounter.status),
      class: {
        system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
        code: classInfo.code,
        display: classInfo.display,
      },
      subject: { reference: `Patient/${encounter.patientId}` },
      period: {
        start: encounter.encounterDate?.toISOString(),
        end: encounter.encounterDateEnd?.toISOString() || undefined,
      },
    };

    if (encounter.providerId) {
      resource.participant = [{
        individual: { reference: `Practitioner/${encounter.providerId}` },
      }];
    }

    if (encounter.reasonForVisit) {
      resource.reasonCode = [{ text: encounter.reasonForVisit }];
    }

    return resource;
  }

  private mapStatus(status: string): string {
    switch (status) {
      case 'active': return 'in-progress';
      case 'finished': return 'finished';
      case 'cancelled': return 'cancelled';
      default: return 'unknown';
    }
  }
}
