import axios, { AxiosInstance } from 'axios';

export interface BrevoSendOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class BrevoClient {
  private readonly http: AxiosInstance;
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor(apiKey?: string, fromEmail?: string, fromName?: string) {
    const key = apiKey ?? process.env.BREVO_API_KEY ?? '';
    this.fromEmail =
      fromEmail ?? process.env.FROM_EMAIL ?? 'noreply@greenalgeria.org';
    this.fromName = fromName ?? process.env.FROM_NAME ?? 'Green Algeria Map';
    this.http = axios.create({
      baseURL: 'https://api.brevo.com/v3',
      headers: {
        'api-key': key,
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
    });
  }

  async send({ to, subject, html, text }: BrevoSendOptions): Promise<void> {
    if (!process.env.BREVO_API_KEY) {
      throw new Error('BREVO_API_KEY is not set');
    }
    await this.http.post('/smtp/email', {
      sender: { name: this.fromName, email: this.fromEmail },
      to: [{ email: to }],
      subject,
      html,
      text,
    });
  }
}
