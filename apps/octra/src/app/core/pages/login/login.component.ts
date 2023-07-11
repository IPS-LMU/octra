import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
} from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslocoService } from '@ngneat/transloco';
import { BrowserInfo, FileSize, getFileSize } from '@octra/utilities';
import { navigateTo } from '@octra/ngx-utilities';
import { AppInfo } from '../../../app.info';
import { OctraModalService } from '../../modals/octra-modal.service';
import {
  ModalDeleteAnswer,
  TranscriptionDeleteModalComponent,
} from '../../modals/transcription-delete-modal/transcription-delete-modal.component';
import { SessionFile } from '../../obj/SessionFile';
import { AudioService, SettingsService } from '../../shared/service';
import { AppStorageService } from '../../shared/service/appstorage.service';
import { OctraDropzoneComponent } from '../../component/octra-dropzone/octra-dropzone.component';
import { ComponentCanDeactivate } from './login.deactivateguard';
import { LoginService } from './login.service';
import { LoginMode } from '../../store';
import { OIDBLevel, OIDBLink } from '@octra/annotation';
import { Observable } from 'rxjs';
import { ErrorModalComponent } from '../../modals/error-modal/error-modal.component';
import { DefaultComponent } from '../../component/default.component';
import { AuthenticationStoreService } from '../../store/authentication';
import { AccountLoginMethod } from '../../../../../../../../octra-backend/dist/libs/api-types';

