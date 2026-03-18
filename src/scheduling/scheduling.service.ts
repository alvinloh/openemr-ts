import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Appointment } from './entities/appointment.entity.js';

@Injectable()
export class SchedulingService {
  constructor(
    @InjectRepository(Appointment)
    private readonly apptRepo: Repository<Appointment>,
  ) {}

  async create(data: Partial<Appointment>): Promise<Appointment> {
    const appt = this.apptRepo.create(data);
    return this.apptRepo.save(appt);
  }

  async findByPatient(patientId: number): Promise<Appointment[]> {
    return this.apptRepo.find({
      where: { patientId },
      order: { startTime: 'DESC' },
    });
  }

  async findByDateRange(start: Date, end: Date, providerId?: number): Promise<Appointment[]> {
    const where: any = { startTime: Between(start, end) };
    if (providerId) where.providerId = providerId;
    return this.apptRepo.find({ where, order: { startTime: 'ASC' } });
  }

  async findByUuid(uuid: string): Promise<Appointment> {
    const appt = await this.apptRepo.findOne({ where: { uuid } });
    if (!appt) throw new NotFoundException('Appointment not found');
    return appt;
  }

  async cancel(uuid: string): Promise<Appointment> {
    const appt = await this.findByUuid(uuid);
    appt.status = 'cancelled';
    return this.apptRepo.save(appt);
  }

  async update(uuid: string, data: Partial<Appointment>): Promise<Appointment> {
    const appt = await this.findByUuid(uuid);
    Object.assign(appt, data);
    return this.apptRepo.save(appt);
  }
}
