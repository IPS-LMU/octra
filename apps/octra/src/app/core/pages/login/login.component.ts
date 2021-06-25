import {ChangeDetectorRef, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {NgForm} from '@angular/forms';
import {Router} from '@angular/router';
import {TranslocoService} from '@ngneat/transloco';
import {
  BrowserInfo,
  FileSize,
  getFileSize,
  hasProperty,
  hasPropertyTree,
  navigateTo,
  SubscriptionManager
} from '@octra/utilities';
import {AppInfo} from '../../../app.info';
import {ModalService} from '../../modals/modal.service';
import {
  ModalDeleteAnswer,
  TranscriptionDeleteModalComponent
} from '../../modals/transcription-delete-modal/transcription-delete-modal.component';
import {IDataEntry, parseServerDataEntry} from '../../obj/data-entry';
import {SessionFile} from '../../obj/SessionFile';
import {APIService, AudioService, SettingsService} from '../../shared/service';
import {AppStorageService} from '../../shared/service/appstorage.service';
import {OctraDropzoneComponent} from '../../component/octra-dropzone/octra-dropzone.component';
import {ComponentCanDeactivate} from './login.deactivateguard';
import {LoginService} from './login.service';
import {LoginMode} from '../../store';
import {OIDBLevel, OIDBLink} from '@octra/annotation';
import {Observable, Subscription} from 'rxjs';
import {ErrorModalComponent} from '../../modals/error-modal/error-modal.component';
import {modalConfigurations} from '../../modals/types';
import {LoginInvalidModalComponent} from '../../modals/login-invalid-modal/login-invalid-modal.component';

@Component({
  selector: 'octra-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  providers: [LoginService]
})
export class LoginComponent implements OnInit, OnDestroy, ComponentCanDeactivate, OnDestroy {
  @ViewChild('f', {static: false}) loginform: NgForm;
  @ViewChild('dropzone', {static: true}) dropzone: OctraDropzoneComponent;
  @ViewChild('agreement', {static: false}) agreement: ElementRef;
  @ViewChild('localmode', {static: true}) localmode: ElementRef;
  @ViewChild('onlinemode', {static: true}) onlinemode: ElementRef;
  public validSize = false;
  public projects: string[] = [];
  valid = false;
  member = {
    id: '',
    project: '',
    jobno: '',
    password: ''
  };
  err = '';
  public apiStatus: 'init' | 'available' | 'unavailable' = 'available';
  private subscrmanager: SubscriptionManager<Subscription>;

  get sessionfile(): SessionFile {
    return this.appStorage.sessionfile;
  }

  get apc(): any {
    return this.settingsService.appSettings;
  }

  public get Math(): Math {
    return Math;
  }

  constructor(private router: Router,
              public appStorage: AppStorageService,
              private api: APIService,
              private cd: ChangeDetectorRef,
              public settingsService: SettingsService,
              public modService: ModalService,
              private langService: TranslocoService,
              private audioService: AudioService) {
    this.subscrmanager = new SubscriptionManager<Subscription>();
    console.log(BrowserInfo.platform + ' ' + BrowserInfo.browser);
  }

  ngOnDestroy() {
    this.subscrmanager.destroy();
  }

  onOfflineSubmit = () => {
    if (this.appStorage.useMode !== LoginMode.DEMO && this.appStorage.dataID !== undefined && typeof this.appStorage.dataID === 'number') {
      // last was online mode
      this.api.setOnlineSessionToFree(this.appStorage).then(() => {
        this.audioService.registerAudioManager(this.dropzone.audioManager);
        this.appStorage.beginLocalSession(this.dropzone.files, false).then(this.beforeNavigation).catch((error) => {
          alert(error);
        });
      }).catch((error) => {
        console.error(error);
      });
    } else {
      this.audioService.registerAudioManager(this.dropzone.audioManager);
      this.appStorage.beginLocalSession(this.dropzone.files, true).then(this.beforeNavigation).catch((error) => {
        alert(error);
      });
    }
  }

  private beforeNavigation = () => {
    if (!(this.dropzone.oannotation === undefined)) {
      const newLevels: OIDBLevel[] = [];
      for (let i = 0; i < this.dropzone.oannotation.levels.length; i++) {
        newLevels.push(new OIDBLevel(i + 1, this.dropzone.oannotation.levels[i], i));
      }

      const newLinks: OIDBLink[] = [];
      for (let i = 0; i < this.dropzone.oannotation.links.length; i++) {
        newLinks.push(new OIDBLink(i + 1, this.dropzone.oannotation.links[i]));
      }

      this.appStorage.overwriteAnnotation(newLevels, newLinks);
      this.navigate();

    } else {
      this.navigate();
    }
  }

  newTranscription = () => {
    this.audioService.registerAudioManager(this.dropzone.audioManager);

    this.appStorage.clearAnnotationPermanently();
    this.appStorage.clearLoggingDataPermanently();
    this.appStorage.beginLocalSession(this.dropzone.files, false).then(this.beforeNavigation).catch((error) => {
      if (error === 'file not supported') {
        this.modService.openModal(ErrorModalComponent, {
          ...modalConfigurations.error,
          data: {
            text: this.langService.translate('reload-file.file not supported', {type: ''})
          }
        }).catch((error2) => {
          console.error(error2);
        });
      }
    });
  }

  ngOnInit() {
    if (this.settingsService.responsive.enabled === false) {
      this.validSize = window.innerWidth >= this.settingsService.responsive.fixedwidth;
    } else {
      this.validSize = true;
    }

    const loaduser = () => {
      if (this.appStorage.useMode !== LoginMode.DEMO) {
        const loginData = this.appStorage.snapshot?.onlineMode?.onlineSession?.loginData;
        if (loginData !== undefined) {
          if (loginData?.id !== '-1') {
            this.member.id = loginData.id;
          }

          this.member.project = loginData.project;

          if (loginData.jobNumber !== undefined && loginData.jobNumber > -1) {
            this.member.jobno = loginData.jobNumber.toString();
          }
        }
      } else {
        this.appStorage.clearWholeSession();
      }
    }

    if (!this.appStorage.idbLoaded) {
      this.subscrmanager.add(this.appStorage.loaded.subscribe(
        undefined,
        undefined,
        () => {
          loaduser();
        })
      );
    } else {
      loaduser();
    }
  }

  onOnlineSubmit(form: NgForm) {
    /*
    let newSession = false;
    let newSessionAfterOld = false;
    let continueSession = false;
    if (!this.isPasswordCorrect(this.member.project, this.member.password)) {
      this.modService.show('loginInvalid').catch((error) => {
        console.error(error);
      });
    } else {

      if ((this.member.jobno === undefined) || this.member.jobno === '') {
        this.member.jobno = '0';
      }

      if (this.appStorage.sessionfile !== undefined) {
        // last was offline mode, begin new Session
        newSession = true;

      } else {
        if (!(this.appStorage.dataID === undefined) && typeof this.appStorage.dataID === 'number') {
          // last session was online session
          // check if credentials are available
          if (
            this.appStorage.onlineSession.loginData.project !== undefined && this.appStorage.onlineSession.loginData.jobNumber !== undefined &&
            this.appStorage.onlineSession.loginData.id !== undefined
          ) {
            // check if credentials are the same like before
            if (
              this.appStorage.onlineSession.loginData.id === this.member.id &&
              Number(this.appStorage.onlineSession.loginData.jobNumber) === Number(this.member.jobno) &&
              this.appStorage.onlineSession.loginData.project === this.member.project
            ) {
              continueSession = true;
            } else {
              newSessionAfterOld = true;
            }
          }
        } else {
          newSession = true;
        }
      }
      if (newSessionAfterOld) {
        this.api.setOnlineSessionToFree(this.appStorage).then(() => {
          this.createNewOnlineSession(form);
        }).catch((error) => {
          console.error(error);
        });
      }

      if (newSession) {
        this.createNewOnlineSession(form);
      } else if (continueSession) {
        this.api.fetchAnnotation(this.appStorage.dataID).then((json) => {
          if (json.data === undefined) {
            // job doesn't exist anymore
            this.createNewOnlineSession(form);
          } else {
            // continue job
            const data = json.data as IDataEntry;
            let jobsLeft = -1;
            if (hasProperty(json, 'message')) {
              const counter = (json.message === '') ? '0' : json.message;
              jobsLeft = Number(counter);
            }

            if (form.valid && json.message !== '0') {
              let prompt = '';
              let serverComment = '';
              if (this.appStorage.useMode === LoginMode.ONLINE
                && hasProperty(data, 'prompttext')) {
                // get transcript data that already exists
                prompt = data.prompttext;
                prompt = (prompt) ? prompt : '';
              }
              if (this.appStorage.useMode === LoginMode.ONLINE
                && hasProperty(data, 'comment')) {
                // get transcript data that already exists
                serverComment = data.comment;
                serverComment = (serverComment) ? serverComment : '';
              }

              this.appStorage.setOnlineSession(
                this.member, this.appStorage.dataID, this.appStorage.audioURL, prompt, serverComment, jobsLeft, false
              )

              this.navigate();
            } else {
              this.modService.show('loginInvalid').catch((error) => {
                console.error(error);
              });
            }
          }
        }).catch((error) => {
          this.modService.show('error', {
            text: 'Server cannot be requested. Please check if you are online.'
          }).catch((error2) => {
            console.error(error2);
          });
          console.error(error);
        });
      }
    }
    */
  }

  canDeactivate(): Observable<boolean> | boolean {
    return (this.valid);
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    if (this.settingsService.responsive.enabled === false) {
      this.validSize = window.innerWidth >= this.settingsService.responsive.fixedwidth;
    } else {
      this.validSize = true;
    }
  }

  getDropzoneFileString(file: File | SessionFile) {
    if (file !== undefined) {
      const fsize: FileSize = getFileSize(file.size);
      return `${file.name} (${(Math.round(fsize.size * 100) / 100)} ${fsize.label})`;
    }
    return '';
  }

  getFileStatus(): string {
    if (!(this.dropzone.files === undefined) && this.dropzone.files.length > 0 && !(this.dropzone.oaudiofile === undefined)) {
      // check conditions
      if ((this.appStorage.sessionfile === undefined) || (this.dropzone.oaudiofile.name === this.appStorage.sessionfile.name) && (this.dropzone.oannotation === undefined)) {
        return 'start';
      } else {
        return 'new';
      }
    }

    return 'unknown';
  }

  onTranscriptionDelete() {
    this.modService.openModal(TranscriptionDeleteModalComponent, modalConfigurations.transcriptionDelete).then((answer: ModalDeleteAnswer) => {
      if (answer === ModalDeleteAnswer.DELETE) {
        this.newTranscription();
      }
    }).catch((error) => {
      console.error(error);
    });
  }

  public startDemo() {
    const audioExample = this.settingsService.getAudioExample(this.langService.getActiveLang());

    if (audioExample !== undefined) {
      this.member.id = 'demo_user';
      this.member.project = 'DemoProject';
      this.member.jobno = '123';

      // delete old data for fresh new session
      this.appStorage.setDemoSession(audioExample.url, audioExample.description, 1000);
      this.navigate();
    }
  }

  public isPasswordCorrect(selectedProject, password) {
    /*
    if (this.settingsService.appSettings.octra.allowed_projects !== undefined) {
      const inputHash = sha256(password).toUpperCase();
      const projectData = this.settingsService.appSettings.octra.allowed_projects.find((a) => {
        return a.name === selectedProject;
      });

      if (projectData !== undefined) {
        if (hasProperty(projectData, 'password') && projectData.password !== '') {
          return projectData.password.toUpperCase() === inputHash;
        }
      }
    }

    return true;

     */
  }

  passwordExists() {
    if (this.settingsService.appSettings.octra.allowed_projects !== undefined) {
      const projectData = this.settingsService.appSettings.octra.allowed_projects.find((a) => {
        return a.name === this.member.project;
      });

      return (projectData !== undefined && hasProperty(projectData, 'password')) && projectData.password !== '';
    }

    return false;
  }

  private navigate = (): void => {
    navigateTo(this.router, ['user'], AppInfo.queryParamsHandling).catch((error) => {
      console.error(error);
    });
  }

  private createNewOnlineSession(form: NgForm) {
    this.api.beginSession(this.member.project, this.member.id, Number(this.member.jobno)).then((json) => {
      const data = json.data as IDataEntry;
      if (form.valid && json.message !== '0') {
        // delete old data for fresh new session
        this.appStorage.clearAnnotationPermanently();

        let prompt = '';
        let serverComment = '';
        let jobsLeft = -1;

        // get transcript data that already exists
        const jsonStr = JSON.stringify(data);
        let serverDataEntry = parseServerDataEntry(jsonStr);

        if (hasPropertyTree(serverDataEntry, 'prompttext')) {
          // get transcript data that already exists
          prompt = serverDataEntry.prompttext;
          prompt = (prompt) ? prompt : '';
        }
        if (hasPropertyTree(serverDataEntry, 'comment')) {
          // get transcript data that already exists
          serverComment = serverDataEntry.comment;
          serverComment = (serverComment) ? serverComment : '';
        }
        if (hasProperty(json, 'message')) {
          const counter = (json.message === '') ? '0' : json.message;
          jobsLeft = Number(counter);
        }

        if (!hasPropertyTree(serverDataEntry, 'transcript') ||
          !Array.isArray(serverDataEntry.transcript)) {
          serverDataEntry = {
            ...serverDataEntry,
            transcript: []
          };
        }

        if (!hasPropertyTree(serverDataEntry, 'logtext') ||
          !Array.isArray(this.appStorage.serverDataEntry.logtext)) {
          serverDataEntry = {
            ...serverDataEntry,
            logtext: []
          };
        }
        // beware, this.appStorage.serverDataEntry is aync!
        this.appStorage.serverDataEntry = serverDataEntry;

        this.appStorage.setOnlineSession(this.member, data.id, data.url, prompt, serverComment, jobsLeft, true);
        this.navigate();
      } else {
        this.modService.openModal(LoginInvalidModalComponent, {}).catch((error) => {
          console.error(error);
        });
      }
    }).catch((error) => {
      alert('Server cannot be requested. Please check if you are online.');
      console.error(error);
    });
  }
}
