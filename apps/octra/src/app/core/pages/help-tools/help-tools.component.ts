import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {APIService} from '../../shared/service';
import {AppStorageService} from '../../shared/service/appstorage.service';
import {LoginMode} from '../../store';
import {Store} from '@ngrx/store';
import {SubscriptionManager} from '@octra/utilities';
import {Subscription} from 'rxjs';
import {ModalService} from '../../modals/modal.service';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {Router} from '@angular/router';

@Component({
  selector: 'octra-help-tools',
  templateUrl: './help-tools.component.html',
  styleUrls: ['./help-tools.component.css']
})
export class HelpToolsComponent implements OnInit, OnDestroy {
  @ViewChild('canvas', {static: false}) canvas: ElementRef;

  private subscrManager = new SubscriptionManager<Subscription>();

  constructor(private appStorage: AppStorageService,
              private api: APIService,
              private store: Store,
              private modalService: ModalService,
              private router: Router) {
  }

  ngOnInit() {
  }

  ngOnDestroy() {

  }

  refreshApp() {
    document.location.reload(true);
  }

  clearAllData() {
    const login = document.location.href.replace('help-tools', '');

    const clearSession = () => {
      this.modalService.show('protected', {
        text: 'Please wait a moment (max. 5 seconds)'
      }).then((modal: BsModalRef) => {
        this.appStorage.clearWholeSession().then(() => {
          modal.hide();
          this.appStorage.logout(false);
          setTimeout(() => {
            document.location.reload(true);
          }, 1000);
        }).catch((error) => {
          console.error(error);
        });
      }).catch((error) => {
        console.error(error);
      });
    };

    if (this.appStorage.useMode === LoginMode.LOCAL || this.appStorage.useMode === LoginMode.DEMO || this.appStorage.useMode === LoginMode.URL) {
      clearSession();
    } else if (this.appStorage.useMode === LoginMode.ONLINE) {
      this.api.setOnlineSessionToFree(this.appStorage).then(() => {
        clearSession();
      }).catch((error) => {
        console.error(error);
      });
    } else {
      this.router.navigate(['/login']);
      document.location.reload(true);
    }
  }
}
