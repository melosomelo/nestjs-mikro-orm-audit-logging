import { Entity, PrimaryKey, PrimaryKeyProp, Property } from '@mikro-orm/core';

@Entity()
export class Organization {
  @PrimaryKey({ autoincrement: true })
  id: number;

  [PrimaryKeyProp]: 'id';

  @Property()
  domain: string;
}
