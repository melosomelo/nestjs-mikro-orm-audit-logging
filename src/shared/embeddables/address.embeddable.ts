import { AuditIgnore } from '@/audit-log/audit-log.decorators';
import { Embeddable, Property } from '@mikro-orm/core';

@Embeddable()
export class Address {
  @Property()
  street: string;

  @Property()
  postalCode: string;

  @Property()
  city: string;

  @Property()
  @AuditIgnore()
  country: string;
}
