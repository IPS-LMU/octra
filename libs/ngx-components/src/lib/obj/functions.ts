import { NgbModal, NgbModalOptions, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

export class NgbModalWrapper<T> extends NgbModalRef {
  override get componentInstance(): T {
    return super.componentInstance;
  }
}

export function openModal<T>(
  service: NgbModal,
  content: any,
  options?: NgbModalOptions,
  data?: Partial<T>
): NgbModalWrapper<T> {
  const ref = service.open(content, options);

  if (data) {
    for (const key of Object.keys(data)) {
      ref.componentInstance[key] = (data as any)[key];
    }
  }

  return ref as NgbModalWrapper<T>;
}
