import { Component } from '@angular/core';
import { hasProperty } from '@octra/utilities';
import { AppInfo } from '../../../app.info';
import { DefaultComponent } from '../../component/default.component';
import { ErrorModalComponent } from '../error-modal/error-modal.component';
import { LoginInvalidModalComponent } from '../login-invalid-modal/login-invalid-modal.component';
import { OctraModalService } from '../octra-modal.service';
import { SupportedFilesModalComponent } from '../supportedfiles-modal/supportedfiles-modal.component';
import { TranscriptionDeleteModalComponent } from '../transcription-delete-modal/transcription-delete-modal.component';
import { TranscriptionStopModalComponent } from '../transcription-stop-modal/transcription-stop-modal.component';
import { YesNoModalComponent } from '../yes-no-modal/yes-no-modal.component';

@Component({
  selector: 'octra-modal',
  templateUrl: './octra-modal.component.html',
  styleUrls: ['./octra-modal.component.scss'],
})
export class OctraModalComponent extends DefaultComponent {
  modals: any = {
    error: {
      visible: false,
      type: ErrorModalComponent,
    },
    supportedfiles: {
      visible: false,
      type: SupportedFilesModalComponent,
    },
    yesno: {
      visible: false,
      type: YesNoModalComponent,
    },
    loginInvalid: {
      visible: false,
      type: LoginInvalidModalComponent,
    },
    transcriptionDelete: {
      visible: false,
      type: TranscriptionDeleteModalComponent,
    },
    transcriptionStop: {
      visible: false,
      type: TranscriptionStopModalComponent,
    },
  };

  public data: any;

  public get AppInfo(): any {
    return AppInfo;
  }

  constructor(private modService: OctraModalService) {
    super();
  }

  openModal(name: string, data?: any): Promise<any> {
    if (hasProperty(this.modals, name)) {
      if (hasProperty(this.modals, name)) {
        if (!this.modals[name].visible) {
          this.modals[name].visible = true;
          return this.modService
            .openModal(
              this.modals[name].type,
              this.modals[name].type.options,
              data,
            )
            .then(() => {
              this.modals[name].visible = false;
            });
        }
        return new Promise<void>((resolve) => {
          resolve();
        });
      } else {
        return new Promise<any>((reject) => {
          reject(new Error(`Can't find modal configuration for name ${name}`));
        });
      }
    }
    return new Promise<any>((reject) => {
      reject(new Error("Can't find modal with that name."));
    });
  }
}
