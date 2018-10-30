import {Injectable} from '@angular/core';

import {ActivatedRoute, ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {Observable} from 'rxjs/Observable';
import {AppStorageService} from '../../shared/service/appstorage.service';
import {SettingsService} from '../../shared/service/settings.service';
import {AppInfo} from '../../../app.info';
import {Functions} from '../../shared/Functions';

@Injectable()
export class MembersAreaGuard implements CanActivate {

  constructor(private appStorage: AppStorageService, private router: Router,
              private settService: SettingsService, private activatedRoute: ActivatedRoute) {

  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {

    if (this.appStorage.LoggedIn !== true) {
      const params = AppInfo.queryParamsHandling;
      params.fragment = route.fragment;
      params.queryParams = route.queryParams;

      Functions.navigateTo(this.router, ['/login'], params);
      return false;
    } else if (this.appStorage.usemode === 'local') {
      if (this.appStorage.file === null) {
        // navigate to reload-file
        const params = AppInfo.queryParamsHandling;
        params.fragment = route.fragment;
        params.queryParams = route.queryParams;

        Functions.navigateTo(this.router, ['/user/transcr/reload-file'], params);
        return false;
      }
    } else if (!this.settService.allloaded) {
      const params = AppInfo.queryParamsHandling;
      params.fragment = route.fragment;
      params.queryParams = route.queryParams;

      Functions.navigateTo(this.router, ['/user/load'], params);
      return false;
    }

    return true;
  }
}
