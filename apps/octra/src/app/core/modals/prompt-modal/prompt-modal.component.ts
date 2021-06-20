import {ChangeDetectionStrategy, ChangeDetectorRef, Component} from '@angular/core';
import {Subject} from 'rxjs';
import {SettingsService} from '../../shared/service';
import {AppStorageService} from '../../shared/service/appstorage.service';
import {MdbModalConfig, MdbModalRef, MdbModalService} from 'mdb-angular-ui-kit/modal';

@Component({
  selector: 'octra-prompt-modal',
  templateUrl: './prompt-modal.component.html',
  styleUrls: ['./prompt-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class PromptModalComponent {
  public static config: MdbModalConfig = {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: false,
    modalClass: 'modal-lg'
  };

  public formatConverter;
  protected data = undefined;
  private actionperformed: Subject<void> = new Subject<void>();

  constructor(private modalService: MdbModalService, public appStorage: AppStorageService, private settService: SettingsService,
              private cd: ChangeDetectorRef, public modalRef: MdbModalRef<PromptModalComponent>) {
  }

  public close() {
    this.modalRef.close();
    this.actionperformed.next();
    this.cd.markForCheck();
    this.cd.detectChanges();
  }
}
