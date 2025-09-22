import { Global, Module } from '@nestjs/common';
import { LoggingAppService } from './logging-app.service';

@Global()
@Module({
  providers: [LoggingAppService],
  exports: [LoggingAppService],
})
export class LoggingModuleModule {}
