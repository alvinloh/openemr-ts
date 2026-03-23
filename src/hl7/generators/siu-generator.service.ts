import { Injectable } from '@nestjs/common';

export interface SiuPatientInfo {
  mrn: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  sex: string;
  phoneCell?: string;
}

export interface SiuAppointmentInfo {
  appointmentId: number | string;
  startTime: string;
  duration: number;
  reason?: string;
  providerId?: number | string;
  providerLastName?: string;
  providerFirstName?: string;
  facilityName?: string;
  status?: string;
}

@Injectable()
export class SiuGeneratorService {
  /**
   * SIU^S12 - Notification of new appointment booking
   */
  generateNewAppointment(
    patient: SiuPatientInfo,
    appointment: SiuAppointmentInfo,
    sendingApp = 'OPENEMR-TS',
    sendingFacility = 'CLINIC',
    receivingApp = 'SCHEDULER',
    receivingFacility = 'HOSPITAL',
  ): string {
    const now = this.formatHl7Date(new Date());
    const controlId = `SIU${Date.now()}`;
    const segments: string[] = [];

    // MSH
    segments.push(
      `MSH|^~\\&|${sendingApp}|${sendingFacility}|${receivingApp}|${receivingFacility}|${now}||SIU^S12|${controlId}|P|2.3`,
    );

    // SCH - Schedule Activity
    const startTime = this.formatHl7Date(new Date(appointment.startTime));
    const endTime = this.formatHl7Date(
      new Date(new Date(appointment.startTime).getTime() + appointment.duration * 60000),
    );
    const reason = appointment.reason || 'Follow-up';
    segments.push(
      `SCH|${appointment.appointmentId}||||||${reason}|${reason}|${appointment.duration}|min|^^${appointment.duration}^${startTime}^${endTime}|||||${appointment.status || 'Booked'}`,
    );

    // PID
    const dob = this.formatHl7Date(new Date(patient.dateOfBirth));
    const sex = patient.sex?.[0]?.toUpperCase() || 'U';
    segments.push(
      `PID|1||${patient.mrn}^^^OPENEMR-TS||${patient.lastName}^${patient.firstName}||${dob}|${sex}`,
    );

    // PV1
    segments.push('PV1|1|O');

    // AIG - Resource (provider)
    if (appointment.providerId) {
      const provider = appointment.providerLastName
        ? `${appointment.providerId}^${appointment.providerLastName}^${appointment.providerFirstName || ''}`
        : String(appointment.providerId);
      segments.push(`AIG|1||${provider}`);
    }

    // AIL - Location
    if (appointment.facilityName) {
      segments.push(`AIL|1||${appointment.facilityName}`);
    }

    return segments.join('\r');
  }

  private formatHl7Date(date: Date): string {
    return date
      .toISOString()
      .replace(/[-:T]/g, '')
      .replace(/\.\d+Z$/, '');
  }
}
