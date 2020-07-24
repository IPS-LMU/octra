import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {SubscriptionManager} from '@octra/utilities';
import {APIService} from '../../shared/service';
import {AppStorageService} from '../../shared/service/appstorage.service';

@Component({
  selector: 'octra-help-tools',
  templateUrl: './help-tools.component.html',
  styleUrls: ['./help-tools.component.css']
})
export class HelpToolsComponent implements OnInit, OnDestroy {
  @ViewChild('canvas', {static: false}) canvas: ElementRef;

  private subscrmanager: SubscriptionManager = new SubscriptionManager();

  constructor(private appStorage: AppStorageService,
              private api: APIService) {
  }

  ngOnInit() {
  }

  ngOnDestroy() {

  }

  refreshApp() {
    document.location.reload(true);
  }

  clearAllData() {
    this.appStorage._loggedIn = false;

    if (this.appStorage.usemode === 'local' || this.appStorage.usemode === 'demo') {
      this.appStorage.clearAnnotationData().then(() => {
        this.appStorage.clearOptions().catch((error) => {
          console.error(error);
        });
      }).then(() => {
        this.appStorage.clearLoggingData().catch((error) => {
          console.error(error);
        });
      }).then(
        () => {
          alert('All cleared. The app will be reloaded.');
          document.location.reload();
        }
      );
    } else if (this.appStorage.usemode === 'online') {
      this.api.setOnlineSessionToFree(this.appStorage).then(() => {
        this.appStorage.clearAnnotationData().then(() => {
          this.appStorage.clearLoggingData().catch((error) => {
            console.error(error);
          });
        }).then(() => {
          this.appStorage.clearOptions().catch((error) => {
            console.error(error);
          });
        }).then(
          () => {
            alert('All cleared. The app will be reloaded.');
            document.location.reload();
          }
        );
      }).catch((error) => {
        console.error(error);
      });
    } else if (this.appStorage.usemode === 'url') {
      this.appStorage.clearAnnotationData().then(() => {
        this.appStorage.clearLoggingData().catch((error) => {
          console.error(error);
        });
      }).then(() => {
        this.appStorage.clearOptions().catch((error) => {
          console.error(error);
        });
      }).then(
        () => {
          alert('All cleared. The app will be reloaded.');
          document.location.reload();
        }
      );
    }
  }
}
