import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

export interface ContextUser {
  id: number;
}

export interface RequestContext {
  user?: ContextUser;
}

@Injectable()
export class ContextService {
  private readonly als = new AsyncLocalStorage<RequestContext>();

  run<T>(cb: () => T, store: RequestContext) {
    return this.als.run(store, cb);
  }

  get currentUser() {
    return this.als.getStore()?.user;
  }
}
