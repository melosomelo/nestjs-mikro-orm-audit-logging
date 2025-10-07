import { faker } from '@faker-js/faker';
import { EntityData } from '@mikro-orm/core';
import { Factory } from '@mikro-orm/seeder';
import { Organization } from './organization.entity';

export class OrganizationFactory extends Factory<Organization> {
  model = Organization;

  protected definition(): EntityData<Organization> {
    return {
      domain: faker.internet.domainName(),
    };
  }
}
