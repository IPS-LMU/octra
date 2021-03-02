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
import {NgForm} from '@angular/forms';
import {Router} from '@angular/router';
import {TranslocoService} from '@ngneat/transloco';
import {sha256} from 'js-sha256';
import {FileSize, getFileSize, hasPropertyTree, isUnset, navigateTo, SubscriptionManager} from '@octra/utilities';
import {Observable} from 'rxjs';
import {AppInfo} from '../../../app.info';
import {ModalService} from '../../modals/modal.service';
import {ModalDeleteAnswer} from '../../modals/transcription-delete-modal/transcription-delete-modal.component';
import {IDataEntry, parseServerDataEntry} from '../../obj/data-entry';
import {SessionFile} from '../../obj/SessionFile';
import {APIService, AudioService, SettingsService} from '../../shared/service';
import {AppStorageService} from '../../shared/service/appstorage.service';
import {OctraDropzoneComponent} from '../../component/octra-dropzone/octra-dropzone.component';
import {ComponentCanDeactivate} from './login.deactivateguard';
import {LoginService} from './login.service';
import {LoginMode} from '../../store';
import * as fromApplication from '../../store/application/';
import {Store} from '@ngrx/store';
import {OIDBLevel, OIDBLink} from '@octra/annotation';
import {Actions} from '@ngrx/effects';

