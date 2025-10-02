import { EntityMetadata, EventArgs, EventSubscriber } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { AuditLogOperation } from './audit-log-operation.enum';
import { AuditLog } from './audit-log.entity';

interface MakeAuditLogSubscriberOptions {
  operations: AuditLogOperation[];
  ignoredFields: string[];
}

@Injectable()
export class AuditLogSubscriberFactory {
  makeSubscriber<T extends object>(
    entityMetadata: EntityMetadata<T>,
    opts: MakeAuditLogSubscriberOptions,
  ): EventSubscriber<T> {
    const subscriber: EventSubscriber<T> = {
      getSubscribedEntities: () => [entityMetadata.name as string],
    };

    if (opts.operations.includes(AuditLogOperation.Create)) {
      subscriber.afterCreate = ((args) =>
        this.afterCreateHandler(
          args,
          opts.ignoredFields,
        )) as EventSubscriber<T>['afterCreate'];
    }

    return subscriber;
  }

  private async afterCreateHandler<T extends object>(
    args: EventArgs<T>,
    ignoredFields: string[],
  ) {
    const { em, meta, entity } = args;

    const stringifiedPrimaryKey = meta.primaryKeys
      .map((key) => String(entity[key]))
      .join(',');

    const diff = Object.entries(entity)
      .filter(([key]) => !ignoredFields.includes(key))
      .reduce(
        (prev, [key, value]) => {
          prev[key] = {
            old: null,
            new: value as unknown,
          };
          return prev;
        },
        {} as NonNullable<AuditLog['diff']>,
      );

    await em.insert(AuditLog, {
      tableName: meta.tableName,
      recordId: stringifiedPrimaryKey,
      operation: AuditLogOperation.Create,
      diff,
    });
  }
}
