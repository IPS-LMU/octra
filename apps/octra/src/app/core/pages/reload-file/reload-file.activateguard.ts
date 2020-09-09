import {Injectable} from '@angular/core';

import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {Subject} from 'rxjs';
import {AppInfo} from '../../../app.info';
import {SettingsService} from '../../shared/service';
import {AppStorageService} from '../../shared/service/appstorage.service';
import * as fromTranscription from '../../store/transcription';
import {Functions} from '@octra/utilities';
import {Store} from '@ngrx/store';

@Injectable()
export class ReloadFileGuard implements CanActivate {

  constructor(private appStorage: AppStorageService,
              private router: Router,
              private settingsService: SettingsService,
              private store: Store) {
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      if (this.appStorage.loggedIn) {
        const params = AppInfo.queryParamsHandling;
        params.fragment = route.fragment;
        params.queryParams = route.queryParams;

        Functions.navigateTo(this.router, ['/login'], params).catch((error) => {
          console.error(error);
        });
        resolve(false);
      } else {
        const subject = new Subject<boolean>();
        Functions.afterDefined(this.store.select(fromTranscription.selectProjectConfig)).then(() => {
          resolve(true);
        });
      }
    });
  }
}
