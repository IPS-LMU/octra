import {Injectable} from '@angular/core';

import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {Observable} from 'rxjs';
import {AppInfo} from '../../../app.info';
import {SettingsService} from '../service';
import {AppStorageService} from '../service/appstorage.service';
import {Functions} from '@octra/utilities';
import {LoginMode} from '../../store';

@Injectable()
export class TranscActivateGuard implements CanActivate {

  constructor(private appStorage: AppStorageService,
              private router: Router,
              private settService: SettingsService) {

  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {
    if (!this.settService.isAudioLoaded) {
      const params = AppInfo.queryParamsHandling;
      params.fragment = route.fragment;
      params.queryParams = route.queryParams;

      if (this.appStorage.useMode !== LoginMode.LOCAL) {
        Functions.navigateTo(this.router, ['/user/load'], params).catch((error) => {
          console.error(error);
        });
      } else {
        Functions.navigateTo(this.router, ['/user/transcr/reload-file'], params).catch((error) => {
          console.error(error);
        });
      }
      return false;
    }
    return true;
  }
}