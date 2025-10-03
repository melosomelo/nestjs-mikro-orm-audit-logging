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

    if (opts.operations.includes(AuditLogOperation.Create)) {
      subscriber.afterCreate = ((args) =>
        this.auditLogHandler.afterCreateHandler(
          args,
          opts.ignoredFields,
        )) as EventSubscriber<T>['afterCreate'];
    }

    return subscriber;
  }
}
