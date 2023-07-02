import { EventEmitter, Injectable } from '@angular/core';
import {
  NgbModal,
  NgbModalOptions,
  NgbModalRef,
} from '@ng-bootstrap/ng-bootstrap';

@Injectable()
export class ModalService {
  public showmodal = new EventEmitter<{
    type: string;
    data?: any;
    emitter: EventEmitter<any>;
  }>();
  public closemodal = new EventEmitter<{ type: string }>();
  private modalaction = new EventEmitter<any>();

  constructor(private modalService: NgbModal) {}

  public openModal<T, R>(modal: T, config: NgbModalOptions, data?: any) {
    const modalRef = this.modalService.open(modal, {
      ...config,
    });

    this.applyData(modalRef, data);

    return modalRef.result as Promise<R>;
  }

  public openModalRef(modal: any, config: NgbModalOptions, data?: any) {
    const ref = this.modalService.open(modal, {
      ...config,
    });
    this.applyData(ref, data);

    return ref;
  }

  public applyData(modalRef: NgbModalRef, data?: any) {
    if (data) {
      for (const attr in data) {
        modalRef.componentInstance[attr] = data[attr];
      }
    }
  }
}
