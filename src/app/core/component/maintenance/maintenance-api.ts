import {HttpClient} from '@angular/common/http';

export class MaintenanceAPI {
  constructor(private serverURL: string, private httpClient: HttpClient) {
  }

  public readMaintenanceNotifications(hoursBefore = null): Promise<MaintenanceNotification> {
    return new Promise<MaintenanceNotification>((resolve, reject) => {
      const commandURL = (hoursBefore) ? `${this.serverURL}?hours_before=${hoursBefore}` : this.serverURL;

      this.httpClient.get(commandURL, {
        responseType: 'json'
      }).subscribe((json: MaintenanceNotification) => {
        if (!(json === null || json === undefined)) {
          resolve(json);
        } else {
          reject(new Error('response is null or undefined'));
        }
      }, (error) => {
        reject(error);
      });
    });
  }
}

export interface MaintenanceNotification {
  'type': NotificationType;
  'begin': string;
  'end': string;
}

export enum NotificationType {
  MAINTENANCE_SCHEDULED = 'MAINTENANCE_SCHEDULED'
}
