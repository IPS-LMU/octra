import {Injectable} from '@angular/core';

import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {Observable} from 'rxjs';
import {AppInfo} from '../../../app.info';
import {Functions} from '../Functions';
import {AppStorageService, SettingsService} from '../service';

@Injectable()
export class TranscActivateGuard implements CanActivate {

  constructor(private appStorage: AppStorageService,
              private router: Router,
              private settService: SettingsService) {

  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {
    if (this.appStorage.usemode !== 'local') {
      if (!this.settService.allloaded) {

        const params = AppInfo.queryParamsHandling;
        params.fragment = route.fragment;
        params.queryParams = route.queryParams;

        Functions.navigateTo(this.router, ['/user/load'], params);
        return false;
      }
    } else {
      if (!this.settService.allloaded) {
        const params = AppInfo.queryParamsHandling;
        params.fragment = route.fragment;
        params.queryParams = route.queryParams;

        Functions.navigateTo(this.router, ['/user/transcr/reload-file'], params);
        return false;
      }
    }
    return true;
  }
}
