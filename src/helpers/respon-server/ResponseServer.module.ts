import { Global, Module } from '@nestjs/common';
import { ResponseService } from './ResponseServer';

@Global()
@Module({
  providers: [ResponseService],
  exports: [ResponseService],
})
export class ResponseServerModule {}
