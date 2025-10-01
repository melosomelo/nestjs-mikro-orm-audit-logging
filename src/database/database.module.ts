import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Global, Module } from '@nestjs/common';
import ormConfig from './orm.config';

@Global()
@Module({
  imports: [MikroOrmModule.forRoot(ormConfig)],
})
export class DatabaseModule {}
