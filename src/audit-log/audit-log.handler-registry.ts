import { ContextService } from '@/context/context.service';
import { EntityMetadata, EventArgs } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { AuditLogOperation } from './audit-log-operation.enum';
import { AuditLog } from './audit-log.entity';

@Injectable()
export class AuditLogHandlerRegistry {
  constructor(private contextService: ContextService) {}

  async afterCreateHandler<T extends object>(
    args: EventArgs<T>,
    ignoredFields: string[],
  ) {
    const { em, meta, entity } = args;

    const diff = Object.entries(entity)
      .filter(([fieldName]) => !ignoredFields.includes(fieldName))
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
      recordId: this.stringifyEntityPk(entity, meta),
      operation: AuditLogOperation.Create,
      diff,
      user: this.contextService.currentUser?.id,
    });
  }

  async afterDeleteHandler<T extends object>(args: EventArgs<T>) {
    const { em, entity, meta } = args;

    await em.insert(AuditLog, {
      tableName: meta.tableName,
      recordId: this.stringifyEntityPk(entity, meta),
      operation: AuditLogOperation.Delete,
      user: this.contextService.currentUser?.id,
      diff: null,
    });
  }

  private stringifyEntityPk<T extends object>(
    entity: T,
    metadata: EntityMetadata<T>,
  ) {
    return metadata.primaryKeys.map((key) => String(entity[key])).join(',');
  }
}
