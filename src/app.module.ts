import { Module } from '@nestjs/common';
import { AuditLogModule } from './audit-log/audit-log.module';
import { ContextService } from './context/context.service';
import { DatabaseModule } from './database/database.module';
import { EnvModule } from './env/env.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    EnvModule,
    DatabaseModule,
    UserModule,
    ContextService,
    AuditLogModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
