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
    backdrop: true,
    ignoreBackdropClick: true
  },
  export: {
    keyboard: true,
    backdrop: true,
    scroll: true,
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
  private _modalService: MDBModalService;
  public thisClose: EventEmitter<any>;
  private _modalRef: MDBModalRef;
  public action: Subject<any>;

  protected constructor(name: string) {
    this.name = name;
    this.thisClose = new EventEmitter<any>();
  }

  public init(modalService: MDBModalService, modalRef: MDBModalRef) {
    this._modalService = modalService;
    this._modalRef = modalRef;
  }

  protected waitUntil(type: 'opened' | 'closed', action?: any): Promise<any> {
    return new Promise<any>((resolve) => {
      let observable;
      if (type === 'opened') {
        observable = this._modalService.opened;
      } else {
        observable = this._modalService.closed;
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
    this._modalRef.hide();
    return this.waitUntil('closed', action);
  }

  public applyAction(action: any) {
    this.action.next(action);
  }
}
