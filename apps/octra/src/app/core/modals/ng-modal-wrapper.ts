import { NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

export class NgbModalWrapper<T> extends NgbModalRef {
  override get componentInstance(): T {
    return super.componentInstance;
  }
}
