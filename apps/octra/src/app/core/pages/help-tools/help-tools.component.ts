import { Component, ElementRef, ViewChild } from '@angular/core';
import { APIService } from '../../shared/service';
import { AppStorageService } from '../../shared/service/appstorage.service';
import { LoginMode } from '../../store';
import { Store } from '@ngrx/store';
import { ModalService } from '../../modals/modal.service';
import { Router } from '@angular/router';

@Component({
  selector: 'octra-help-tools',
  templateUrl: './help-tools.component.html',
  styleUrls: ['./help-tools.component.scss'],
})
export class HelpToolsComponent {
  @ViewChild('canvas', { static: false }) canvas: ElementRef;

  constructor(
    private appStorage: AppStorageService,
    private api: APIService,
    private store: Store,
    private modalService: ModalService,
    private router: Router
  ) {}

  refreshApp() {
    document.location.reload();
  }

  clearAllData() {
    const clearSession = () => {
      this.appStorage.clearWholeSession().then(() => {
        this.appStorage.logout(false);
        setTimeout(() => {
          document.location.reload();
        }, 1000);
      });
    };

    if (
      this.appStorage.useMode === LoginMode.LOCAL ||
      this.appStorage.useMode === LoginMode.DEMO ||
      this.appStorage.useMode === LoginMode.URL
    ) {
      clearSession();
    } else if (this.appStorage.useMode === LoginMode.ONLINE) {
      this.api
        .setOnlineSessionToFree(this.appStorage)
        .then(() => {
          clearSession();
        })
        .catch((error) => {
          console.error(error);
        });
    } else {
      this.router.navigate(['/login']);
      document.location.reload();
    }
  }
}