@Component({
  selector: 'octra-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  providers: [LoginService]
})
export class LoginComponent implements OnInit, OnDestroy, ComponentCanDeactivate, AfterViewInit {

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
  public apiStatus: 'init' | 'available' | 'unavailable' = 'init';
  private subscrmanager: SubscriptionManager;

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
              private audioService: AudioService,
              private store: Store,
              private actions: Actions) {
    this.subscrmanager = new SubscriptionManager();
  }

  onOfflineSubmit = () => {
    if (this.appStorage.useMode !== LoginMode.DEMO && !isUnset(this.appStorage.dataID) && typeof this.appStorage.dataID === 'number') {
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
    if (!(this.dropzone.oannotation === null || this.dropzone.oannotation === undefined)) {
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
        this.modService.show('error', {
          text: this.langService.translate('reload-file.file not supported', {type: ''})
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
        if (!isUnset(this.appStorage.onlineSession)) {
          if (this.appStorage.onlineSession.loginData.id !== '-1') {
            this.member.id = this.appStorage.onlineSession.loginData.id;
          }

          this.member.project = this.appStorage.onlineSession.loginData.project;

          if (this.appStorage.onlineSession.loginData.jobNumber !== null && this.appStorage.onlineSession.loginData.jobNumber > -1) {
            this.member.jobno = this.appStorage.onlineSession.loginData.jobNumber.toString();
          }
        }
      } else {
        this.appStorage.clearOnlineSession();
        this.appStorage.clearAnnotationPermanently();
      }
    };

    if (!this.appStorage.idbLoaded) {
      this.subscrmanager.add(this.appStorage.loaded.subscribe(
        () => {
        },
        () => {
        },
        () => {
          loaduser();
        })
      );
    } else {
      loaduser();
    }

    this.subscrmanager.add(this.store.select(fromApplication.selectIDBLoaded).subscribe((idbLoaded) => {
      if (idbLoaded) {
        this.loadPojectsList();
      }
    }));
  }

  ngAfterViewInit() {
  }

  ngOnDestroy() {
    this.subscrmanager.destroy();
  }

  onOnlineSubmit(form: NgForm) {
    let newSession = false;
    let newSessionAfterOld = false;
    let continueSession = false;

    if (!this.isPasswordCorrect(this.member.project, this.member.password)) {
      this.modService.show('loginInvalid').catch((error) => {
        console.error(error);
      });
    } else {

      if ((this.member.jobno === null || this.member.jobno === undefined) || this.member.jobno === '') {
        this.member.jobno = '0';
      }

      if (this.appStorage.sessionfile !== null) {
        // last was offline mode, begin new Session
        newSession = true;

      } else {
        if (!(this.appStorage.dataID === null || this.appStorage.dataID === undefined) && typeof this.appStorage.dataID === 'number') {
          // last session was online session
          // check if credentials are available
          if (
            !isUnset(this.appStorage.onlineSession.loginData.project) && !isUnset(this.appStorage.onlineSession.loginData.jobNumber) &&
            !isUnset(this.appStorage.onlineSession.loginData.id)
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
          if (isUnset(json.data)) {
            // job doesn't exist anymore
            this.createNewOnlineSession(form);
          } else {
            // continue job
            const data = json.data as IDataEntry;
            let jobsLeft = -1;
            if (json.hasOwnProperty('message')) {
              const counter = (json.message === '') ? '0' : json.message;
              jobsLeft = Number(counter);
            }

            if (form.valid && json.message !== '0') {
              const p = new Promise<void>((resolve) => {
                if (this.appStorage.sessionfile !== null) {
                  // last was offline mode
                  this.appStorage.clearLocalSession();
                } else {
                  resolve();
                }
              }).then(() => {
                let prompt = '';
                let serverComment = '';
                if (this.appStorage.useMode === LoginMode.ONLINE
                  && data.hasOwnProperty('prompttext')) {
                  // get transcript data that already exists
                  prompt = data.prompttext;
                  prompt = (prompt) ? prompt : '';
                }
                if (this.appStorage.useMode === LoginMode.ONLINE
                  && data.hasOwnProperty('comment')) {
                  // get transcript data that already exists
                  serverComment = data.comment;
                  serverComment = (serverComment) ? serverComment : '';
                }

                this.appStorage.setOnlineSession(this.member, this.appStorage.dataID, this.appStorage.audioURL, prompt, serverComment, jobsLeft)

                this.navigate();
              });
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
    if (!isUnset(file)) {
      const fsize: FileSize = getFileSize(file.size);
      return `${file.name} (${(Math.round(fsize.size * 100) / 100)} ${fsize.label})`;
    }
  }

  getFileStatus(): string {
    if (!(this.dropzone.files === null || this.dropzone.files === undefined) && this.dropzone.files.length > 0 &&
      (!(this.dropzone.oaudiofile === null || this.dropzone.oaudiofile === undefined))) {
      // check conditions
      if ((this.appStorage.sessionfile === null || this.appStorage.sessionfile === undefined)
        || (this.dropzone.oaudiofile.name === this.appStorage.sessionfile.name)
        && (this.dropzone.oannotation === null || this.dropzone.oannotation === undefined)) {
        return 'start';
      } else {
        return 'new';
      }
    }

    return 'unknown';
  }

  loadPojectsList() {
    this.api.getProjects().then((json) => {
      if (Array.isArray(json.data)) {
        this.projects = json.data;

        if (!(this.settingsService.appSettings.octra.allowed_projects === null ||
          this.settingsService.appSettings.octra.allowed_projects === undefined)
          && this.settingsService.appSettings.octra.allowed_projects.length > 0) {
          // filter disabled projects
          this.projects = this.projects.filter((a) => {
            return (this.settingsService.appSettings.octra.allowed_projects.findIndex((b) => {
              return a === b.name;
            }) > -1);
          });
        }
        if (!isUnset(this.appStorage.onlineSession) &&
          !isUnset(this.appStorage.onlineSession.loginData.project) && this.appStorage.onlineSession.loginData.project !== '') {

          const found = this.projects.find(
            (x) => {
              return x === this.appStorage.onlineSession.loginData.project;
            });
          if (isUnset(found)) {
            // make sure that old project is in list
            this.projects.push(this.appStorage.onlineSession.loginData.project);
          }
        }
      }

      this.apiStatus = 'available';
    }).catch((error) => {
      console.error(`ERROR: could not load list of projects:\n${error}`);
      this.apiStatus = 'unavailable';
    });
  }

  onTranscriptionDelete() {
    this.modService.show('transcriptionDelete').then((answer: ModalDeleteAnswer) => {
      if (answer === ModalDeleteAnswer.DELETE) {
        this.newTranscription();
      }
    }).catch((error) => {
      console.error(error);
    });
  }

  public startDemo() {
    const audioExample = this.settingsService.getAudioExample(this.langService.getActiveLang());

    if (!isUnset(audioExample)) {
      this.member.id = 'demo_user';
      this.member.project = 'DemoProject';
      this.member.jobno = '123';

      // delete old data for fresh new session
      this.appStorage.clearOnlineSession();
      this.appStorage.clearLocalSession();
      this.appStorage.setDemoSession(audioExample.url, audioExample.description, 1000);
      this.navigate();
    }
  }

  public isPasswordCorrect(selectedProject, password) {
    if (!isUnset(this.settingsService.appSettings.octra.allowed_projects)) {
      const inputHash = sha256(password).toUpperCase();
      const projectData = this.settingsService.appSettings.octra.allowed_projects.find((a) => {
        return a.name === selectedProject;
      });

      if (!isUnset(projectData)) {
        if (projectData.hasOwnProperty('password') && projectData.password !== '') {
          return projectData.password.toUpperCase() === inputHash;
        }
      }
    }

    return true;
  }

  passwordExists() {
    if (!isUnset(this.settingsService.appSettings.octra.allowed_projects)) {
      const projectData = this.settingsService.appSettings.octra.allowed_projects.find((a) => {
        return a.name === this.member.project;
      });

      return (!isUnset(projectData) && projectData.hasOwnProperty('password')) && projectData.password !== '';
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
        this.appStorage.clearOnlineSession();
        this.appStorage.clearLocalSession();
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
        if (json.hasOwnProperty('message')) {
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

        this.appStorage.setOnlineSession(this.member, data.id, data.url, prompt, serverComment, jobsLeft);
        this.navigate();
      } else {
        this.modService.show('loginInvalid').catch((error) => {
          console.error(error);
        });
      }
    }).catch((error) => {
      alert('Server cannot be requested. Please check if you are online.');
      console.error(error);
    });
  }
}
