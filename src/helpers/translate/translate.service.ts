import { Injectable, Scope, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import * as fs from 'fs';

@Injectable({ scope: Scope.REQUEST })
export class TranslateService {
  constructor(@Inject(REQUEST) private readonly request: Request) {}

  t(key: string): string {
    const lang = this.request?.headers['accept-language'] || 'en';
    try {
      const data = fs.readFileSync(`src/helpers/translate/i18n/${lang}.json`, {
        encoding: 'utf-8',
      });
      const i18n = JSON.parse(data);
      return i18n[key] || key;
    } catch (err) {
      return key;
    }
  }
}
