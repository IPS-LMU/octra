import {EventEmitter, Injectable} from '@angular/core';
import {OctraModal} from './types';
import {MDBModalService, ModalOptions} from 'angular-bootstrap-md';

@Injectable()
export class ModalService {
  public showmodal = new EventEmitter<{ type: string, data?: any, emitter: EventEmitter<any> }>();
  public closemodal = new EventEmitter<{ type: string }>();
  private modalaction = new EventEmitter<any>();

  constructor(private modalService: MDBModalService) {

  }

  public openModal(modal: any, config: ModalOptions, data?: any) {
    const modalRef = this.modalService.show(modal, {
      ...config,
      data
    });

    return (modalRef.content as OctraModal).thisClose.toPromise();
  }

  public openModalRef(modal: any, config: ModalOptions, data?: any) {
    const modalRef = this.modalService.show(modal, {
      ...config,
      data
    });

    return modalRef;
  }
}
