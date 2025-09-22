import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LoggingAppService {
  private readonly logger = new Logger(LoggingAppService.name);

  private logFile = path.join(
    process.cwd(),
    'src/helpers/logging/log/application.log',
  );
  private mailFile = path.join(
    process.cwd(),
    'src/helpers/logging/log/mail.log',
  );

  constructor() {
    this.ensureLogDirectoryExists();
    this.createLogFile();
  }

  private ensureLogDirectoryExists() {
    const logDir = path.dirname(this.logFile);

    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  private createLogFile() {
    if (!fs.existsSync(this.logFile)) {
      fs.writeFileSync(this.logFile, '');
    }

    if (!fs.existsSync(this.mailFile)) {
      fs.writeFileSync(this.mailFile, '');
    }
  }
  private writeToFileApp(level: string, message: string) {
    const formattedMessage = `${new Date().toISOString()} [${level}]: ${message}\n`;

    fs.appendFileSync(this.logFile, formattedMessage);
  }

  private writeToFileMail(level: string, message: string) {
    const formattedMessage = `${new Date().toISOString()} [${level}]: ${message}\n`;
    fs.appendFileSync(this.mailFile, formattedMessage);
  }

  success(message: string) {
    this.logger.log(message);
    this.writeToFileApp('SUCCESS', message);
  }

  error(message: string) {
    this.logger.error(message);
    this.writeToFileApp('ERROR', message);
  }

  errorMail(message: string) {
    this.logger.warn(message);
    this.writeToFileMail('ERROR', message);
  }

  successMail(message: string) {
    this.logger.warn(message);
    this.writeToFileMail('SUCCESS', message);
  }
}
