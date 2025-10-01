import { Module } from '@nestjs/common';
import { UserRepository } from './user.repository';

@Module({
  controllers: [],
  exports: [UserRepository],
  imports: [],
  providers: [UserRepository],
})
export class UserModule {}
