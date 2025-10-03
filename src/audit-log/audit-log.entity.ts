import { User } from '@/user/user.entity';
import {
  Entity,
  ManyToOne,
  Opt,
  PrimaryKey,
  Property,
  Ref,
} from '@mikro-orm/core';
import { AuditLogOperation } from './audit-log-operation.enum';

@Entity()
export class AuditLog {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  uuid: string;

  @Property()
  tableName: string;

  @Property()
  recordId: string;

  @Property({ type: 'varchar' })
  operation: AuditLogOperation;

  @Property({ type: 'json' })
  diff: Record<string, { old: any; new: any }> | null;

  @Property({ type: 'timestamptz', defaultRaw: 'NOW()' })
  createdAt: Date & Opt;

  @ManyToOne()
  user: Ref<User> | null;
}
