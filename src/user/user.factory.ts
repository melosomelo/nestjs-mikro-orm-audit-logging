import { faker } from '@faker-js/faker';
import { EntityData } from '@mikro-orm/core';
import { Factory } from '@mikro-orm/seeder';
import { User } from './user.entity';

export class UserFactory extends Factory<User> {
  model = User;

  protected definition(): EntityData<User> {
    return {
      username: faker.internet.username(),
      password: faker.internet.password(),
    };
  }
}
