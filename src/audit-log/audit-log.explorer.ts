import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuditLogOperation } from './audit-log-operation.enum';
import { AUDITABLE_META_KEY } from './audit-log.decorators';
import { AuditLog } from './audit-log.entity';

@Injectable()
export class AuditLogExplorer implements OnModuleInit {
  constructor(
    private reflector: Reflector,
    private entityManager: EntityManager,
  ) {}

  private readonly logger = new Logger('AuditLogModule');

  onModuleInit() {
    this.logger.log('Beginning discovery of auditable entities');

    const allMetadata = Object.values(
      this.entityManager.getMetadata().getAll(),
    );

    for (const meta of allMetadata) {
      const auditConfig = this.reflector.get<AuditLogOperation[] | undefined>(
        AUDITABLE_META_KEY,
        meta.class,
      );
      const isAuditable = auditConfig !== undefined;

      if (!isAuditable) {
        continue;
      }

      this.logger.log(`Setting up audit subscriber for entity ${meta.name}`);
      this.entityManager.getEventManager().registerSubscriber({
        getSubscribedEntities: () => [meta.name as string],
        afterCreate: async (args) => {
          const { em, meta, entity } = args;
          await em.insert(AuditLog, {
            tableName: meta.tableName,
            recordId: meta.primaryKeys
              .map((key) => String(entity[key]))
              .join(','),
            operation: AuditLogOperation.Create,
            diff: Object.entries(entity).reduce(
              (prev, [key, value]) => {
                prev[key] = {
                  old: null,
                  new: value,
                };
                return prev;
              },
              {} as NonNullable<AuditLog['diff']>,
            ),
          });
        },
      });
    }
  }
}
