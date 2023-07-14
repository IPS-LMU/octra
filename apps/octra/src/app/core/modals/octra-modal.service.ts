import { EventEmitter, Injectable } from '@angular/core';
import {
  NgbModal,
  NgbModalOptions,
  NgbModalRef,
} from '@ng-bootstrap/ng-bootstrap';
import { NgbModalWrapper } from "./ng-modal-wrapper";

@Injectable()
export class OctraModalService {
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

  public openModalRef<T>(modal: any, config: NgbModalOptions, data?: any): NgbModalWrapper<T> {
    const ref = this.modalService.open(modal, {
      ...config,
    }) as NgbModalWrapper<T>;
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
