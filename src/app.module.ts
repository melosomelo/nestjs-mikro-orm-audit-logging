import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { EnvModule } from './env/env.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [EnvModule, DatabaseModule, UserModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
