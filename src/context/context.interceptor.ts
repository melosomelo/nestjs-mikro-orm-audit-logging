import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { ContextService, ContextUser } from './context.service';

/**
 * ContextInterceptor is a NestJS interceptor that "hijacks" the request so it runs
 * within the context defined by the ContextService, which contains the current user of the request (if there is one).
 */
@Injectable()
export class ContextInterceptor implements NestInterceptor {
  constructor(private readonly contextService: ContextService) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const contextUser = this.extractUserFromContext(context);
    return this.contextService.run(() => next.handle(), { user: contextUser });
  }

  // This method illustrates how you'd most likely extract the user when using JWT authentication
  private extractUserFromContext(context: ExecutionContext) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const request = context.switchToHttp().getRequest() as Request & {
      user?: { sub: number };
    };

    let contextUser: ContextUser | undefined;

    if (request.user && request.user.sub) {
      contextUser = { id: request.user.sub };
    }

    return contextUser;
  }
}
