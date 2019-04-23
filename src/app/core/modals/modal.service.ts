import {EventEmitter, Injectable} from '@angular/core';

@Injectable()
export class ModalService {
  public showmodal: EventEmitter<{ type: string, data?: any, emitter: EventEmitter<any> }>
    = new EventEmitter<{ type: string, data?: any, emitter: EventEmitter<any> }>();
  private modalaction: EventEmitter<any> = new EventEmitter<any>();

  constructor() {
  }

  /**
   * shows a predefined modal. this modal must be defined in octra-modal.component.
   */
  public show(type: string, data?: any): Promise<any> {
    return new Promise<void>((resolve, reject) => {
      this.showmodal.emit({type, data, emitter: this.modalaction});
      const subscr = this.modalaction.subscribe((result) => {
          subscr.unsubscribe();
          resolve(result);
        },
        (err) => {
          reject(err);
        });
    });
  }
}
