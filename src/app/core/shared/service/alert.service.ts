import {EventEmitter, Injectable} from '@angular/core';

@Injectable()
export class AlertService {
  public alertInitialized = new EventEmitter<{
    id: number;
    component: any;
  }>();

  public counter = 0;
  public queue: AlertEntry[] = [];

  constructor() {
  }

  public showAlert(type: 'danger' | 'warning' | 'info' | 'success', data: string | any, unique: boolean = true, duration?: number): Promise<{
    id: number;
    component: any;
  }> {
    return new Promise<{
      id: number;
      component: any;
    }>((resolve) => {
      const alreadyExists = this.queue.findIndex((a) => {
        if (a.message !== data) {
          return (typeof data !== 'string' && a.component !== null
            && data.hasOwnProperty('componentName') && a.component.class.hasOwnProperty('componentName')
            && data.componentName === a.component.class.componentName);
        }
        return true;
      }) > -1;

      if (!unique || !alreadyExists) {
        const id = ++this.counter;

        const subscription = this.alertInitialized.subscribe((item) => {
          if (item.id === id) {
            subscription.unsubscribe();
            resolve(item);
          }
        });

        const entry: AlertEntry = {
          type,
          animation: 'opened',
          duration: (duration) ? duration : 5,
          message: (typeof data === 'string') ? data : '',
          unique,
          id,
          component: (typeof data !== 'string') ? {
            id,
            class: data,
            instance: null
          } : null
        };

        this.queue.push(entry);
      }
    });
  }

  public closeAlert(id: number) {
    const index = this.queue.findIndex((a) => {
      return a.id === id;
    });
    if (index > -1) {
      this.queue.splice(index, 1);
    }
  }
}

export interface AlertSendObj {
  type: 'danger' | 'warning' | 'info' | 'success',
  id: number,
  data: string | any,
  duration: number,
  unique: boolean
}

export interface AlertEntry {
  type: 'danger' | 'warning' | 'info' | 'success';
  message: any;
  duration: number;
  animation: string;
  unique: boolean;
  id: number;
  component: {
    id: number;
    class: any;
    instance: any;
  };
}
