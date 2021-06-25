import {EventEmitter} from '@angular/core';
import {MDBModalRef, MDBModalService} from 'angular-bootstrap-md';
import {Subject} from 'rxjs';

export const modalConfigurations = {
  bugreport: {
    keyboard: false,
    backdrop: true,
    ignoreBackdropClick: false,
    class: 'modal-xl'
  },
  error: {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: false
  },
  export: {
    keyboard: false,
    backdrop: true,
    ignoreBackdropClick: false,
    class: 'modal-xl'
  },
  help: {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: true,
    class: 'modal-lg'
  },
  inactivity: {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: true
  },
  missingPermission: {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: false
  },
  overview: {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: true,
    scroll: true,
    class: 'modal-lg'
  },
  prompt: {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: false,
    scroll: true,
    class: 'modal-lg'
  },
  shortcuts: {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: false,
    scroll: true,
    class: 'modal-lg'
  },
  statistics: {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: false,
    scroll: true,
    class: 'modal-lg'
  },
  supportedFiles: {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: false,
    scroll: true,
    class: 'modal-lg'
  },
  tools: {
    keyboard: false,
    backdrop: true,
    ignoreBackdropClick: false,
    scroll: true,
    class: 'modal-xl'
  },
  protected: {
    keyboard: false,
    backdrop: true,
    ignoreBackdropClick: true
  },
  transcriptionDelete: {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: false
  },
  transcriptionDemoEnd: {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: true
  },
  transcriptionGuidelines: {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: false,
    scroll: true,
    class: 'modal-lg'
  },
  transcriptionSend: {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: false
  },
  transcriptionSending: {
    keyboard: false,
    backdrop: true,
    ignoreBackdropClick: true
  },
  transcriptionStop: {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: false
  },
  yesNo: {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: false
  }
}

export class OctraModal {
  public readonly name: string;
  public modalService: MDBModalService;
  public thisClose: EventEmitter<any>;
  public modalRef: MDBModalRef;
  public action: Subject<any>;

  protected constructor(name: string, modalRef: MDBModalRef, modalService: MDBModalService) {
    this.name = name;
    this.thisClose = new EventEmitter<any>();
    this.modalService = modalService;
    this.modalRef = modalRef;
  }

  protected waitUntil(type: 'opened' | 'closed', action?: any): Promise<any> {
    return new Promise<any>((resolve) => {
      let observable;
      if (type === 'opened') {
        observable = this.modalService.opened;
      } else {
        observable = this.modalService.closed;
      }
      const subscr = observable.subscribe(() => {
        subscr.unsubscribe();

        if (type === 'closed') {
          console.log(`modal ${this.name} closed`);
          this.thisClose.emit(action);
          this.thisClose.complete();
        }

        resolve(action);
      })
    });
  }

  public close(action?: any): Promise<any> {
    this.modalRef.hide();
    return this.waitUntil('closed', action);
  }

  public applyAction(action: any) {
    this.action.next(action);
  }
}
