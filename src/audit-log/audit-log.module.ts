import { Module } from '@nestjs/common';
import { AuditLogExplorer } from './audit-log.explorer';
import { AuditLogSubscriberFactory } from './audit-log.subscriber-factory';

@Module({
  controllers: [],
  exports: [],
  imports: [],
  providers: [AuditLogExplorer, AuditLogSubscriberFactory],
})
export class AuditLogModule {}
