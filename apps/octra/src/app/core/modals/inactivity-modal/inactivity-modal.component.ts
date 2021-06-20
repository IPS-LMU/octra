import {Component, ViewChild} from '@angular/core';
import {Subject} from 'rxjs';
import {SettingsService} from '../../shared/service';
import {AppStorageService} from '../../shared/service/appstorage.service';
import {MdbModalConfig, MdbModalRef} from 'mdb-angular-ui-kit/modal';

@Component({
  selector: 'octra-activity-timeout-modal',
  templateUrl: './inactivity-modal.component.html',
  styleUrls: ['./inactivity-modal.component.scss']
})

export class InactivityModalComponent {
  public visible = false;
  public config: MdbModalConfig = {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: true
  };
  @ViewChild('modal', {static: true}) modal: any;
  protected data = undefined;
  private actionperformed: Subject<string> = new Subject<string>();

  constructor(public appStorage: AppStorageService, public settService: SettingsService,
              public modalRef: MdbModalRef<InactivityModalComponent>) {
  }

  public close(action: string) {
    this.modal.hide();
    this.visible = false;
    this.actionperformed.next(action);
  }
}
