import {Component} from '@angular/core';
import {SettingsService} from '../../shared/service';
import {AppStorageService} from '../../shared/service/appstorage.service';
import {MdbModalConfig, MdbModalRef} from 'mdb-angular-ui-kit/modal';

@Component({
  selector: 'octra-activity-timeout-modal',
  templateUrl: './inactivity-modal.component.html',
  styleUrls: ['./inactivity-modal.component.scss']
})

export class InactivityModalComponent {
  public static config: MdbModalConfig = {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: true
  };
  protected data = undefined;

  constructor(public appStorage: AppStorageService, public settService: SettingsService,
              public modalRef: MdbModalRef<InactivityModalComponent>) {
  }

  public close(action: string) {
    this.modalRef.close(action);
  }
}
