import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuditLogOperation } from './audit-log-operation.enum';
import {
  AUDIT_IGNORE_META_KEY,
  AUDITABLE_META_KEY,
} from './audit-log.decorators';
import { AuditLogSubscriberFactory } from './audit-log.subscriber-factory';

@Injectable()
export class AuditLogExplorer {
  constructor(
    private reflector: Reflector,
    private entityManager: EntityManager,
    private subscriberFactory: AuditLogSubscriberFactory,
  ) {}

  private readonly logger = new Logger('AuditLogModule');

  registerAuditableEntitiesSubscribers() {
    this.logger.log('Beginning discovery of auditable entities');

    const allMetadata = Object.values(
      this.entityManager.getMetadata().getAll(),
    );

    for (const entityMetadata of allMetadata) {
      const auditOperations = this.reflector.get<
        AuditLogOperation[] | undefined
      >(AUDITABLE_META_KEY, entityMetadata.class);
      const isAuditable = auditOperations !== undefined;

      if (!isAuditable) {
        continue;
      }

      const ignoredFields = entityMetadata.props
        .filter((field) => {
          const shouldIgnore = !!Reflect.getMetadata(
            AUDIT_IGNORE_META_KEY,
            entityMetadata.class.prototype as object,
            field.name,
          );
          return shouldIgnore;
        })
        .map((field) => field.name);

      this.logger.log(
        `Setting up audit subscriber for entity ${entityMetadata.name}`,
      );

      const entitySubscriber = this.subscriberFactory.makeSubscriber(
        entityMetadata,
        {
          operations: auditOperations,
          ignoredFields,
        },
      );
      this.entityManager.getEventManager().registerSubscriber(entitySubscriber);
    }
  }
}
