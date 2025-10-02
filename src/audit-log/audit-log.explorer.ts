import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuditLogOperation } from './audit-log-operation.enum';
import { AUDITABLE_META_KEY } from './audit-log.decorators';
import { AuditLogSubscriberFactory } from './audit-log.subscriber-factory';

@Injectable()
export class AuditLogExplorer implements OnModuleInit {
  constructor(
    private reflector: Reflector,
    private entityManager: EntityManager,
    private subscriberFactory: AuditLogSubscriberFactory,
  ) {}

  private readonly logger = new Logger('AuditLogModule');

  onModuleInit() {
    this.logger.log('Beginning discovery of auditable entities');

    const allMetadata = Object.values(
      this.entityManager.getMetadata().getAll(),
    );

    for (const meta of allMetadata) {
      const auditOperations = this.reflector.get<
        AuditLogOperation[] | undefined
      >(AUDITABLE_META_KEY, meta.class);
      const isAuditable = auditOperations !== undefined;

      if (!isAuditable) {
        continue;
      }

      this.logger.log(`Setting up audit subscriber for entity ${meta.name}`);
      this.entityManager.getEventManager().registerSubscriber(
        this.subscriberFactory.makeSubscriber(meta, {
          operations: auditOperations,
        }),
      );
    }
  }
}
