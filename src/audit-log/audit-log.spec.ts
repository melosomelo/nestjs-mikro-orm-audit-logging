import { ContextModule } from '@/context/context.module';
import { ContextService } from '@/context/context.service';
import ormConfig from '@/database/orm.config';
import { Organization } from '@/organization/organization.entity';
import { OrganizationFactory } from '@/organization/organization.factory';
import { Address } from '@/shared/embeddables/address.embeddable';
import { User } from '@/user/user.entity';
import { UserFactory } from '@/user/user.factory';
import { UserRepository } from '@/user/user.repository';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { EntityManager, MikroORM } from '@mikro-orm/postgresql';
import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogOperation } from './audit-log-operation.enum';
import { AuditLog } from './audit-log.entity';
import { AuditLogModule } from './audit-log.module';

describe('Audit Logging', () => {
  let mod: TestingModule;
  let entityManager: EntityManager;
  let userRepository: UserRepository;
  let userFactory: UserFactory;
  let orgFactory: OrganizationFactory;
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
          entities: [User, AuditLog, Address, Organization],
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
    orgFactory = new OrganizationFactory(entityManager.fork());
    userTableName = mod.get(MikroORM).getMetadata().get(User).tableName;
    contextUser = await userFactory.createOne();

    await mod.init();
  });

  afterAll(async () => {
    await mod.close();
  });

  it('should properly create a create audit log operation', async () => {
    const newOrganization = await orgFactory.createOne();
    const newUser = await userRepository.create(
      userFactory.makeOne({ organization: newOrganization.id }),
    );

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
      'address.street': {
        old: null,
        new: newUser.address.street,
      },
      'address.postalCode': {
        old: null,
        new: newUser.address.postalCode,
      },
      'address.city': {
        old: null,
        new: newUser.address.city,
      },
      organization: {
        old: null,
        new: newOrganization.id,
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
    const oldOrganization = await orgFactory.createOne();
    const newUser = await userRepository.create(
      userFactory.makeOne({ organization: oldOrganization }),
    );
    const newUsername = `${newUser.username}${Date.now()}`;
    const newAddress: Address = {
      city: `${newUser.address.city}${Date.now()}`,
      country: `${newUser.address.country}${Date.now()}`,
      postalCode: `${newUser.address.postalCode}${Date.now()}`,
      street: `${newUser.address.street}${Date.now()}`,
    };
    const newOrganization = await orgFactory.createOne();
    await userRepository.update(newUser.id, {
      username: newUsername,
      password: `${newUser.password}${Date.now()}`,
      address: newAddress,
      organization: newOrganization.id,
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
      'address.street': {
        old: newUser.address.street,
        new: newAddress.street,
      },
      'address.postalCode': {
        old: newUser.address.postalCode,
        new: newAddress.postalCode,
      },
      'address.city': {
        old: newUser.address.city,
        new: newAddress.city,
      },
      organization: {
        old: oldOrganization.id,
        new: newOrganization.id,
      },
    });
  });
});
