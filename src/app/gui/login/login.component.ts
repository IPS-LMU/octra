import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import {Router} from '@angular/router';
import {NgForm} from '@angular/forms';
import {LoginService} from '../../service/login.service';
import {SessionService} from '../../service/session.service';
import {ComponentCanDeactivate} from '../../guard/login.deactivateguard';
import {Observable} from 'rxjs/Rx';
import {FileSize, Functions} from '../../shared/Functions';
import {APIService} from '../../service/api.service';
import {BrowserCheck} from '../../shared/BrowserCheck';
import {SessionFile} from '../../shared/SessionFile';
import {OCTRANIMATIONS} from '../../shared/OCTRAnimations';
import {DropZoneComponent} from '../../component/drop-zone/drop-zone.component';
import {isArray, isNullOrUndefined, isNumber} from 'util';
import {SubscriptionManager} from '../../shared';
import {SettingsService} from '../../service/settings.service';
import {ModalService} from '../../service/modal.service';
import {ModalComponent} from 'ng2-bs3-modal/ng2-bs3-modal';
import {TranslateService} from '@ngx-translate/core';
import {AppInfo} from '../../app.info';
import {Converter} from '../../shared/Converters/Converter';
import {OAnnotation, OAudiofile} from '../../types/annotation';
import {AudioInfo} from '../../shared/AudioInfo';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  providers: [LoginService],
  animations: OCTRANIMATIONS
})
export class LoginComponent implements OnInit, OnDestroy, ComponentCanDeactivate, AfterViewInit {
  @ViewChild('f') loginform: NgForm;
  @ViewChild('dropzone') dropzone: DropZoneComponent;
  @ViewChild('agreement') agreement: ModalComponent;
  @ViewChild('localmode') localmode: ElementRef;
  @ViewChild('onlinemode') onlinemode: ElementRef;

  public valid_platform = false;
  public valid_size = false;
  public browser_check: BrowserCheck;
  public agreement_checked = true;

  public files: {
    status: string,
    file: File,
    checked_converters: number
  }[] = [];

  private oaudiofile: OAudiofile;
  private oannotation: OAnnotation;

  public projects: string[] = [];

  private subscrmanager: SubscriptionManager;

  get sessionfile(): SessionFile {
    return this.sessionService.sessionfile;
  }

  get apc(): any {
    return this.settingsService.app_settings;
  }

  public get Math(): Math {
    return Math;
  }

  valid = false;

  member = {
    id: '',
    agreement: '',
    project: '',
    jobno: ''
  };

  err = '';

  constructor(private router: Router,
              public sessionService: SessionService,
              private api: APIService,
              private cd: ChangeDetectorRef,
              private settingsService: SettingsService,
              private modService: ModalService,
              private langService: TranslateService) {
    this.subscrmanager = new SubscriptionManager();
  }

  ngOnInit() {
    this.browser_check = new BrowserCheck();
    this.valid_platform = true;

    if (this.apc.octra.allowed_browsers.length > 0) {
      this.valid_platform = this.browser_check.isValidBrowser(this.apc.octra.allowed_browsers);
    } else {
      this.valid_platform = true;
    }

    if (this.settingsService.responsive.enabled === false) {
      this.valid_size = window.innerWidth >= this.settingsService.responsive.fixedwidth;
    } else {
      this.valid_size = true;
    }

    this.cd.markForCheck();
    this.cd.detectChanges();
  }

  ngAfterViewInit() {
    this.loadPojectsList();
    setTimeout(() => {
      jQuery.material.init();

      const max_height: number = Math.max(Number(this.onlinemode.nativeElement.clientHeight),
        Number(this.localmode.nativeElement.clientHeight));
      console.log(`${this.onlinemode.nativeElement.clientHeight} ${this.localmode.nativeElement.clientHeight}`);
      this.localmode.nativeElement.style.height = max_height + 'px';
      this.onlinemode.nativeElement.style.height = max_height + 'px';
    }, 0);
  }

  ngOnDestroy() {
    this.subscrmanager.destroy();
  }

