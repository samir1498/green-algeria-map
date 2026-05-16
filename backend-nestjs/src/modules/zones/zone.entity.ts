import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export type ZoneType = 'planting' | 'trash' | 'cleanup';
export type ZoneStatus = 'planned' | 'in-progress' | 'completed';

@Entity('zones')
export class Zone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'varchar' })
  type: ZoneType;

  @Column({ type: 'varchar' })
  status: ZoneStatus;

  @Column('double precision')
  lat: number;

  @Column('double precision')
  lng: number;

  @Column({ nullable: true })
  targetCount?: number;

  @Column({ nullable: true })
  currentCount?: number;

  @Column('text')
  description: string;
}
