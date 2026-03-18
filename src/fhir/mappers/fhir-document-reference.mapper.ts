import { Injectable } from '@nestjs/common';
import { Document } from '../../document/entities/document.entity.js';
import { FhirDocumentReference } from '../types/fhir-r4.types.js';

@Injectable()
export class FhirDocumentReferenceMapper {
  toFhir(doc: Document, baseUrl: string): FhirDocumentReference {
    const resource: FhirDocumentReference = {
      resourceType: 'DocumentReference',
      id: doc.uuid,
      meta: { lastUpdated: doc.updatedAt?.toISOString() },
      status: 'current',
      subject: { reference: `Patient/${doc.patientId}` },
      date: doc.createdAt?.toISOString(),
      content: [{
        attachment: {
          contentType: doc.mimeType,
          url: `${baseUrl}/api/patient/${doc.patientId}/document/${doc.uuid}`,
          title: doc.name,
          size: doc.size ? Number(doc.size) : undefined,
        },
      }],
    };

    if (doc.encounterId) {
      resource.context = {
        encounter: [{ reference: `Encounter/${doc.encounterId}` }],
      };
    }

    return resource;
  }
}
