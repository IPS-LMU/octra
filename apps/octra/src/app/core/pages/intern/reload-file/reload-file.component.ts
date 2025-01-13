import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { navigateTo } from '@octra/ngx-utilities';
import { FileSize, getFileSize } from '@octra/utilities';
import { AppInfo } from '../../../../app.info';
import { OctraDropzoneComponent } from '../../../component/octra-dropzone/octra-dropzone.component';
import { ErrorModalComponent } from '../../../modals/error-modal/error-modal.component';
import { OctraModalService } from '../../../modals/octra-modal.service';
import { SessionFile } from '../../../obj/SessionFile';
import { AudioService } from '../../../shared/service';
import { AppStorageService } from '../../../shared/service/appstorage.service';
import { AuthenticationStoreService } from '../../../store/authentication';
import { AnnotationStoreService } from '../../../store/login-mode/annotation/annotation.store.service';

@Component({
  selector: 'octra-reload-file',
  templateUrl: './reload-file.component.html',
  styleUrls: ['./reload-file.component.scss'],
  imports: [OctraDropzoneComponent, TranslocoPipe],
})
export class ReloadFileComponent {
  @ViewChild('dropzone', { static: true }) dropzone!: OctraDropzoneComponent;
  private error = '';

  get sessionfile(): SessionFile {
    return this.appStorage.sessionfile;
  }

  constructor(
    public router: Router,
    public appStorage: AppStorageService,
    public annotationStoreService: AnnotationStoreService,
    public modService: OctraModalService,
    public langService: TranslocoService,
    private audioService: AudioService,
    private authStoreService: AuthenticationStoreService
  ) {}

  abortTranscription = () => {
    this.annotationStoreService.endTranscription();
    this.appStorage.logout();
  };

  newTranscription = () => {
    this.audioService.registerAudioManager(this.dropzone.audioManager!);
    this.authStoreService.loginLocal(
      this.dropzone.files.map((a) => a.file),
      this.dropzone.oannotation,
      true
    );
  };

  onOfflineSubmit = () => {
    this.audioService.registerAudioManager(this.dropzone.audioManager!);
    this.authStoreService.loginLocal(
      this.dropzone.files.map((a) => a.file),
      this.dropzone.oannotation,
      false
    );
  };

  public isN(obj: any): boolean {
    return obj === undefined || false;
  }

  getDropzoneFileString(file: File | SessionFile) {
    if (!(file === undefined)) {
      const fsize: FileSize = getFileSize(file.size);
      return `${file.name} (${Math.round(fsize.size * 100) / 100} ${
        fsize.label
      })`;
    }
    return '[FILE UNDEFINED]';
  }

  askForAbort() {
    this.abortTranscription();
  }

  private navigate = () => {
    navigateTo(this.router, ['/load'], AppInfo.queryParamsHandling).catch(
      (error) => {
        console.error(error);
      }
    );
  };

  private showErrorMessage(err: string) {
    this.error = err;
    this.modService
      .openModal(ErrorModalComponent, ErrorModalComponent.options, {
        text: err,
      })
      .catch((error) => {
        console.error(error);
      });
  }
}
