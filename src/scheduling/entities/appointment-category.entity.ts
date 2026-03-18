import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('appointment_categories')
export class AppointmentCategory {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'int', default: 30 })
  duration: number;

  @Column({ type: 'varchar', length: 10, default: '#3788d8' })
  color: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;
}
