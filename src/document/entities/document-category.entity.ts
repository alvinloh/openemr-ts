import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('document_categories')
export class DocumentCategory {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'int', nullable: true })
  parentId: number | null;

  @Column({ type: 'boolean', default: true })
  active: boolean;
}
