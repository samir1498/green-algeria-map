import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('zones')
export class ZoneOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'varchar' })
  type: string;

  @Column({ type: 'varchar' })
  status: string;

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

  @Column('simple-array', { nullable: true })
  photos?: string[];
}
