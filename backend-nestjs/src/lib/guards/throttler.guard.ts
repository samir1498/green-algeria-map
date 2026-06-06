import { Injectable } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerRequest } from '@nestjs/throttler';

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected async handleRequest(
    requestProps: ThrottlerRequest,
  ): Promise<boolean> {
    const { req } = this.getRequestResponse(requestProps.context) as {
      req: { url?: string };
    };
    if (req.url?.startsWith('/api/auth')) {
      return true;
    }
    return super.handleRequest(requestProps);
  }
}
