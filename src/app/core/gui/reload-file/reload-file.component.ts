import {Component, OnInit, ViewChild} from '@angular/core';
import {Router} from '@angular/router';
import {TranslocoService} from '@ngneat/transloco';
import {FileSize, Functions} from 'octra-components';
import {AppInfo} from '../../../app.info';
import {ModalService} from '../../modals/modal.service';
import {TranscriptionStopModalAnswer} from '../../modals/transcription-stop-modal/transcription-stop-modal.component';
import {SessionFile} from '../../obj/SessionFile';
import {AudioService, TranscriptionService} from '../../shared/service';
import {AppStorageService, OIDBLevel, OIDBLink} from '../../shared/service/appstorage.service';
import {OctraDropzoneComponent} from '../octra-dropzone/octra-dropzone.component';

@Component({
  selector: 'octra-reload-file',
  templateUrl: './reload-file.component.html',
  styleUrls: ['./reload-file.component.css']
})
export class ReloadFileComponent implements OnInit {

  @ViewChild('dropzone', {static: true}) dropzone: OctraDropzoneComponent;
  private error = '';

  get sessionfile(): SessionFile {
    return this.appStorage.sessionfile;
  }

  constructor(public router: Router,
              public appStorage: AppStorageService,
              public transcrServ: TranscriptionService,
              public modService: ModalService,
              public langService: TranslocoService,
              private audioService: AudioService) {
  }

  abortTranscription = () => {
    this.transcrServ.endTranscription();
    Functions.navigateTo(this.router, ['/logout'], AppInfo.queryParamsHandling).catch((error) => {
      console.error(error);
    });
  }

  newTranscription = () => {
    this.modService.show('transcriptionDelete').then((decision) => {
      if (decision === 'DELETE') {
        let keepData = false;

        new Promise<void>((resolve) => {
          if (!(this.dropzone.oannotation === null || this.dropzone.oannotation === undefined)) {
            const newLevels: OIDBLevel[] = [];
            for (let i = 0; i < this.dropzone.oannotation.levels.length; i++) {
              newLevels.push(new OIDBLevel(i + 1, this.dropzone.oannotation.levels[i], i));
            }

            const newLinks: OIDBLink[] = [];
            for (let i = 0; i < this.dropzone.oannotation.links.length; i++) {
              newLinks.push(new OIDBLink(i + 1, this.dropzone.oannotation.links[i]));
            }
            this.appStorage.overwriteAnnotation(newLevels).then(
              () => {
                return this.appStorage.overwriteLinks(newLinks);
              }
            ).then(() => {
              keepData = true;
              resolve();
            }).catch((err) => {
              console.error(err);
            });
          } else {
            resolve();
          }
        }).then(() => {
          this.audioService.registerAudioManager(this.dropzone.audioManager);
          this.appStorage.beginLocalSession(this.dropzone.files, keepData, this.navigate,
            (error) => {
              if (error === 'file not supported') {
                this.showErrorMessage(this.langService.translate('reload-file.file not supported', {type: ''}));
              }
            }
          );
        });
      } else {
        // do nothing because abort
      }
    }).catch((error) => {
      console.error(error);
    });
  }

  onOfflineSubmit = () => {
    this.audioService.registerAudioManager(this.dropzone.audioManager);
    this.appStorage.beginLocalSession(this.dropzone.files, true, this.navigate,
      (error) => {
        if (error === 'file not supported') {
          this.showErrorMessage(this.langService.translate('reload-file.file not supported', {type: ''}));
        }
      }
    );
  }

  public isN(obj: any): boolean {
    return (obj === null || obj === undefined);
  }

  ngOnInit() {
  }

  getDropzoneFileString(file: File | SessionFile) {
    if (!(file === null || file === undefined)) {
      const fsize: FileSize = Functions.getFileSize(file.size);
      return `${file.name} (${(Math.round(fsize.size * 100) / 100)} ${fsize.label})`;
    }
    return '[FILE UNDEFINED]';
  }

  askForAbort() {
    this.modService.show('transcriptionStop').then((answer: TranscriptionStopModalAnswer) => {
      if (answer === TranscriptionStopModalAnswer.QUIT) {
        this.abortTranscription();
      }
    }).catch((error) => {
      console.error(error);
    });
  }

  private navigate = () => {
    Functions.navigateTo(this.router, ['/user/load'], AppInfo.queryParamsHandling).catch((error) => {
      console.error(error);
    });
  }

  private showErrorMessage(err: string) {
    this.error = err;
    this.modService.show('error', {
      text: err
    }).catch((error) => {
      console.error(error);
    });
  }
}
