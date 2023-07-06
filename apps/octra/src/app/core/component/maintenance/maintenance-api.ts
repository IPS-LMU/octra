import { HttpClient } from '@angular/common/http';

export class MaintenanceAPI {
  constructor(private serverURL: string, private httpClient: HttpClient) {}

  public readMaintenanceNotifications(
    hoursBefore: number
  ): Promise<MaintenanceNotification> {
    return new Promise<MaintenanceNotification>((resolve, reject) => {
      const commandURL = hoursBefore
        ? `${this.serverURL}?hours_before=${hoursBefore}`
        : this.serverURL;

      this.httpClient
        .get<MaintenanceNotification>(commandURL, {
          responseType: 'json',
        })
        .subscribe({
          next: (json: MaintenanceNotification) => {
            if (json) {
              resolve(json);
            } else {
              reject(new Error('response is undefined or undefined'));
            }
          },
          error: (error) => {
            reject(error);
          },
        });
    });
  }
}

export interface MaintenanceNotification {
  type: NotificationType;
  begin: string;
  end: string;
}

export enum NotificationType {
  MAINTENANCE_SCHEDULED = 'MAINTENANCE_SCHEDULED',
}
