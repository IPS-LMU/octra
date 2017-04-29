import {Component, OnInit, ViewChild} from '@angular/core';
import {SessionService} from '../../service/session.service';
import {SessionFile} from '../../shared/SessionFile';
import {FileSize, Functions} from '../../shared/Functions';
import {Router} from '@angular/router';
import {TranscriptionService} from '../../service/transcription.service';
import {DropZoneComponent} from '../../component/drop-zone/drop-zone.component';
import {ModalService} from '../../service/modal.service';
import {TranslateService} from '@ngx-translate/core';
import {isNullOrUndefined} from 'util';

@Component({
  selector: 'app-reload-file',
  templateUrl: './reload-file.component.html',
  styleUrls: ['./reload-file.component.css']
})
export class ReloadFileComponent implements OnInit {
  @ViewChild('dropzone') dropzone: DropZoneComponent;

  private error = '';

  constructor(public router: Router,
              public sessServ: SessionService,
              public transcrServ: TranscriptionService,
              public modService: ModalService,
              public langService: TranslateService) {
    console.log('init reload');
  }

  get sessionfile(): SessionFile {
    return this.sessServ.sessionfile;
  }

  ngOnInit() {
  }

  private navigate = () => {
    this.router.navigate(['/user/load']);
  }

  getDropzoneFileString(file: File | SessionFile) {
    const fsize: FileSize = Functions.getFileSize(file.size);
    return Functions.buildStr('{0} ({1} {2})', [file.name, (Math.round(fsize.size * 100) / 100), fsize.label]);
  }

  abortTranscription = () => {
    this.transcrServ.endTranscription();
    this.router.navigate(['/logout']);
  }

  newTranscription = () => {
    this.sessServ.beginLocalSession(this.dropzone, false, this.navigate,
      (error) => {
        if (error === 'file not supported') {
          this.showErrorMessage(this.langService.instant('reload-file.file not supported', {type: ''}));
        }
      }
    );
  }

  onOfflineSubmit = () => {
    this.sessServ.beginLocalSession(this.dropzone, true, this.navigate,
      (error) => {
        if (error === 'file not supported') {
          this.showErrorMessage(this.langService.instant('reload-file.file not supported', {type: ''}));
        }
      }
    );
  }

  private showErrorMessage(err: string) {
    this.error = err;
    this.modService.show('error', err, null);
  }

  validate(file: any): boolean {
    return (!isNullOrUndefined(file)
      && (file.type === 'audio/wav' || file.type === 'audio/x-wav')
    );
  }
}
