import { Auditable, AuditIgnore } from '@/audit-log/audit-log.decorators';
import { Address } from '@/shared/embeddables/address.embeddable';
import { Embedded, Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity()
@Auditable()
export class User {
  @PrimaryKey({ autoincrement: true })
  id: number;

  @Property({ unique: true })
  username: string;

  @AuditIgnore()
  @Property()
  password: string;

  @Embedded()
  address: Address;
}