  onSubmit(form: NgForm) {
    let new_session = false;
    let new_session_after_old = false;
    let continue_session = false;

    if (isNullOrUndefined(this.member.jobno) || this.member.jobno === '') {
      this.member.jobno = '0';
    }

    if (this.sessionService.sessionfile !== null) {
      // last was offline mode, begin new Session
      new_session = true;
    } else {
      if (!isNullOrUndefined(this.sessionService.data_id) && isNumber(this.sessionService.data_id)) {
        // last session was online session
        // check if credentials are available
        if (
          !isNullOrUndefined(this.sessionService.member_project) &&
          !isNullOrUndefined(this.sessionService.member_jobno) &&
          !isNullOrUndefined(this.sessionService.member_id)
        ) {
          // check if credentials are the same like before
          if (
            this.sessionService.member_id === this.member.id &&
            Number(this.sessionService.member_jobno) === Number(this.member.jobno) &&
            this.sessionService.member_project === this.member.project
          ) {
            continue_session = true;
          } else {
            new_session_after_old = true;
          }
        }
      } else {
        new_session = true;
      }
    }

    if (new_session_after_old) {
      this.setOnlineSessionToFree(
        () => {
          this.createNewSession(form);
        }
      );
    }

    if (new_session) {
      this.createNewSession(form);
    } else if (continue_session) {
      this.subscrmanager.add(this.api.fetchAnnotation(this.sessionService.data_id).catch((error) => {
        alert('Server cannot be requested. Please check if you are online.');
        return Observable.throw(error);
      }).subscribe(
        (result) => {
          const json = result.json();

          if (json.hasOwnProperty('message')) {
            const counter = (json.message === '') ? '0' : json.message;
            this.sessionService.sessStr.store('jobs_left', Number(counter));
          }

          if (form.valid && this.agreement_checked
            && json.message !== '0'
          ) {
            if (this.sessionService.sessionfile !== null) {
              // last was offline mode
              this.sessionService.clearLocalStorage();
            }
            const res = this.sessionService.setSessionData(this.member, json.data.id, json.data.url);
            if (res.error === '') {
              this.navigate();
            } else {
              alert(res.error);
            }
          } else {
            this.modService.show('login_invalid');
          }
        }
      ));
    }
  }

  onOfflineSubmit = (form: NgForm) => {
    if (!isNullOrUndefined(this.sessionService.data_id) && isNumber(this.sessionService.data_id)) {
      // last was online mode
      this.setOnlineSessionToFree(() => {
        this.sessionService.beginLocalSession(this.dropzone, false, this.navigate, (error) => {
          alert(error);
        });
      });
    } else {
      if (!isNullOrUndefined(this.oannotation)) {
        this.sessionService.annotation = this.oannotation;
      }
      this.sessionService.beginLocalSession(this.dropzone, true, this.navigate, (error) => {
        alert(error);
      });
    }
  }

  canDeactivate(): Observable<boolean> | boolean {
    return (this.valid);
  }

