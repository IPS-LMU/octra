import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {APIService} from '../../shared/service';
import {AppStorageService} from '../../shared/service/appstorage.service';
import {LoginMode} from '../../store';
import {Store} from '@ngrx/store';
import * as TranscriptionActions from '../../store/transcription/transcription.actions'
import * as IDBActions from '../../store/idb/idb.actions'
import {SubscriptionManager} from '@octra/utilities';
import {timer} from 'rxjs';

@Component({
  selector: 'octra-help-tools',
  templateUrl: './help-tools.component.html',
  styleUrls: ['./help-tools.component.css']
})
export class HelpToolsComponent implements OnInit, OnDestroy {
  @ViewChild('canvas', {static: false}) canvas: ElementRef;

  private subscrManager = new SubscriptionManager();

  constructor(private appStorage: AppStorageService,
              private api: APIService,
              private store: Store) {
  }

  ngOnInit() {
  }

  ngOnDestroy() {

  }

  refreshApp() {
    document.location.reload(true);
  }

  clearAllData() {
    this.appStorage.clearOnlineSession();

    const clearAll = () => {
      this.store.dispatch(TranscriptionActions.clearAnnotation());
      this.store.dispatch(IDBActions.clearAllOptions());
      this.appStorage.clearLoggingDataPermanently();

      this.subscrManager.add(timer(3000).subscribe(() => {
        alert('All cleared. The app will be reloaded.');
        document.location.reload();
      }));
    };

    if (this.appStorage.useMode === LoginMode.LOCAL || this.appStorage.useMode === LoginMode.DEMO || this.appStorage.useMode === LoginMode.URL) {
      clearAll();
    } else if (this.appStorage.useMode === LoginMode.ONLINE) {
      this.api.setOnlineSessionToFree(this.appStorage).then(() => {
        clearAll();
      }).catch((error) => {
        console.error(error);
      });
    }
  }
}
