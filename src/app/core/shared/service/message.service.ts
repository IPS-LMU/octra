import {EventEmitter, Injectable} from '@angular/core';

@Injectable()
export class MessageService {
  public showmessage: EventEmitter<any> = new EventEmitter<any>();

  constructor() {
  }

  public showMessage(type: string, message: string) {
    this.showmessage.emit({
      type: type,
      message: message
    });
  }
}
