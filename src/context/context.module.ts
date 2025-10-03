import { Global, Module } from '@nestjs/common';
import { ContextService } from './context.service';

@Global()
@Module({
  controllers: [],
  exports: [ContextService],
  imports: [],
  providers: [ContextService],
})
export class ContextModule {}
