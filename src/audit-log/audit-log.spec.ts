import ormConfig from '@/database/orm.config';
import { User } from '@/user/user.entity';
import { UserFactory } from '@/user/user.factory';
import { UserRepository } from '@/user/user.repository';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { EntityManager, MikroORM } from '@mikro-orm/postgresql';
import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogOperation } from './audit-log-operation.enum';
import { AUDITABLE_META_KEY } from './audit-log.decorators';
import { AuditLog } from './audit-log.entity';
import { AuditLogModule } from './audit-log.module';

const AuditableUser = User;
Reflect.defineMetadata(
  AUDITABLE_META_KEY,
  [
    AuditLogOperation.Create,
    AuditLogOperation.Read,
    AuditLogOperation.Update,
    AuditLogOperation.Delete,
  ],
  AuditableUser,
);

describe('Audit Logging', () => {
  let mod: TestingModule;
  let entityManager: EntityManager;
  let userRepository: UserRepository;
  let userFactory: UserFactory;
  let userTableName: string;

  beforeAll(async () => {
    mod = await Test.createTestingModule({
      controllers: [],
      providers: [UserRepository],
      exports: [],
      imports: [
        MikroOrmModule.forRoot({
          ...ormConfig,
          entitiesTs: undefined,
          entities: [AuditableUser, AuditLog],
        }),
        AuditLogModule,
      ],
    }).compile();

    entityManager = mod.get(EntityManager);
    userRepository = mod.get(UserRepository);
    userFactory = new UserFactory(entityManager.fork());
    userTableName = mod.get(MikroORM).getMetadata().get(User).tableName;

    await mod.init();
  });

  afterAll(async () => {
    await mod.close();
  });

  it('should properly create a create audit log operation', async () => {
    const newUser = await userRepository.create(userFactory.makeOne());

    const em = entityManager.fork();
    const logInstance = await em.findOneOrFail(AuditLog, {
      tableName: userTableName,
      recordId: newUser.id.toString(),
      operation: AuditLogOperation.Create,
    });
    expect(logInstance.createdAt).not.toBe(null);
    expect(logInstance.diff).toEqual({
      id: {
        old: null,
        new: newUser.id,
      },
      username: {
        old: null,
        new: newUser.username,
      },
      password: {
        old: null,
        new: newUser.password,
      },
    });
  });
});
