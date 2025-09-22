import { Global, Module } from '@nestjs/common';
import { TranslateService } from './translate.service';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TranslateInterceptor } from './translate.interceptor';

@Global()
@Module({
  providers: [
    TranslateService,
    {
      provide: APP_INTERCEPTOR,
      useClass: TranslateInterceptor,
    },
  ],
  exports: [TranslateService],
})
export class TranslateModule {}
