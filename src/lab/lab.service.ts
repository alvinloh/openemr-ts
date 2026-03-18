import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LabOrder } from './entities/lab-order.entity.js';
import { LabOrderCode } from './entities/lab-order-code.entity.js';
import { LabReport } from './entities/lab-report.entity.js';
import { LabResult } from './entities/lab-result.entity.js';
import { LabProvider } from './entities/lab-provider.entity.js';

@Injectable()
export class LabService {
  constructor(
    @InjectRepository(LabOrder)
    private readonly orderRepo: Repository<LabOrder>,
    @InjectRepository(LabOrderCode)
    private readonly orderCodeRepo: Repository<LabOrderCode>,
    @InjectRepository(LabReport)
    private readonly reportRepo: Repository<LabReport>,
    @InjectRepository(LabResult)
    private readonly resultRepo: Repository<LabResult>,
    @InjectRepository(LabProvider)
    private readonly providerRepo: Repository<LabProvider>,
  ) {}

  async createOrder(data: Partial<LabOrder>, codes?: Partial<LabOrderCode>[]): Promise<LabOrder> {
    const order = this.orderRepo.create(data);
    const saved = await this.orderRepo.save(order);

    if (codes?.length) {
      const orderCodes = codes.map((c, i) =>
        this.orderCodeRepo.create({
          ...c,
          labOrderId: saved.id,
          seq: i + 1,
        }),
      );
      await this.orderCodeRepo.save(orderCodes);
    }

    return saved;
  }

  async findOrders(filters: {
    patientId?: number;
    status?: string;
  }): Promise<LabOrder[]> {
    const where: any = {};
    if (filters.patientId) where.patientId = filters.patientId;
    if (filters.status) where.status = filters.status;
    return this.orderRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async findOrderByUuid(uuid: string): Promise<LabOrder> {
    const order = await this.orderRepo.findOne({ where: { uuid } });
    if (!order) throw new NotFoundException('Lab order not found');
    return order;
  }

  async getOrderCodes(orderId: number): Promise<LabOrderCode[]> {
    return this.orderCodeRepo.find({ where: { labOrderId: orderId } });
  }

  async createReport(data: Partial<LabReport>): Promise<LabReport> {
    const report = this.reportRepo.create(data);
    return this.reportRepo.save(report);
  }

  async getReports(orderId: number): Promise<LabReport[]> {
    return this.reportRepo.find({ where: { labOrderId: orderId } });
  }

  async createResult(data: Partial<LabResult>): Promise<LabResult> {
    const result = this.resultRepo.create(data);
    return this.resultRepo.save(result);
  }

  async getResults(reportId: number): Promise<LabResult[]> {
    return this.resultRepo.find({ where: { labReportId: reportId } });
  }

  async getResultsByPatient(patientId: number): Promise<any[]> {
    return this.resultRepo
      .createQueryBuilder('r')
      .innerJoin(LabReport, 'rep', 'rep.id = r.labReportId')
      .innerJoin(LabOrder, 'ord', 'ord.id = rep.labOrderId')
      .where('ord.patientId = :patientId', { patientId })
      .orderBy('r.date', 'DESC')
      .getMany();
  }
}
