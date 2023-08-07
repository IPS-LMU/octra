export class OctraEvent<T> extends EventTarget {
  constructor() {
    super();
  }

  private handlers: {
    next?: any;
    error?: any;
    complete?: any;
  }[] = [];

  subscribe(handler: { next?: any; error?: any, complete?: any }) {
    this.handlers.push(handler);

    if (handler.next) {
      this.addEventListener('next', handler.next);
    }
    if (handler.error) {
      this.addEventListener('error', handler.error);
    }
    if (handler.complete) {
      this.addEventListener('complete', handler.complete);
    }
  }

  unsubscribe() {
    for (const handler of this.handlers) {
      if (handler.next) {
        this.removeEventListener('next', handler.next);
      }
      if (handler.error) {
        this.removeEventListener('error', handler.error);
      }
      if (handler.complete) {
        this.removeEventListener('complete', handler.complete);
      }
    }
    this.handlers = [];
  }

  complete() {
    this.unsubscribe();
  }

  next<T>(data: T, unsubscribe: boolean = false): void {
    window.setTimeout(() => {
      this.dispatchEvent(
        new CustomEvent('next', {
          detail: data,
        })
      );

      if (unsubscribe) {
        this.unsubscribe();
      }
    }, 0);
  }

  error(error: any): void {
    window.setTimeout(() => {
      this.dispatchEvent(
        new CustomEvent('next', {
          detail: error,
        })
      );
    }, 0);
  }
}
