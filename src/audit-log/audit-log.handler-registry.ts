import { ContextService } from '@/context/context.service';
import {
  EntityMetadata,
  EntityProperty,
  EventArgs,
  ReferenceKind,
  RequiredEntityData,
} from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import _ from 'lodash';
import { AuditLogOperation } from './audit-log-operation.enum';
import { AUDIT_IGNORE_META_KEY } from './audit-log.decorators';
import { AuditLog } from './audit-log.entity';

@Injectable()
export class AuditLogHandlerRegistry {
  constructor(private contextService: ContextService) {}

  async afterCreateHandler<T extends object>(args: EventArgs<T>) {
    const { em, meta, entity } = args;

    const diff = this.buildDiff<T>({
      before: null,
      after: entity,
      entityMetadata: meta,
    });

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

  async afterReadHandler<T extends object>(args: EventArgs<T>) {
    const { em, entity, meta } = args;
    await em.insert(AuditLog, {
      tableName: meta.tableName,
      recordId: this.stringifyEntityPk(entity, meta),
      operation: AuditLogOperation.Read,
      user: this.contextService.currentUser?.id,
      diff: null,
    });
  }

  async afterUpdateHandler<T extends object>(args: EventArgs<T>) {
    const { em, meta, entity } = args;
    const changeSet = args.changeSet!;

    const diff = this.buildDiff<T>({
      before: em
        .fork()
        .create(meta.class, changeSet.originalEntity as RequiredEntityData<T>),
      after: entity,
      entityMetadata: meta,
    });

    await em.insert(AuditLog, {
      tableName: meta.tableName,
      recordId: this.stringifyEntityPk(entity, meta),
      operation: AuditLogOperation.Update,
      diff,
      user: this.contextService.currentUser?.id,
    });
  }

  private buildDiff<T extends object>({
    before,
    after,
    entityMetadata,
  }: {
    before: T | null;
    after: T | null;
    entityMetadata: EntityMetadata<T>;
  }) {
    return entityMetadata.props
      .filter((property) => !this.shouldIgnoreField(entityMetadata, property))
      .reduce(
        (acc, property) => {
          const propertyPath = property.embedded
            ? property.embedded
            : [property.name];
          const propDiffKey = propertyPath.join('.');
          const oldValue = before ? _.get(before, propertyPath, null) : null;
          const newValue = after ? _.get(after, propertyPath, null) : null;
          if (oldValue !== newValue) {
            acc[propDiffKey] = {
              old: oldValue,
              new: newValue,
            };
          }
          return acc;
        },
        {} as NonNullable<AuditLog['diff']>,
      );
  }

  private stringifyEntityPk<T extends object>(
    entity: T,
    metadata: EntityMetadata<T>,
  ) {
    return metadata.primaryKeys.map((key) => String(entity[key])).join(',');
  }

  private shouldIgnoreField<T extends object>(
    entityMetadata: EntityMetadata<T>,
    propertyMetadata: EntityProperty<T, any>,
  ) {
    // We ignore the embedded fields. We want to deal with their properties directly.
    const isEmbeddedField = propertyMetadata.kind === ReferenceKind.EMBEDDED;
    if (isEmbeddedField) {
      return true;
    }

    const isEmbeddedChildProperty =
      propertyMetadata.kind === ReferenceKind.SCALAR &&
      propertyMetadata.embedded;
    if (isEmbeddedChildProperty) {
      const [topLevelEmbeddedPropertyName, childEmbeddedPropertyName] =
        propertyMetadata.embedded!;
      const { embeddable: EmbeddableClass } =
        entityMetadata.properties[topLevelEmbeddedPropertyName];

      const parentEmbeddableHasAuditIgnore = !!Reflect.getMetadata(
        AUDIT_IGNORE_META_KEY,
        entityMetadata.class.prototype as object,
        topLevelEmbeddedPropertyName,
      );
      const fieldHasAuditIgnore = !!Reflect.getMetadata(
        AUDIT_IGNORE_META_KEY,
        EmbeddableClass.prototype as object,
        childEmbeddedPropertyName,
      );

      return parentEmbeddableHasAuditIgnore || fieldHasAuditIgnore;
    }

    const hasAuditIgnore =
      propertyMetadata.kind === ReferenceKind.SCALAR &&
      !!Reflect.getMetadata(
        AUDIT_IGNORE_META_KEY,
        entityMetadata.class.prototype as object,
        propertyMetadata.name,
      );
    return hasAuditIgnore;
  }
}
