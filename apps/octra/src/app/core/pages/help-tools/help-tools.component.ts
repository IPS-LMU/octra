import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {APIService} from '../../shared/service';
import {AppStorageService} from '../../shared/service/appstorage.service';
import {LoginMode} from '../../store';

@Component({
  selector: 'octra-help-tools',
  templateUrl: './help-tools.component.html',
  styleUrls: ['./help-tools.component.css']
})
export class HelpToolsComponent implements OnInit, OnDestroy {
  @ViewChild('canvas', {static: false}) canvas: ElementRef;

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
    this.appStorage.clearSession();

    if (this.appStorage.useMode === LoginMode.LOCAL || this.appStorage.useMode === LoginMode.DEMO) {
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
    } else if (this.appStorage.useMode === LoginMode.ONLINE) {
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
    } else if (this.appStorage.useMode === LoginMode.URL) {
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