  private navigate = (): void => {
    this.router.navigate(['user'], {
      queryParams: {
        login: true
      }
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize($event) {
    if (this.settingsService.responsive.enabled === false) {
      this.valid_size = window.innerWidth >= this.settingsService.responsive.fixedwidth;
    } else {
      this.valid_size = true;
    }
  }

  getDropzoneFileString(file: File | SessionFile) {
    const fsize: FileSize = Functions.getFileSize(file.size);
    return Functions.buildStr('{0} ({1} {2})', [file.name, (Math.round(fsize.size * 100) / 100), fsize.label]);
  }

  newTranscription = () => {
    this.sessionService.beginLocalSession(this.dropzone, false, this.navigate,
      (error) => {
        if (error === 'file not supported') {
          this.modService.show('error', this.langService.instant('reload-file.file not supported', {type: ''}));
        }
      }
    );
  }

  getFileStatus(): string {
    if (!isNullOrUndefined(this.files) && this.files.length > 0 &&
      (this.files[0].file.type === 'audio/wav' || this.files[0].file.type === 'audio/x-wav')
    ) {
      // check conditions
      if (isNullOrUndefined(this.sessionService.sessionfile) || this.files[0].file.name === this.sessionService.sessionfile.name) {
        return 'start';
      } else {
        return 'start';
      }
    }

    return 'unknown';
  }

  getValidBrowsers(): string {
    let result = '';

    for (let i = 0; i < this.apc.octra.allowed_browsers.length; i++) {
      const browser = this.apc.octra.allowed_browsers[i];
      result += browser.name + '(' + browser.version + ')';
    }

    return result;
  }

  loadPojectsList() {
    this.subscrmanager.add(this.api.getProjects().subscribe(
      ((result) => {
        const json = result.json();
        if (isArray(json.data)) {
          this.projects = json.data;
          if (!isNullOrUndefined(this.sessionService.member_project) && this.sessionService.member_project !== '') {
            if (isNullOrUndefined(this.projects.find(
                (x) => {
                  return x === this.sessionService.member_project;
                }))) {
              // make sure that old project is in list
              this.projects.push(this.sessionService.member_project);
            }
          }
        }
      })
    ));
  }

  public selectProject(event: HTMLSelectElement) {
    this.member.project = event.value;
  }

  private createNewSession(form: NgForm) {
    this.subscrmanager.add(this.api.beginSession(this.member.project, this.member.id, Number(this.member.jobno)).catch((error) => {
      alert('Server cannot be requested. Please check if you are online.');
      return Observable.throw(error);
    }).subscribe(
      (result) => {
        const json = result.json();
        if (form.valid && this.agreement_checked
          && json.message !== '0'
        ) {

          // delete old data for fresh new session
          this.sessionService.clearSession();
          this.sessionService.clearLocalStorage();

          const res = this.sessionService.setSessionData(this.member, json.data.id, json.data.url);

          if (json.hasOwnProperty('message')) {
            const counter = (json.message === '') ? '0' : json.message;
            this.sessionService.sessStr.store('jobs_left', Number(counter));
          }

          if (res.error === '') {
            this.navigate();
          } else {
            alert(res.error);
          }
        } else {
          this.modService.show('login_invalid');
        }
      }
    ));
  }

  private setOnlineSessionToFree = (callback: () => void) => {
    // check if old annotation is already annotated
    this.subscrmanager.add(this.api.fetchAnnotation(this.sessionService.data_id).subscribe(
      (result) => {
        const json = result.json();

        if (json.data.hasOwnProperty('status') && json.data.status === 'BUSY') {
          this.subscrmanager.add(this.api.closeSession(this.sessionService.member_id, this.sessionService.data_id, '').subscribe(
            (result2) => {
              callback();
            }
          ));
        } else {
          callback();
        }
      },
      () => {
        // ignore error because this isn't important
        callback();
      }
    ));
  }

  public isValidImportData(file: { status: string, file: File, checked_converters: number }) {
    if (!isNullOrUndefined(this.oaudiofile)) {
      for (let i = 0; i < AppInfo.converters.length; i++) {
        const converter: Converter = AppInfo.converters[i].converter;
        if (Functions.contains(file.file.name, AppInfo.converters[i].appendix)) {
          if (converter.conversion.import) {

            const reader: FileReader = new FileReader();
            console.log('..read');

            reader.onloadend = () => {
              if (file.status === 'progress') {
                console.log('read ok');
                console.log(reader);
                const ofile = {
                  name: file.file.name,
                  content: reader.result,
                  type: file.file.type,
                  encoding: 'utf-8'
                };
                console.log(ofile);

                const test: OAnnotation = converter.import(ofile, this.oaudiofile);
                file.checked_converters++;
                if (!isNullOrUndefined(test)) {
                  file.status = 'valid';
                  this.oannotation = test;
                } else if (file.checked_converters === AppInfo.converters.length) {
                  // last converter to check
                  file.status = 'invalid';
                  this.oannotation = null;
                }

              }
            };

            reader.readAsText(file.file, 'utf-8');
          } else {
            file.checked_converters++;
          }
        } else {
          file.checked_converters++;
        }
      }
      if (file.checked_converters === AppInfo.converters.length
        && file.status === 'progress'
      ) {
        file.status = 'invalid';
      }
    } else {
      file.status = 'valid';
    }
  }

  public testFile(converter: Converter, file: File) {
    const reader: FileReader = new FileReader();
    reader.onload = function (e) {
      // e.target.result should contain the text
    };
    reader.readAsText(file);
    reader.readAsText(file, 'utf-8');
  }

  public afterDrop() {
    this.files = [];
    for (let i = 0; i < this.dropzone.files.length; i++) {
      const file = {
        status: 'progress',
        file: this.dropzone.files[i],
        checked_converters: 0
      };

      if (Functions.contains(file.file.name, '.wav')) {
        file.status = 'valid';
        const reader = new FileReader();

        console.log('read audio temp');
        reader.onloadend = () => {
          console.log(reader.result);

          // check audio
          const info: AudioInfo = new AudioInfo(reader.result);
          info.decodeAudio(reader.result).then(() => {
            this.oaudiofile = new OAudiofile();
            this.oaudiofile.name = file.file.name;
            this.oaudiofile.size = file.file.size;
            this.oaudiofile.duration = info.duration;
            this.oaudiofile.samplerate = info.samplerate;

            // load import data
            console.log('check now other import');
            for (let j = 0; j < this.dropzone.files.length; j++) {
              const importfile = this.dropzone.files[j];
              if (!Functions.contains(importfile.name, '.wav')) {
                console.log('ok no audio');
                const newfile = {
                  status: 'progress',
                  file: this.dropzone.files[j],
                  checked_converters: 0
                };
                this.files.push(newfile);
                this.isValidImportData(newfile);
              }
            }
          });
        };

        reader.readAsArrayBuffer(file.file);
        this.files.push(file);
        break;
      }
    }
  }
}
