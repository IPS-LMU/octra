import {AfterViewInit, ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit, ViewChild} from '@angular/core';
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

  public valid_platform = false;
  public valid_size = false;
  public browser_check: BrowserCheck;
  public agreement_checked = true;

  public projects: string[] = [];

  private subscrmanager: SubscriptionManager;

  get sessionfile(): SessionFile {
    return this.sessionService.sessionfile;
  }

  get apc(): any {
    return this.settingsService.app_settings;
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
              private modService: ModalService) {
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

    if (this.sessionService.sessionfile != null) {
      // last was offline mode, begin new Session
      console.log('last offline');
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
            console.log('same');
            continue_session = true;
          } else {
            new_session_after_old = true;
          }
        }
      } else {
        console.log('before false');
        new_session = true;
      }
    }

    if (new_session_after_old) {
      console.log('new session after old');
      // check if old annotation is already annotated
      this.subscrmanager.add(this.api.fetchAnnotation(this.sessionService.data_id).subscribe(
        (result) => {
          const json = result.json();
          console.log('anno fetched');
          console.log(json);

          if (json.data.hasOwnProperty('status') && json.data.status === 'BUSY') {
            console.log('is busy');
            this.subscrmanager.add(this.api.closeSession(this.sessionService.member_id, this.sessionService.data_id, '').subscribe(
              (result2) => {
                console.log('BUSY to FREE');
                console.log(result2.json());
                this.createNewSession(form);
              }
            ));
          } else {
            console.log('not busy');
            this.createNewSession(form);
          }
        }
      ));
    }

    if (new_session) {
      this.createNewSession(form);
    } else if (continue_session) {
      console.log('OLD SESSION');
      this.subscrmanager.add(this.api.fetchAnnotation(this.sessionService.data_id).catch((error) => {
        alert('Server cannot be requested. Please check if you are online.');
        return Observable.throw(error);
      }).subscribe(
        (result) => {
          const json = result.json();
          console.log('Result');
          console.log(json);

          if (json.hasOwnProperty('message')) {
            let counter = (json.message === '') ? '0' : json.message;
            console.log('set jobs left to : ' + counter);
            this.sessionService.sessStr.store('jobs_left', Number(counter));
            console.log(this.sessionService.jobs_left);
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

    const type: string = (this.dropzone.file.type) ? this.dropzone.file.type : 'unknown';

    if (this.dropzone.file != null && type === 'audio/x-wav' || type === 'audio/wav') {

      if (this.sessionService.member_id != null || this.sessionService.member_id === '') {
        // last was online mode
        this.sessionService.logs = null;
        this.sessionService.transcription = null;
        this.sessionService.data_id = null;
      }
      const res = this.sessionService.setSessionData(null, 0, null, true);
      if (res.error === '') {
        this.sessionService.offline = true;
        this.sessionService.sessionfile = new SessionFile(
          this.dropzone.file.name,
          this.dropzone.file.size,
          this.dropzone.file.lastModifiedDate,
          this.dropzone.file.type
        );

        this.sessionService.file = this.dropzone.file;
        this.navigate();
      } else {
        alert(res.error);
      }
    } else {
      alert('Die Datei ist vom Typ ' + type + ' und wird nicht unterstützt.');
    }
  }

  canDeactivate(): Observable<boolean> | boolean {
    return (this.valid);
  }

  private navigate() {
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

  openAgreement() {
    this.agreement.open();
  }

  getDropzoneFileString(file: File | SessionFile) {
    const fsize: FileSize = Functions.getFileSize(file.size);
    return Functions.buildStr('{0} ({1} {2})', [file.name, (Math.round(fsize.size * 100) / 100), fsize.label]);
  }

  newTranscription = () => {
    if (this.dropzone.file != null) {
      this.sessionService.clearSession();
      this.sessionService.clearLocalStorage();
      this.sessionService.setSessionData(null, 0, '');
      this.sessionService.sessionfile = this.getSessionFile(this.dropzone.file);
      this.sessionService.file = this.dropzone.file;
      this.sessionService.offline = true;
      this.navigate();
    }
  }

  getSessionFile(file: File) {
    return new SessionFile(
      file.name,
      file.size,
      file.lastModifiedDate,
      file.type
    );
  }

  getFileStatus(): string {
    if (!isNullOrUndefined(this.dropzone.file) &&
      (this.dropzone.file.type === 'audio/wav' || this.dropzone.file.type === 'audio/x-wav')
    ) {
      // check conditions
      if (this.sessionService.sessionfile == null || this.dropzone.file.name === this.sessionService.sessionfile.name) {
        return 'start';
      } else {
        return 'new';
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
    console.log('NEW SESSION');
    this.subscrmanager.add(this.api.beginSession(this.member.project, this.member.id, Number(this.member.jobno)).catch((error) => {
      alert('Server cannot be requested. Please check if you are online.');
      return Observable.throw(error);
    }).subscribe(
      (result) => {
        const json = result.json();
        if (form.valid && this.agreement_checked
          && json.message !== '0'
        ) {
          console.log('Result');
          console.log(json);
          if (this.sessionService.sessionfile != null) {
            // last was offline mode
            this.sessionService.clearLocalStorage();
          }
          const res = this.sessionService.setSessionData(this.member, json.data.id, json.data.url);

          if (json.hasOwnProperty('message')) {
            let counter = (json.message === '') ? '0' : json.message;
            console.log('set jobs left to : ' + counter);
            this.sessionService.sessStr.store('jobs_left', Number(counter));
            console.log(this.sessionService.jobs_left);
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
}
