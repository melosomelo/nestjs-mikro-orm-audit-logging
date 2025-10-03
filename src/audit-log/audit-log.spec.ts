import { ContextModule } from '@/context/context.module';
import { ContextService } from '@/context/context.service';
import ormConfig from '@/database/orm.config';
import { User } from '@/user/user.entity';
import { UserFactory } from '@/user/user.factory';
import { UserRepository } from '@/user/user.repository';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { EntityManager, MikroORM } from '@mikro-orm/postgresql';
import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogOperation } from './audit-log-operation.enum';
import {
  AUDIT_IGNORE_META_KEY,
  AUDITABLE_META_KEY,
} from './audit-log.decorators';
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
Reflect.defineMetadata(
  AUDIT_IGNORE_META_KEY,
  true,
  AuditableUser.prototype,
  'password',
);

describe('Audit Logging', () => {
  let mod: TestingModule;
  let entityManager: EntityManager;
  let userRepository: UserRepository;
  let userFactory: UserFactory;
  let userTableName: string;
  let contextUser: User;

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
        ContextModule,
      ],
    })
      .overrideProvider(ContextService)
      .useValue({
        get currentUser() {
          return {
            id: contextUser.id,
          };
        },
      })
      .compile();

    entityManager = mod.get(EntityManager);
    userRepository = mod.get(UserRepository);
    userFactory = new UserFactory(entityManager.fork());
    userTableName = mod.get(MikroORM).getMetadata().get(User).tableName;
    contextUser = await userFactory.createOne();

    await mod.init();
  });

  afterAll(async () => {
    await mod.close();
  });

  it('should properly create a create audit log operation w/ field ignoring', async () => {
    const newUser = await userRepository.create(userFactory.makeOne());

    const em = entityManager.fork();
    const logInstance = await em.findOneOrFail(
      AuditLog,
      {
        tableName: userTableName,
        recordId: newUser.id.toString(),
        operation: AuditLogOperation.Create,
      },
      { populate: ['user'] },
    );
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
    });
    expect(logInstance.user?.get().id).toBe(contextUser.id);
  });

  it('should properly create a delete audit log operation', async () => {
    const newUser = await userRepository.create(userFactory.makeOne());
    await userRepository.delete(newUser.id);

    const em = entityManager.fork();
    const logInstance = await em.findOneOrFail(
      AuditLog,
      {
        tableName: userTableName,
        recordId: newUser.id.toString(),
        operation: AuditLogOperation.Delete,
      },
      { populate: ['user'] },
    );
    expect(logInstance.createdAt).not.toBe(null);
    expect(logInstance.diff).toBe(null);
    expect(logInstance.user?.get().id).toBe(contextUser.id);
  });

  it('should properly create a read audit log operation', async () => {
    const { id } = await userRepository.create(userFactory.makeOne());
    await userRepository.findOneByPk(id);

    const em = entityManager.fork();
    const logInstance = await em.findOneOrFail(
      AuditLog,
      {
        tableName: userTableName,
        recordId: id.toString(),
        operation: AuditLogOperation.Read,
      },
      { populate: ['user'] },
    );
    expect(logInstance.createdAt).not.toBe(null);
    expect(logInstance.user?.get().id).toBe(contextUser.id);
    expect(logInstance.diff).toBe(null);
  });

  it('should properly create an edit audit log operation', async () => {
    const newUser = await userRepository.create(userFactory.makeOne());
    const newUsername = `${newUser.username}${Date.now()}`;
    await userRepository.update(newUser.id, {
      username: newUsername,
      password: `${newUser.password}${Date.now()}`,
    });

    const em = entityManager.fork();
    const logInstance = await em.findOneOrFail(
      AuditLog,
      {
        tableName: userTableName,
        recordId: newUser.id.toString(),
        operation: AuditLogOperation.Update,
      },
      { populate: ['user'] },
    );
    expect(logInstance.createdAt).not.toBe(null);
    expect(logInstance.user?.get().id).toBe(contextUser.id);
    expect(logInstance.diff).toEqual({
      username: {
        old: newUser.username,
        new: newUsername,
      },
    });
  });
});
