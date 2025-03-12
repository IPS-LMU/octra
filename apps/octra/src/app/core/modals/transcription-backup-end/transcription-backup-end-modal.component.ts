import { Component, OnInit, SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { NgbActiveModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { DateTime } from 'luxon';
import { AudioService } from '../../shared/service';
import { AppStorageService } from '../../shared/service/appstorage.service';
import { AnnotationStoreService } from '../../store/login-mode/annotation/annotation.store.service';
import { OctraModal } from '../types';

export enum ModalEndAnswer {
  CANCEL = 'CANCEL',
  QUIT = 'QUIT',
  CONTINUE = 'CONTINUE',
}

@Component({
  selector: 'octra-transcription-backup-end-modal',
  templateUrl: './transcription-backup-end-modal.component.html',
  styleUrls: ['./transcription-backup-end-modal.component.scss'],
  imports: [TranslocoPipe],
})
export class TranscriptionBackupEndModalComponent
  extends OctraModal
  implements OnInit
{
  downloadClicked = false;
  downloadFile?: {
    name: string;
    url: string;
  };

  public static options: NgbModalOptions = {
    keyboard: false,
    backdrop: 'static',
  };

  constructor(
    private sanitizer: DomSanitizer,
    private annotationStore: AnnotationStoreService,
    private appStorageService: AppStorageService,
    private audioService: AudioService,
    public languageService: TranslocoService,
    protected override activeModal: NgbActiveModal,
  ) {
    super('transcriptionDemoEnd', activeModal);
  }

  sanitize(html: string) {
    this.sanitizer.sanitize(SecurityContext.HTML, html);
  }

  ngOnInit() {
    if (this.annotationStore.transcript) {
      const audioInfo = this.audioService.audioManager.resource.info;
      const annotation = this.annotationStore.transcript.serialize(
        audioInfo.fullname,
        audioInfo.sampleRate,
        audioInfo.duration,
      );
      const time = DateTime.now().toFormat('yyyy-LL-dd_HH-mm-ss');
      const name = `octra_backup_t${this.annotationStore.task?.id}_${time}.json`;
      this.downloadFile = {
        url: URL.createObjectURL(
          new File(
            [
              JSON.stringify(
                {
                  annotation,
                  logs: this.appStorageService.snapshot.onlineMode.logging.logs,
                  comment:
                    this.appStorageService.snapshot.onlineMode.currentSession
                      ?.comment,
                  feedback:
                    this.appStorageService.snapshot.onlineMode.currentSession
                      ?.assessment,
                },
                null,
                2,
              ),
            ],
            name,
            {
              type: 'application/json',
            },
          ),
        ),
        name,
      };
    }
  }

  override ngOnDestroy() {
    super.ngOnDestroy();
    if (this.downloadFile?.url) {
      URL.revokeObjectURL(this.downloadFile.url);
    }
  }
}