@Component({
  selector: 'octra-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  providers: [LoginService],
})
export class LoginComponent
  extends DefaultComponent
  implements OnInit, ComponentCanDeactivate
{
  @ViewChild('f', { static: false }) loginform!: NgForm;
  @ViewChild('dropzone', { static: true }) dropzone!: OctraDropzoneComponent;
  @ViewChild('agreement', { static: false }) agreement!: ElementRef;
  @ViewChild('localmode', { static: true }) localmode!: ElementRef;
  @ViewChild('onlinemode', { static: true }) onlinemode!: ElementRef;

  state: {
    online: {
      apiStatus: 'init' | 'available' | 'unavailable';
      user: {
        nameOrEmail: string;
        password: string;
      };
      form: {
        valid: boolean;
        err: string;
      };
    };
    local: {
      validSize: boolean;
    };
  } = {
    online: {
      apiStatus: 'available',
      user: {
        nameOrEmail: '',
        password: '',
      },
      form: {
        valid: false,
        err: '',
      },
    },
    local: {
      validSize: false,
    },
  };

  get sessionfile(): SessionFile {
    return this.appStorage.sessionfile;
  }

  get apc(): any {
    return this.settingsService.appSettings;
  }

  public get Math(): Math {
    return Math;
  }

  constructor(
    private router: Router,
    public appStorage: AppStorageService,
    private cd: ChangeDetectorRef,
    public settingsService: SettingsService,
    public modService: OctraModalService,
    private langService: TranslocoService,
    private audioService: AudioService,
    private authStoreService: AuthenticationStoreService
  ) {
    super();
    console.log(BrowserInfo.platform + ' ' + BrowserInfo.browser);
  }

  onOfflineSubmit = () => {
    if (
      this.appStorage.useMode !== LoginMode.DEMO
    ) {
      // last was online mode
      /*
      this.api.setOnlineSessionToFree(this.appStorage).then(() => {
        this.audioService.registerAudioManager(this.dropzone.audioManager);
        this.appStorage.beginLocalSession(this.dropzone.files, false).then(this.beforeNavigation).catch((error) => {
          alert(error);
        });
      }).catch((error) => {
        console.error(error);
      });
      */
    } else {
      this.audioService.registerAudioManager(this.dropzone.audioManager!);
      this.appStorage
        .beginLocalSession(this.dropzone.files, true)
        .then(this.beforeNavigation)
        .catch((error) => {
          alert(error);
        });
    }
  };

  private beforeNavigation = () => {
    if (!(this.dropzone.oannotation === undefined)) {
      const newLevels: OIDBLevel[] = [];
      for (let i = 0; i < this.dropzone.oannotation.levels.length; i++) {
        newLevels.push(
          new OIDBLevel(i + 1, this.dropzone.oannotation.levels[i], i)
        );
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
  };

  newTranscription = () => {
    this.audioService.registerAudioManager(this.dropzone.audioManager!);

    this.appStorage.clearAnnotationPermanently();
    this.appStorage.clearLoggingDataPermanently();
    this.appStorage
      .beginLocalSession(this.dropzone.files, false)
      .then(this.beforeNavigation)
      .catch((error) => {
        if (error === 'file not supported') {
          this.modService
            .openModal(ErrorModalComponent, ErrorModalComponent.options, {
              text: this.langService.translate(
                'reload-file.file not supported',
                { type: '' }
              ),
            })
            .catch((error2) => {
              console.error(error2);
            });
        }
      });
  };

  ngOnInit() {
    if (this.settingsService.responsive.enabled === false) {
      this.state.local.validSize =
        window.innerWidth >= this.settingsService.responsive.fixedwidth;
    } else {
      this.state.local.validSize = true;
    }
  }

  onOnlineShibbolethSubmit(form: NgForm) {
    /* TODO
    this.api.loginUser('shibboleth').then((result) => {
      if (result.openWindowURL !== undefined) {
        // need to open windowURL
        console.log(`open window!`);
        const authWindow = window.open(result.openWindowURL, '_blank', `top:${(window.outerHeight - 400) / 2},width=600,height=400,titlebar=no,status=no,location=no`);
        if (authWindow) {
          authWindow.addEventListener('beforeunload', () => {
            console.log(`window closed`);
          });

          if (this.windowChecker !== undefined) {
            this.windowChecker.unsubscribe();
          }
          let closed = false;
          this.windowChecker = interval(1000).subscribe(() => {
            if (!closed && authWindow.closed) {
              this.windowChecker.unsubscribe();
              this.windowChecker = undefined;
              closed = true;

              // TODO api: get token, name, email from window
              /* TODO
              this.api.retrieveTokenFromWindow(result.openWindowURL as string).then((token) => {
                this.api.getCurrentUserInformation().then((user: UserInfoResponseDataItem) => {
                  this.appStorage.afterLoginOnlineSuccessful('shibboleth', {
                    name: user.username,
                    email: user.email,
                    roles: [],
                    webToken: token
                  });
                }).catch((error) => {
                  console.error(error);
                });
              }).catch((error) => {
                console.error(error);
              });

            }
          });
        }
      } else if (result.user) {
        console.log(`auth ok, continue...`);
      }
    }).catch((error) => {
      console.error(error);
    });
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

  onOnlineCredentialsSubmit() {
    this.authStoreService.loginOnline(
      AccountLoginMethod.local,
      this.state.online.user.nameOrEmail,
      this.state.online.user.password
    );
  }

  canDeactivate(): Observable<boolean> | boolean {
    return this.state.online.form.valid;
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    if (this.settingsService.responsive.enabled === false) {
      this.state.local.validSize =
        window.innerWidth >= this.settingsService.responsive.fixedwidth;
    } else {
      this.state.local.validSize = true;
    }
  }

  getDropzoneFileString(file: File | SessionFile) {
    if (file !== undefined) {
      const fsize: FileSize = getFileSize(file.size);
      return `${file.name} (${Math.round(fsize.size * 100) / 100} ${
        fsize.label
      })`;
    }
    return '';
  }

  getFileStatus(): string {
    if (
      !(this.dropzone.files === undefined) &&
      this.dropzone.files.length > 0 &&
      !(this.dropzone.oaudiofile === undefined)
    ) {
      // check conditions
      if (
        this.appStorage.sessionfile === undefined ||
        (this.dropzone.oaudiofile.name === this.appStorage.sessionfile.name &&
          this.dropzone.oannotation === undefined)
      ) {
        return 'start';
      } else {
        return 'new';
      }
    }

    return 'unknown';
  }

  onTranscriptionDelete() {
    this.modService
      .openModal(
        TranscriptionDeleteModalComponent,
        TranscriptionDeleteModalComponent.options
      )
      .then((answer: any) => {
        if (answer === ModalDeleteAnswer.DELETE) {
          this.newTranscription();
        }
      })
      .catch((error) => {
        console.error(error);
      });
  }

  public startDemo() {
    const audioExample = this.settingsService.getAudioExample(
      this.langService.getActiveLang()
    );

    if (audioExample !== undefined) {
      // delete old data for fresh new session
      this.appStorage.setDemoSession(
        audioExample.url,
        audioExample.description,
        1000
      );
      this.navigate();
    }
  }

  public isPasswordCorrect() {
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

  private navigate = (): void => {
    navigateTo(this.router, ['/intern'], AppInfo.queryParamsHandling).catch(
      (error) => {
        console.error(error);
      }
    );
  };

  private createNewOnlineSession() {
    /*
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
     */
  }
}
