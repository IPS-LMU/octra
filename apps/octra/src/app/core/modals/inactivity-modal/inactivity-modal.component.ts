import { Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgbActiveModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { SettingsService } from '../../shared/service';
import { AppStorageService } from '../../shared/service/appstorage.service';
import { OctraModal } from '../types';

@Component({
  selector: 'octra-activity-timeout-modal',
  templateUrl: './inactivity-modal.component.html',
  styleUrls: ['./inactivity-modal.component.scss'],
  imports: [TranslocoPipe],
})
export class InactivityModalComponent extends OctraModal {
  public static options: NgbModalOptions = {
    backdrop: true,
    keyboard: false,
  };

  constructor(
    public appStorage: AppStorageService,
    public settService: SettingsService,
    protected override activeModal: NgbActiveModal,
  ) {
    super('inactivityModal', activeModal);
  }
}
