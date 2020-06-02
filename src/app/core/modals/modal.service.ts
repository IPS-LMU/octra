import {EventEmitter, Injectable} from '@angular/core';

@Injectable()
export class ModalService {
  public showmodal = new EventEmitter<{ type: string, data?: any, emitter: EventEmitter<any> }>();
  public closemodal = new EventEmitter<{ type: string }>();
  private modalaction = new EventEmitter<any>();

  constructor() {
  }

  /**
   * shows a predefined modal. this modal must be defined in octra-modal.component.
   */
  public show(type: string, data?: any): Promise<any> {
    return new Promise<void>((resolve, reject) => {
      console.log(`show modal!`);
      console.log(`type`);
      this.showmodal.emit({type, data, emitter: this.modalaction});
      const subscr = this.modalaction.subscribe((result) => {
          subscr.unsubscribe();
          this.closemodal.emit({type});
          resolve(result);
        },
        (err) => {
          reject(err);
        });
    });
  }
}
