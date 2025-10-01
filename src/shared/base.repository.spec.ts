import ormConfig from '@/database/orm.config';
import {
  Entity,
  Opt,
  PrimaryKey,
  PrimaryKeyProp,
  Property,
} from '@mikro-orm/core';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { EntityManager, MikroORM } from '@mikro-orm/postgresql';
import { Inject } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BaseRepository } from './base.repository';

describe('BaseRepository', () => {
  let mod: TestingModule;
  let simplePkRepository: SimplePkEntityRepository;
  let compositePkRepository: CompositePkEntityRepository;
  let entityManager: EntityManager;
  let orm: MikroORM;
  beforeAll(async () => {
    mod = await Test.createTestingModule({
      controllers: [],
      providers: [SimplePkEntityRepository, CompositePkEntityRepository],
      imports: [
        MikroOrmModule.forRoot({
          ...ormConfig,
          entitiesTs: undefined,
          entities: [SimplePkEntity, CompositePkEntity],
        }),
      ],
    }).compile();

    orm = mod.get(MikroORM);
    simplePkRepository = mod.get(SimplePkEntityRepository);
    compositePkRepository = mod.get(CompositePkEntityRepository);
    entityManager = mod.get(EntityManager);

    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(async () => {
    await orm.getSchemaGenerator().dropSchema();
    await mod.close();
  });

  describe('findOneByPk', () => {
    it('should properly return entity with simple pk', async () => {
      const em = entityManager.fork();
      const name = `some random name${Date.now()}`;
      const pk = await em.insert(SimplePkEntity, {
        name,
      });

      const instance = await simplePkRepository.findOneByPk(pk);
      expect(instance).not.toBeNull();
      expect(instance!.name).toBe(name);
    });

    it('should properly return entity with composite pk', async () => {
      const em = entityManager.fork();
      const name = `some random name${Date.now()}`;

      await em.insert(CompositePkEntity, {
        name,
        pk1: 1,
        pk2: 1,
      });

      // Apparently MikroORM does not returning the primary key when using composite primary keys. We need to supply it manually
      const instance = await compositePkRepository.findOneByPk([1, 1]);
      expect(instance).not.toBeNull();
      expect(instance!.name).toBe(name);
    });
  });

  describe('create()', () => {
    it('should properly create entity ', async () => {
      const name = `some random name${Date.now()}`;
      const { pk } = await simplePkRepository.create({ name });

      const em = entityManager.fork();
      const instance = await em.findOneOrFail(SimplePkEntity, { pk });

      expect(instance.name).toBe(name);
    });
  });

  describe('update()', () => {
    it('should properly update entity', async () => {
      const name = `some random name${Date.now()}`;
      const { pk } = await simplePkRepository.create({ name });

      const newName = `${name}${Date.now()}`;
      await simplePkRepository.update(pk, { name: newName });

      const em = entityManager.fork();
      const instance = await em.findOneOrFail(SimplePkEntity, { pk });

      expect(instance.name).toBe(newName);
    });
  });

  describe('delete()', () => {
    it('should properly delete entity', async () => {
      const name = `some random name${Date.now()}`;
      const { pk } = await simplePkRepository.create({ name });

      await simplePkRepository.delete(pk);

      const em = entityManager.fork();
      const instance = await em.findOne(SimplePkEntity, { pk });

      expect(instance).toBe(null);
    });
  });

  describe('withTrx()', () => {
    it('should work properly with outside transaction', async () => {
      const name1 = `some random name${Date.now()}`;
      const { pk: pk1 } = await simplePkRepository.create({ name: name1 });
      const name2 = `some random name2${Date.now()}`;
      const { pk: pk2 } = await simplePkRepository.create({ name: name2 });

      const failingTrx = entityManager.fork();
      await failingTrx.begin();

      const newName2 = `${name2}-${Date.now()}`;

      try {
        // First, a failing transaction. First operation fails.
        await simplePkRepository
          .withTrx(failingTrx)
          .update(pk2, { name: newName2 });
        await simplePkRepository.withTrx(failingTrx).update(pk1, { pk: pk2 });
        // this expect should not be reached, as the previous update statement should throw.
        expect(1).toBe(2);
      } catch {
        await failingTrx.rollback();
      }
      const em = entityManager.fork();
      expect((await em.findOneOrFail(SimplePkEntity, { pk: pk2 })).name).toBe(
        name2,
      );

      // Now, one that should pass
      const successTrx = entityManager.fork();
      await successTrx.begin();

      await simplePkRepository.withTrx(successTrx).delete(pk1);
      await simplePkRepository
        .withTrx(successTrx)
        .update(pk2, { name: newName2 });

      await successTrx.commit();

      expect(
        await entityManager.fork().findOne(SimplePkEntity, { pk: pk1 }),
      ).toBe(null);
      expect(
        (await entityManager.fork().findOneOrFail(SimplePkEntity, { pk: pk2 }))
          .name,
      ).toBe(newName2);
    });
  });
});

@Entity()
class CompositePkEntity {
  @PrimaryKey()
  pk1: number;

  @PrimaryKey()
  pk2: number;

  [PrimaryKeyProp]?: ['pk1', 'pk2'];

  @Property()
  name: string;
}

class CompositePkEntityRepository extends BaseRepository<CompositePkEntity> {
  constructor(@Inject(EntityManager) entityManager: EntityManager) {
    super(entityManager, CompositePkEntity);
  }
}

@Entity()
class SimplePkEntity {
  @PrimaryKey({ autoincrement: true })
  pk: number & Opt;

  [PrimaryKeyProp]?: 'pk';

  @Property()
  name: string;
}

class SimplePkEntityRepository extends BaseRepository<SimplePkEntity> {
  constructor(@Inject(EntityManager) entityManager: EntityManager) {
    super(entityManager, SimplePkEntity);
  }
}
