import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

@Entity('account')
export class Account {
  @PrimaryColumn('text')
  id: string;

  @Index()
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  accountId: string;

  @Column()
  providerId: string;

  @Column({ nullable: true })
  accessToken: string;

  @Column({ nullable: true })
  refreshToken: string;

  @Column({ nullable: true })
  idToken: string;

  @Column({ type: 'timestamp', nullable: true })
  accessTokenExpiresAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  refreshTokenExpiresAt: Date;

  @Column({ nullable: true })
  scope: string;

  @Column({ nullable: true })
  password: string;

  @Column({ type: 'timestamp' })
  createdAt: Date;

  @Column({ type: 'timestamp' })
  updatedAt: Date;
}
