import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
} from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { FileSize, getFileSize } from '@octra/utilities';
import { navigateTo } from '@octra/ngx-utilities';
import { AppInfo } from '../../../app.info';
import { SessionFile } from '../../obj/SessionFile';
import { AudioService, SettingsService } from '../../shared/service';
import { AppStorageService } from '../../shared/service/appstorage.service';
import { OctraDropzoneComponent } from '../../component/octra-dropzone/octra-dropzone.component';
import { ComponentCanDeactivate } from './login.deactivateguard';
import { LoginService } from './login.service';
import { Observable } from 'rxjs';
import { DefaultComponent } from '../../component/default.component';
import { AuthenticationStoreService } from '../../store/authentication';
import { AccountLoginMethod } from '@octra/api-types';
import { OctraAPIService } from '@octra/ngx-octra-api';

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
    public api: OctraAPIService,
    public settingsService: SettingsService,
    private audioService: AudioService,
    public authStoreService: AuthenticationStoreService
  ) {
    super();
  }

  onOfflineSubmit = (removeData: boolean) => {
    this.audioService.registerAudioManager(this.dropzone.audioManager!);
    this.authStoreService.loginLocal(
      this.dropzone.files.map((a) => a.file),
      this.dropzone.oannotation,
      removeData
    );
  };

  ngOnInit() {
    if (this.settingsService.responsive.enabled === false) {
      this.state.local.validSize =
        window.innerWidth >= this.settingsService.responsive.fixedwidth;
    } else {
      this.state.local.validSize = true;
    }
  }

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

  @HostListener('window:resize', ['$event'])
  onResize() {
    if (!this.settingsService.responsive.enabled) {
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

  public startDemo() {
    this.authStoreService.loginDemo();
  }

  private navigate = (): void => {
    navigateTo(this.router, ['/intern'], AppInfo.queryParamsHandling).catch(
      (error) => {
        console.error(error);
      }
    );
  };
}
