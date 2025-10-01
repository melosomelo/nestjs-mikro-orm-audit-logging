import {
  EntityData,
  EntityManager,
  EntityName,
  FilterQuery,
  FindAllOptions,
  FindOneOptions,
  FromEntityType,
  Loaded,
  Primary,
  RequiredEntityData,
  wrap,
} from '@mikro-orm/postgresql';

export abstract class BaseRepository<T extends object> {
  constructor(
    private rootEntityManager: EntityManager,
    private entityName: EntityName<T>,
  ) {}

  private trxEm?: EntityManager;

  findOneByPk(pk: Primary<T>, opts?: FindOneOptions<T>) {
    return this.em.findOne<T>(this.entityName, pk as FilterQuery<T>, opts);
  }

  find(opts?: FindAllOptions<T>) {
    return this.em.findAll(this.entityName, opts);
  }

  async create(data: RequiredEntityData<T>) {
    const em = this.em;
    const instance = em.create(this.entityName, data);
    em.persist(instance);
    await em.flush();
    return instance;
  }

  async update(
    pk: Primary<T>,
    data: EntityData<FromEntityType<Loaded<T>>, false>,
  ) {
    const em = this.em;
    const targetInstance = await em.findOneOrFail(
      this.entityName,
      pk as FilterQuery<T>,
    );
    wrap(targetInstance).assign(data);
    await em.flush();
    return targetInstance;
  }

  async delete(pk: Primary<T>) {
    const em = this.em;
    const targetInstance = await em.findOneOrFail(
      this.entityName,
      pk as FilterQuery<T>,
    );
    em.remove(targetInstance);
    await em.flush();
  }

  get em() {
    return this.trxEm ?? this.rootEntityManager.fork();
  }

  withTrx(em: EntityManager) {
    const ctor = this.constructor as {
      new (
        rootEntityManager: EntityManager,
        entityName: EntityName<T>,
      ): BaseRepository<T>;
    };

    const newRepo = new ctor(this.rootEntityManager, this.entityName);
    newRepo.trxEm = em;
    return newRepo;
  }
}
