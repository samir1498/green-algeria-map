import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity('damage_reports')
export class DamageReportOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  zoneId: string;

  @Column({ type: 'varchar' })
  type: string;

  @Column({ type: 'varchar' })
  severity: string;

  @Column({ type: 'varchar' })
  status: string;

  @Column('double precision')
  lat: number;

  @Column('double precision')
  lng: number;

  @Column('text')
  description: string;

  @Column()
  reportedBy: string;

  @Column('timestamptz')
  reportedAt: Date;

  @Column('timestamptz')
  updatedAt: Date;
}
