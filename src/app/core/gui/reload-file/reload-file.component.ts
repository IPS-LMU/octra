import {Component, OnInit, ViewChild} from '@angular/core';
import {AppStorageService, OIDBLevel, OIDBLink} from '../../shared/service/appstorage.service';
import {SessionFile} from '../../obj/SessionFile';
import {FileSize, Functions} from '../../shared/Functions';
import {Router} from '@angular/router';
import {TranscriptionService} from '../../shared/service/transcription.service';
import {ModalService} from '../../modals/modal.service';
import {TranslateService} from '@ngx-translate/core';
import {OctraDropzoneComponent} from '../octra-dropzone/octra-dropzone.component';
import {AudioService} from '../../shared/service/audio.service';
import {TranscriptionStopModalAnswer} from '../../modals/transcription-stop-modal/transcription-stop-modal.component';

@Component({
  selector: 'app-reload-file',
  templateUrl: './reload-file.component.html',
  styleUrls: ['./reload-file.component.css']
})
export class ReloadFileComponent implements OnInit {
  @ViewChild('dropzone') dropzone: OctraDropzoneComponent;
  abortTranscription = () => {
    this.transcrServ.endTranscription();
    this.router.navigate(['/logout'], {
      queryParamsHandling: 'preserve'
    });
  };
  newTranscription = () => {
    this.modService.show('transcription_delete').then(() => {
      let keep_data = false;

      new Promise<void>((resolve) => {
        if (!(this.dropzone.oannotation === null || this.dropzone.oannotation === undefined)) {
          const new_levels: OIDBLevel[] = [];
          for (let i = 0; i < this.dropzone.oannotation.levels.length; i++) {
            new_levels.push(new OIDBLevel(i + 1, this.dropzone.oannotation.levels[i], i));
          }

          const new_links: OIDBLink[] = [];
          for (let i = 0; i < this.dropzone.oannotation.links.length; i++) {
            new_links.push(new OIDBLink(i + 1, this.dropzone.oannotation.links[i]));
          }
          this.appStorage.overwriteAnnotation(new_levels).then(
            () => {
              return this.appStorage.overwriteLinks(new_links);
            }
          ).then(() => {
            keep_data = true;
            resolve();
          }).catch((err) => {
            console.error(err);
          });
        } else {
          resolve();
        }
      }).then(() => {
        this.audioService.registerAudioManager(this.dropzone.audiomanager);
        this.appStorage.beginLocalSession(this.dropzone.files, keep_data, this.navigate,
          (error) => {
            if (error === 'file not supported') {
              this.showErrorMessage(this.langService.instant('reload-file.file not supported', {type: ''}));
            }
          }
        );
      });
    }).catch((error) => {
      console.error(error);
    });
  };
  onOfflineSubmit = () => {
    this.audioService.registerAudioManager(this.dropzone.audiomanager);
    this.appStorage.beginLocalSession(this.dropzone.files, true, this.navigate,
      (error) => {
        if (error === 'file not supported') {
          this.showErrorMessage(this.langService.instant('reload-file.file not supported', {type: ''}));
        }
      }
    );
  };
  private error = '';
  private navigate = () => {
    this.router.navigate(['/user/load'], {
      queryParamsHandling: 'preserve'
    });
  };

  get sessionfile(): SessionFile {
    return this.appStorage.sessionfile;
  }

  constructor(public router: Router,
              public appStorage: AppStorageService,
              public transcrServ: TranscriptionService,
              public modService: ModalService,
              public langService: TranslateService,
              private audioService: AudioService) {
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
    this.modService.show('transcription_stop').then((answer: TranscriptionStopModalAnswer) => {
      if (answer === TranscriptionStopModalAnswer.QUIT) {
        this.abortTranscription();
      }
    }).catch((error) => {
      console.error(error);
    });
  }

  private showErrorMessage(err: string) {
    this.error = err;
    this.modService.show('error', {
      text: err
    });
  }
}
