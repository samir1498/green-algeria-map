import { Entity, PrimaryColumn, Column, Index } from 'typeorm';

@Entity('verification')
export class Verification {
  @PrimaryColumn('text')
  id: string;

  @Index()
  @Column({ type: 'text' })
  identifier: string;

  @Column({ type: 'text' })
  value: string;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'timestamp' })
  createdAt: Date;

  @Column({ type: 'timestamp' })
  updatedAt: Date;
}
