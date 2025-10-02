import { applyDecorators, SetMetadata } from '@nestjs/common';
import { AuditLogOperation } from './audit-log-operation.enum';

export const AUDITABLE_META_KEY = 'auditable';

export function Auditable(
  operations: AuditLogOperation[] = [
    AuditLogOperation.Create,
    AuditLogOperation.Read,
    AuditLogOperation.Update,
    AuditLogOperation.Delete,
  ],
) {
  return applyDecorators(SetMetadata(AUDITABLE_META_KEY, operations));
}
