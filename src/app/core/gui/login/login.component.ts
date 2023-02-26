import {AfterViewInit, ChangeDetectorRef, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Router} from '@angular/router';
import {NgForm} from '@angular/forms';
import {LoginService} from './login.service';
import {APIService, AppStorageService, AudioService, OIDBLevel, OIDBLink, SettingsService} from '../../shared/service';
import {ComponentCanDeactivate} from './login.deactivateguard';
import {SubscriptionManager} from '../../shared';
import {SessionFile} from '../../obj/SessionFile';
import {TranslocoService} from '@ngneat/transloco';
import {Converter} from '../../obj/Converters';
import {OctraDropzoneComponent} from '../octra-dropzone/octra-dropzone.component';
import {ModalService} from '../../modals/modal.service';
import {ModalDeleteAnswer} from '../../modals/transcription-delete-modal/transcription-delete-modal.component';
import {AppInfo} from '../../../app.info';
import {FileSize, Functions, isNullOrUndefined} from '../../shared/Functions';
import {sha256} from 'js-sha256';
import {Observable} from 'rxjs';
import {parseServerDataEntry} from '../../obj/data-entry';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  providers: [LoginService]
})
export class LoginComponent implements OnInit, OnDestroy, ComponentCanDeactivate, AfterViewInit {

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
    this.subscrmanager = new SubscriptionManager();
  }

  @ViewChild('f', {static: false}) loginform: NgForm;
  @ViewChild('dropzone', {static: true}) dropzone: OctraDropzoneComponent;
  @ViewChild('agreement', {static: false}) agreement: ElementRef;
  @ViewChild('localmode', {static: true}) localmode: ElementRef;
  @ViewChild('onlinemode', {static: true}) onlinemode: ElementRef;
  public validSize = false;
  public agreementChecked = true;
  public projects: string[] = [];
  valid = false;
  member = {
    id: '',
    agreement: '',
    project: '',
    jobno: '',
    password: ''
  };
  err = '';

  public apiStatus: 'init' | 'available' | 'unavailable' = 'init';

  private subscrmanager: SubscriptionManager;

  async onOfflineSubmit() {
    if (this.appStorage.usemode !== 'demo' && !isNullOrUndefined(this.appStorage.dataID) && typeof this.appStorage.dataID === 'number') {
      // last was online mode
      try {
        await this.api.setOnlineSessionToFree(this.appStorage);
        this.audioService.registerAudioManager(this.dropzone.audiomanager);
        this.appStorage.beginLocalSession(this.dropzone.files, false, async () => {
          if (!(this.dropzone.oannotation === null || this.dropzone.oannotation === undefined)) {
            const newLevels: OIDBLevel[] = [];
            for (let i = 0; i < this.dropzone.oannotation.levels.length; i++) {
              newLevels.push(new OIDBLevel(i + 1, this.dropzone.oannotation.levels[i], i));
            }

            const newLinks: OIDBLink[] = [];
            for (let i = 0; i < this.dropzone.oannotation.links.length; i++) {
              newLinks.push(new OIDBLink(i + 1, this.dropzone.oannotation.links[i]));
            }
            try {
              await this.appStorage.overwriteAnnotation(newLevels);
              await this.appStorage.overwriteLinks(newLinks);
              this.navigate();
            } catch (e) {
              console.error(e);
            }
          } else {
            this.navigate();
          }
        }, (error) => {
          alert(error);
        });
      } catch (e) {
        console.error(e);
      }
    } else {
      this.audioService.registerAudioManager(this.dropzone.audiomanager);
      this.appStorage.beginLocalSession(this.dropzone.files, true, async () => {
        if (!(this.dropzone.oannotation === null || this.dropzone.oannotation === undefined)) {
          const newLevels: OIDBLevel[] = [];
          for (let i = 0; i < this.dropzone.oannotation.levels.length; i++) {
            newLevels.push(new OIDBLevel(i + 1, this.dropzone.oannotation.levels[i], i));
          }

          const newLinks: OIDBLink[] = [];
          for (let i = 0; i < this.dropzone.oannotation.links.length; i++) {
            newLinks.push(new OIDBLink(i + 1, this.dropzone.oannotation.links[i]));
          }

          try {
            await this.appStorage.overwriteAnnotation(newLevels);
            await this.appStorage.overwriteLinks(newLinks);
            this.navigate();
          } catch (e) {
            console.error(e);
          }
        } else {
          this.navigate();
        }
      }, (error) => {
        alert(error);
      });
    }
  };

  newTranscription = () => {
    this.audioService.registerAudioManager(this.dropzone.audiomanager);

    this.appStorage.beginLocalSession(this.dropzone.files, false, async () => {
        if (!(this.dropzone.oannotation === null || this.dropzone.oannotation === undefined)) {
          const newLevels: OIDBLevel[] = [];
          for (let i = 0; i < this.dropzone.oannotation.levels.length; i++) {
            newLevels.push(new OIDBLevel(i + 1, this.dropzone.oannotation.levels[i], i));
          }

          const newLinks: OIDBLink[] = [];
          for (let i = 0; i < this.dropzone.oannotation.links.length; i++) {
            newLinks.push(new OIDBLink(i + 1, this.dropzone.oannotation.links[i]));
          }

          try {
            await this.appStorage.overwriteAnnotation(newLevels);
            await this.appStorage.overwriteLinks(newLinks);
            this.navigate();
          } catch (e) {
            console.error(e);
          }
        } else {
          this.navigate();
        }
      },
      (error) => {
        if (error === 'file not supported') {
          this.modService.show('error', {
            text: this.langService.translate('reload-file.file not supported', {type: ''})
          });
        }
      }
    );
  };
  private navigate = (): void => {
    Functions.navigateTo(this.router, ['user'], AppInfo.queryParamsHandling);
  };

  async ngOnInit() {
    if (this.settingsService.responsive.enabled === false) {
      this.validSize = window.innerWidth >= this.settingsService.responsive.fixedwidth;
    } else {
      this.validSize = true;
    }

    const loaduser = () => {
      if (this.appStorage.usemode !== 'demo') {
        if (!isNullOrUndefined(this.appStorage.user)) {
          if (this.appStorage.user.id !== '-1') {
            this.member.id = this.appStorage.user.id;
            this.clearUserName();
          }

          if (this.appStorage.user.hasOwnProperty('project')) {
            this.member.project = this.appStorage.user.project;
          }

          if (this.appStorage.user.hasOwnProperty('jobno')
            && this.appStorage.user.jobno !== null && this.appStorage.user.jobno > -1) {
            this.member.jobno = this.appStorage.user.jobno.toString();
          }
        }
      } else {
        this.appStorage.usemode = null;
        this.appStorage.dataID = null;
        this.appStorage.user.id = '';
        this.appStorage.user.jobno = -1;
        this.appStorage.user.project = '';
        this.member = {
          id: '',
          agreement: '',
          project: '',
          jobno: '',
          password: ''
        };
      }
    };

    try {
      await this.settingsService.waitForDBLoaded();
      loaduser();
      await this.settingsService.loadProjectSettings();
      await this.loadPojectsList();
    } catch (e) {
      console.error(e);
    }
  }

  ngAfterViewInit() {
  }

  ngOnDestroy() {
    this.subscrmanager.destroy();
  }

  async onSubmit(form: NgForm) {
    let newSession = false;
    let newSessionAfterOld = false;
    let continueSession = false;

    if (!this.isPasswordCorrect(this.member.project, this.member.password)) {
      this.modService.show('loginInvalid');
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
            !(this.appStorage.user.project === null || this.appStorage.user.project === undefined) &&
            !(this.appStorage.user.jobno === null || this.appStorage.user.jobno === undefined) &&
            !(this.appStorage.user.id === null || this.appStorage.user.id === undefined)
          ) {
            // check if credentials are the same like before
            if (
              this.appStorage.user.id === this.member.id &&
              Number(this.appStorage.user.jobno) === Number(this.member.jobno) &&
              this.appStorage.user.project === this.member.project
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
        try {
          await this.api.setOnlineSessionToFree(this.appStorage);
        } catch (e) {
          console.error(e);
        }
      }

      if (newSession || newSessionAfterOld) {
        try {
          await this.createNewSession(form);
        } catch (e) {
          console.error(e);
        }
      } else if (continueSession) {
        try {
          const json = await this.api.fetchAnnotation(this.appStorage.dataID);

          if (isNullOrUndefined(json.data)) {
            // job doesn't exist anymore
            await this.createNewSession(form);
          } else {
            // continue job
            if (json.hasOwnProperty('message')) {
              const counter = (json.message === '') ? '0' : json.message;
              this.appStorage.sessStr.store('jobsLeft', Number(counter));
            }

            if (form.valid && this.agreementChecked && json.message !== '0') {
              if (this.appStorage.sessionfile !== null) {
                // last was offline mode
                try {
                  await this.appStorage.clearLocalStorage();
                } catch (e) {
                  console.error(e);
                }
              }

              if (this.appStorage.usemode === 'online' && json.data.hasOwnProperty('prompttext')) {
                // get transcript data that already exists
                const prompt = json.data.prompttext;
                this.appStorage.prompttext = (prompt) ? prompt : '';
              } else {
                this.appStorage.prompttext = '';
              }

              if (!isNullOrUndefined(this.appStorage.dataID) && isNullOrUndefined(this.appStorage.audioURL)) {
                console.log('load data from server for this task with status ' + json.data.status);
                this.appStorage.serverDataEntry = parseServerDataEntry(JSON.stringify(json.data));
                this.appStorage.audioURL = json.data.url;
              }

              const res = this.appStorage.setSessionData(this.member, this.appStorage.dataID, this.appStorage.audioURL);
              if (res.error === '') {
                this.navigate();
              } else {
                alert(res.error);
              }
            } else {
              this.modService.show('loginInvalid');
            }
          }
        } catch (e) {
          this.modService.show('error', {
            text: 'Server cannot be requested. Please check if you are online.'
          });
          console.error(e);
        }
      }
    }
  }

  canDeactivate(): Observable<boolean> | boolean {
    return (this.valid);
  }

  @HostListener('window:resize', ['$event'])
  onResize($event) {
    if (this.settingsService.responsive.enabled === false) {
      this.validSize = window.innerWidth >= this.settingsService.responsive.fixedwidth;
    } else {
      this.validSize = true;
    }
  }

  getDropzoneFileString(file: File | SessionFile) {
    const fsize: FileSize = Functions.getFileSize(file.size);
    return `${file.name} (${(Math.round(fsize.size * 100) / 100)} ${fsize.label})`;
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

  getValidBrowsers(): string {
    let result = '';

    for (let i = 0; i < this.apc.octra.allowed_browsers.length; i++) {
      const browser = this.apc.octra.allowed_browsers[i];
      result += browser.name;
      if (i < this.apc.octra.allowed_browsers.length - 1) {
        result += ', ';
      }
    }

    return result;
  }

  async loadPojectsList() {
    try {
      const json = await this.api.getProjects();

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
        if (!(this.appStorage.user === null || this.appStorage.user === undefined) &&
          !(this.appStorage.user.project === null || this.appStorage.user.project === undefined) && this.appStorage.user.project !== '') {

          const found = this.projects.find(
            (x) => {
              return x === this.appStorage.user.project;
            });
          if ((found === null || found === undefined)) {
            // make sure that old project is in list
            this.projects.push(this.appStorage.user.project);
          }
        }
      }

      this.apiStatus = 'available';
    } catch (e) {
      console.error(e);
      console.error(`ERROR: could not load list of projects:\n${e}`);
      this.apiStatus = 'unavailable';
    }
  }

  public selectProject(event: HTMLSelectElement) {
    this.member.project = event.value;
  }

  public testFile(converter: Converter, file: File) {
    const reader: FileReader = new FileReader();
    reader.readAsText(file);
    reader.readAsText(file, 'utf-8');
  }

  async onTranscriptionDelete() {
    try {
      const answer: ModalDeleteAnswer = await this.modService.show('transcriptionDelete');
      if (answer === ModalDeleteAnswer.DELETE) {
        this.newTranscription();
      }
    } catch (e) {
      console.error(e);
    }
  }

  private async createNewSession(form: NgForm) {
    this.clearUserName();
    try {
      const json = await this.api.beginSession(this.member.project, this.member.id, Number(this.member.jobno));
      if (form.valid && this.agreementChecked && json.message !== '0') {
        // delete old data for fresh new session
        this.appStorage.clearSession();
        await this.appStorage.clearLocalStorage();
        const res = this.appStorage.setSessionData(this.member, json.data.id, json.data.url);

        // get transcript data that already exists
        const jsonStr = JSON.stringify(json.data);
        this.appStorage.serverDataEntry = parseServerDataEntry(jsonStr);

        if (isNullOrUndefined(this.appStorage.serverDataEntry.transcript) ||
          !Array.isArray(this.appStorage.serverDataEntry.transcript)) {
          this.appStorage.serverDataEntry.transcript = [];
        }

        if (isNullOrUndefined(this.appStorage.serverDataEntry.logtext) ||
          !Array.isArray(this.appStorage.serverDataEntry.logtext)) {
          this.appStorage.serverDataEntry.logtext = [];
        }

        if (this.appStorage.usemode === 'online' && this.appStorage.serverDataEntry.hasOwnProperty('prompttext')) {
          // get transcript data that already exists
          const prompt = this.appStorage.serverDataEntry.prompttext;
          this.appStorage.prompttext = (prompt) ? prompt : '';
        } else {
          this.appStorage.prompttext = '';
        }

        if (this.appStorage.usemode === 'online' && this.appStorage.serverDataEntry.hasOwnProperty('comment')) {
          // get transcript data that already exists
          const comment = this.appStorage.serverDataEntry.comment;

          if (comment) {
            this.appStorage.servercomment = comment;
          }
        } else {
          this.appStorage.servercomment = '';
        }

        if (json.hasOwnProperty('message')) {
          const counter = (json.message === '') ? '0' : json.message;
          this.appStorage.sessStr.store('jobsLeft', Number(counter));
        }

        if (res.error === '') {
          this.navigate();
        } else {
          this.modService.show('error', res.error);
        }
      } else {
        this.modService.show('loginInvalid');
      }
    } catch (e) {
      alert('Server cannot be requested. Please check if you are online.');
    }
  }

  public async startDemo() {
    const audioExample = this.settingsService.getAudioExample(this.langService.getActiveLang());

    if (!isNullOrUndefined(audioExample)) {
      this.member.id = 'demo_user';
      this.member.project = 'DemoProject';
      this.member.jobno = '123';

      try {
        // delete old data for fresh new session
        this.appStorage.clearSession();
        await this.appStorage.clearLocalStorage();

        this.appStorage.setSessionData(this.member, 21343134, audioExample.url);
        this.appStorage.usemode = 'demo';
        this.appStorage.prompttext = '';
        this.appStorage.servercomment = audioExample.description;
        this.appStorage.sessStr.store('jobsLeft', 1000);

        this.navigate();
      } catch (e) {
        console.error(e);
      }
    }
  }

  public isPasswordCorrect(selectedProject, password) {
    if (!isNullOrUndefined(this.settingsService.appSettings.octra.allowed_projects)) {
      const inputHash = sha256(password).toUpperCase();
      const projectData = this.settingsService.appSettings.octra.allowed_projects.find((a) => {
        return a.name === selectedProject;
      });

      if (!isNullOrUndefined(projectData)) {
        if (projectData.hasOwnProperty('password') && projectData.password !== '') {
          return projectData.password.toUpperCase() === inputHash;
        }
      }
    }

    return true;
  }

  passwordExists() {
    if (!isNullOrUndefined(this.settingsService.appSettings.octra.allowed_projects)) {
      const projectData = this.settingsService.appSettings.octra.allowed_projects.find((a) => {
        return a.name === this.member.project;
      });

      return (!isNullOrUndefined(projectData) && projectData.hasOwnProperty('password')) && projectData.password !== '';
    }

    return false;
  }

  clearUserName() {
    if (!isNullOrUndefined(this.member.id) && typeof this.member.id === 'string') {
      this.member.id = this.member.id.replace(/(^\s+)|(\s+$)/g, '');
      this.member.id = this.member.id.replace(/[\s ]+/g, '_');
    }
  }
}
