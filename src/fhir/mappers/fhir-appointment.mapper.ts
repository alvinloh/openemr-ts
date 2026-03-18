import { Injectable } from '@nestjs/common';
import { Appointment } from '../../scheduling/entities/appointment.entity.js';
import { FhirAppointment } from '../types/fhir-r4.types.js';

const STATUS_MAP: Record<string, string> = {
  scheduled: 'booked',
  arrived: 'arrived',
  completed: 'fulfilled',
  cancelled: 'cancelled',
  noshow: 'noshow',
};

@Injectable()
export class FhirAppointmentMapper {
  toFhir(appt: Appointment): FhirAppointment {
    return {
      resourceType: 'Appointment',
      id: appt.uuid,
      meta: { lastUpdated: appt.updatedAt?.toISOString() },
      status: STATUS_MAP[appt.status] || 'proposed',
      start: appt.startTime?.toISOString(),
      end: appt.endTime?.toISOString(),
      minutesDuration: appt.duration,
      description: appt.title || undefined,
      participant: [
        {
          actor: { reference: `Patient/${appt.patientId}` },
          status: 'accepted',
        },
        {
          actor: { reference: `Practitioner/${appt.providerId}` },
          status: 'accepted',
        },
      ],
    };
  }
}
