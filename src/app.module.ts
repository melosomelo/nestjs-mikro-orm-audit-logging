import { Module } from '@nestjs/common';
import { AuditLogModule } from './audit-log/audit-log.module';
import { DatabaseModule } from './database/database.module';
import { EnvModule } from './env/env.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [EnvModule, DatabaseModule, UserModule, AuditLogModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
