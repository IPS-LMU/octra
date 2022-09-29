import {ChangeDetectionStrategy, ChangeDetectorRef, Component} from '@angular/core';
import {SettingsService} from '../../shared/service';
import {AppStorageService} from '../../shared/service/appstorage.service';
import {MDBModalRef, MDBModalService} from 'angular-bootstrap-md';
import {OctraModal} from '../types';

@Component({
  selector: 'octra-prompt-modal',
  templateUrl: './prompt-modal.component.html',
  styleUrls: ['./prompt-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class PromptModalComponent extends OctraModal {
  public formatConverter;
  protected data = undefined;

  constructor(modalService: MDBModalService, public appStorage: AppStorageService, private settService: SettingsService,
              private cd: ChangeDetectorRef, modalRef: MDBModalRef) {
    super('promptModal');
    this.init(modalService, modalRef);
  }

  public override close() {
    this.cd.markForCheck();
    this.cd.detectChanges();
    return super.close();
  }
}
