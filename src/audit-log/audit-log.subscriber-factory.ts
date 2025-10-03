import { EntityMetadata, EventSubscriber } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { AuditLogOperation } from './audit-log-operation.enum';
import { AuditLogHandlerRegistry } from './audit-log.handler-registry';

interface MakeAuditLogSubscriberOptions {
  operations: AuditLogOperation[];
  ignoredFields: string[];
}

@Injectable()
export class AuditLogSubscriberFactory {
  constructor(private auditLogHandler: AuditLogHandlerRegistry) {}

  makeSubscriber<T extends object>(
    entityMetadata: EntityMetadata<T>,
    opts: MakeAuditLogSubscriberOptions,
  ): EventSubscriber<T> {
    const subscriber: EventSubscriber<T> = {
      getSubscribedEntities: () => [entityMetadata.name as string],
    };

    opts.operations.forEach((op) => {
      switch (op) {
        case AuditLogOperation.Create:
          subscriber.afterCreate = ((args) =>
            this.auditLogHandler.afterCreateHandler(
              args,
              opts.ignoredFields,
            )) as EventSubscriber<T>['afterCreate'];
          break;
        case AuditLogOperation.Delete:
          subscriber.afterDelete = ((args) =>
            this.auditLogHandler.afterDeleteHandler(
              args,
            )) as EventSubscriber<T>['afterDelete'];
          break;
        case AuditLogOperation.Read:
          subscriber.onLoad = ((args) =>
            this.auditLogHandler.afterReadHandler(
              args,
            )) as EventSubscriber<T>['onLoad'];
          break;
      }
    });

    return subscriber;
  }
}
