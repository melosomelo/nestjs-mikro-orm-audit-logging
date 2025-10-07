import { Auditable, AuditIgnore } from '@/audit-log/audit-log.decorators';
import { Organization } from '@/organization/organization.entity';
import { Address } from '@/shared/embeddables/address.embeddable';
import {
  Embedded,
  Entity,
  ManyToOne,
  PrimaryKey,
  PrimaryKeyProp,
  Property,
  type Ref,
} from '@mikro-orm/core';

@Entity()
@Auditable()
export class User {
  @PrimaryKey({ autoincrement: true })
  id: number;

  [PrimaryKeyProp]: 'id';

  @Property({ unique: true })
  username: string;

  @AuditIgnore()
  @Property()
  password: string;

  @Embedded()
  address: Address;

  @ManyToOne()
  organization: Ref<Organization> | null;
}
