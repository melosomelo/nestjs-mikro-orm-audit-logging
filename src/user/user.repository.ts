import { BaseRepository } from '@/shared/base.repository';
import { EntityManager } from '@mikro-orm/postgresql';
import { Inject, Injectable } from '@nestjs/common';
import { User } from './user.entity';

@Injectable()
export class UserRepository extends BaseRepository<User> {
  constructor(@Inject(EntityManager) entityManager: EntityManager) {
    super(entityManager, User);
  }
}
