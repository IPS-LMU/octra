import { Component, OnInit } from '@angular/core';
import { AppInfo } from '../../../app.info';
import { hasProperty } from '@octra/utilities';
import { AppStorageService } from '../../shared/service/appstorage.service';
import { BugReportService } from '../../shared/service/bug-report.service';
import { OctraModalService } from '../octra-modal.service';
import { YesNoModalComponent } from '../yes-no-modal/yes-no-modal.component';
import { LoginInvalidModalComponent } from '../login-invalid-modal/login-invalid-modal.component';
import { TranscriptionDeleteModalComponent } from '../transcription-delete-modal/transcription-delete-modal.component';
import { TranscriptionStopModalComponent } from '../transcription-stop-modal/transcription-stop-modal.component';
import { ErrorModalComponent } from '../error-modal/error-modal.component';
import { BugreportModalComponent } from '../bugreport-modal/bugreport-modal.component';
import { SupportedFilesModalComponent } from '../supportedfiles-modal/supportedfiles-modal.component';
import { DefaultComponent } from '../../component/default.component';

@Component({
  selector: 'octra-modal',
  templateUrl: './octra-modal.component.html',
  styleUrls: ['./octra-modal.component.scss'],
})
export class OctraModalComponent extends DefaultComponent implements OnInit {
  modals: any = {
    error: {
      visible: false,
      type: ErrorModalComponent,
    },
    bugreport: {
      visible: false,
      type: BugreportModalComponent,
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

  public bgdescr = '';
  public bgemail = '';
  public sendproObj = true;
  public bugsent = false;
  public data: any;

  public get AppInfo(): any {
    return AppInfo;
  }

  constructor(
    private modService: OctraModalService,
    public bugService: BugReportService,
    private appStorage: AppStorageService
  ) {
    super();
  }

  ngOnInit() {
    this.bgemail =
      this.appStorage.snapshot.authentication.me?.email !== undefined
        ? this.appStorage.snapshot.authentication.me?.email
        : '';
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
              data
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
