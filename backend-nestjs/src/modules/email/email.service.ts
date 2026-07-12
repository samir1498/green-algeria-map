import { Injectable, Logger } from '@nestjs/common';
import { BrevoClient } from './brevo.client';
import {
  passwordResetTemplate,
  verificationEmailTemplate,
  welcomeEmailTemplate,
} from './templates';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly client: BrevoClient;
  private readonly clientUrl: string;

  constructor() {
    this.client = new BrevoClient();
    this.clientUrl =
      process.env.CLIENT_URL?.split(',')[0]?.trim() ?? 'http://localhost:3000';
  }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const url = `${this.clientUrl}/verify-email?token=${encodeURIComponent(token)}`;
    await this.client.send({
      to,
      subject: 'Verify your email — Green Algeria Map',
      html: verificationEmailTemplate({ url }),
    });
  }

  async sendPasswordReset(to: string, token: string): Promise<void> {
    const url = `${this.clientUrl}/reset-password?token=${encodeURIComponent(token)}`;
    await this.client.send({
      to,
      subject: 'Reset your password — Green Algeria Map',
      html: passwordResetTemplate({ url }),
    });
  }

  async sendWelcome(to: string): Promise<void> {
    await this.client.send({
      to,
      subject: 'Welcome to Green Algeria Map 🌳',
      html: welcomeEmailTemplate({}),
    });
  }
}
