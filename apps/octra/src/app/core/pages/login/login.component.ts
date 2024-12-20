import { Component, ElementRef, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AccountLoginMethod } from '@octra/api-types';
import { OctraAPIService } from '@octra/ngx-octra-api';
import { FileSize, getFileSize } from '@octra/utilities';
import { Observable } from 'rxjs';
import { DefaultComponent } from '../../component/default.component';
import { OctraDropzoneComponent } from '../../component/octra-dropzone/octra-dropzone.component';
import { SessionFile } from '../../obj/SessionFile';
import { AudioService, SettingsService } from '../../shared/service';
import { AppStorageService } from '../../shared/service/appstorage.service';
import { CompatibilityService } from '../../shared/service/compatibility.service';
import { AuthenticationStoreService } from '../../store/authentication';
import { ComponentCanDeactivate } from './login.deactivateguard';
import { LoginService } from './login.service';

@Component({
  selector: 'octra-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  providers: [LoginService],
})
export class LoginComponent
  extends DefaultComponent
  implements ComponentCanDeactivate
{
  @ViewChild('f', { static: false }) loginform?: NgForm;
  @ViewChild('dropzone', { static: false }) dropzone?: OctraDropzoneComponent;
  @ViewChild('agreement', { static: false }) agreement?: ElementRef;
  @ViewChild('localmode', { static: true }) localmode?: ElementRef;
  @ViewChild('onlinemode', { static: true }) onlinemode?: ElementRef;

  email_link = '';

  fileStatus = '';

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

  compatibleBrowser?: boolean;

  constructor(
    private router: Router,
    public appStorage: AppStorageService,
    public api: OctraAPIService,
    public settingsService: SettingsService,
    private audioService: AudioService,
    public authStoreService: AuthenticationStoreService,
    protected compatibilityService: CompatibilityService
  ) {
    super();
    this.compatibilityService.testCompability().then((result) => {
      this.compatibleBrowser = result;
      this.readFileStatus();
    });

    const subject = 'Octra Server is offline';
    const body = `Hello,

I just want to let you know, that the OCTRA server is currently offline.

 Best,
 an OCTRA user
 `;
    const url = `mailto:${
      this.settingsService.appSettings.octra.supportEmail
    }?subject=${encodeURI(subject)}&body=${encodeURI(body)}`;

    this.email_link = `<br/><a href="${url}">${this.settingsService.appSettings.octra.supportEmail}</a>`;
  }

  onOfflineSubmit = (removeData: boolean) => {
    this.audioService.registerAudioManager(this.dropzone.audioManager!);
    this.authStoreService.loginLocal(
      this.dropzone.files.map((a) => a.file),
      this.dropzone.oannotation,
      removeData
    );
  };

  onOnlineSubmit($event: {
    type: AccountLoginMethod;
    credentials?: {
      usernameEmail: string;
      password: string;
    };
  }) {
    this.authStoreService.loginOnline(
      $event.type,
      $event.credentials?.usernameEmail,
      $event.credentials?.password
    );
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

  getDropzoneFileString(file: File | SessionFile) {
    if (file !== undefined) {
      const fsize: FileSize = getFileSize(file.size);
      return `${file.name} (${Math.round(fsize.size * 100) / 100} ${
        fsize.label
      })`;
    }
    return '';
  }

  readFileStatus = () => {
    if (
      this.dropzone?.files &&
      this.dropzone.files.length > 0 &&
      this.dropzone.oaudiofile
    ) {
      // check conditions
      if (
        !this.appStorage.sessionfile ||
        (this.dropzone.oaudiofile.name === this.appStorage.sessionfile.name &&
          !this.dropzone.oannotation)
      ) {
        this.fileStatus = 'start';
        return;
      } else {
        this.fileStatus = 'new';
        return;
      }
    }

    this.fileStatus = 'unknown';
  };

  afterFilesAdded() {
    this.readFileStatus();
  }

  public startDemo() {
    this.authStoreService.loginDemo();
  }
}
