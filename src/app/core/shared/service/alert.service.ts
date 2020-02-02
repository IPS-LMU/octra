import {EventEmitter, Injectable} from '@angular/core';

@Injectable()
export class AlertService {

  public alertsend = new EventEmitter<{
    type: 'danger' | 'warning' | 'info' | 'success',
    message: string,
    duration: number,
    unique: boolean
  }>();

  constructor() {
  }

  public showAlert(type: 'danger' | 'warning' | 'info' | 'success', message: string, unique: boolean = true, duration?: number) {
    this.alertsend.emit({
      type,
      message,
      duration: (duration) ? duration : 5,
      unique
    });
  }
}
