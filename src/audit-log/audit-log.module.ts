import { Module } from '@nestjs/common';
import { AuditLogExplorer } from './audit-log.explorer';

@Module({
  controllers: [],
  exports: [],
  imports: [],
  providers: [AuditLogExplorer],
})
export class AuditLogModule {}
