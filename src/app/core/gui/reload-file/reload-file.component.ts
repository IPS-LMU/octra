import {Component, OnInit, ViewChild} from '@angular/core';
import {AppStorageService} from '../../shared/service/appstorage.service';
import {SessionFile} from '../../obj/SessionFile';
import {FileSize, Functions} from '../../shared/Functions';
import {Router} from '@angular/router';
import {TranscriptionService} from '../../shared/service/transcription.service';
import {ModalService} from '../../shared/service/modal.service';
import {TranslateService} from '@ngx-translate/core';
import {isNullOrUndefined} from 'util';
import {OctraDropzoneComponent} from '../octra-dropzone/octra-dropzone.component';

@Component({
  selector: 'app-reload-file',
  templateUrl: './reload-file.component.html',
  styleUrls: ['./reload-file.component.css']
})
export class ReloadFileComponent implements OnInit {
  @ViewChild('dropzone') dropzone: OctraDropzoneComponent;

  private error = '';

  constructor(public router: Router,
              public sessServ: AppStorageService,
              public transcrServ: TranscriptionService,
              public modService: ModalService,
              public langService: TranslateService) {
  }

  get sessionfile(): SessionFile {
    return this.sessServ.sessionfile;
  }

  public isN(obj: any): boolean {
    return isNullOrUndefined(obj);
  }

  ngOnInit() {
  }

  private navigate = () => {
    this.router.navigate(['/user/load']);
  }

  getDropzoneFileString(file: File | SessionFile) {
    if (!isNullOrUndefined(file)) {
      const fsize: FileSize = Functions.getFileSize(file.size);
      return `${file.name} (${(Math.round(fsize.size * 100) / 100)} ${fsize.label})`;
    }
    return '[FILE UNDEFINED]';
  }

  abortTranscription = () => {
    this.transcrServ.endTranscription();
    this.router.navigate(['/logout']);
  };

  newTranscription = () => {
    let keep_data = false;

    const process = () => {
      this.sessServ.beginLocalSession(this.dropzone.files, keep_data, this.navigate,
        (error) => {
          if (error === 'file not supported') {
            this.showErrorMessage(this.langService.instant('reload-file.file not supported', {type: ''}));
          }
        }
      );
    };
    if (!isNullOrUndefined(this.dropzone.oannotation)) {
      this.sessServ.overwriteAnnotation(this.dropzone.oannotation.levels).then(() => {
        keep_data = true;
        process();
      }).catch((err) => {
        console.error(err)
      });
    } else {
      process();
    }
  };

  onOfflineSubmit = () => {
    this.sessServ.beginLocalSession(this.dropzone.files, true, this.navigate,
      (error) => {
        if (error === 'file not supported') {
          this.showErrorMessage(this.langService.instant('reload-file.file not supported', {type: ''}));
        }
      }
    );
  };

  private showErrorMessage(err: string) {
    this.error = err;
    this.modService.show('error', err, null);
  }
}
