import {Injectable} from '@angular/core';

import {ActivatedRoute, ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {AppStorageService, AudioService, SettingsService} from '../../shared/service';
import {AppInfo} from '../../../app.info';
import {Functions} from '../../shared/Functions';
import {Observable} from 'rxjs';

@Injectable()
export class MembersAreaGuard implements CanActivate {

  constructor(private appStorage: AppStorageService, private router: Router,
              private settService: SettingsService, private activatedRoute: ActivatedRoute,
              private audioService: AudioService) {

  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {

    if (this.appStorage.LoggedIn !== true) {
      const params = AppInfo.queryParamsHandling;
      params.fragment = route.fragment;
      params.queryParams = route.queryParams;

      Functions.navigateTo(this.router, ['/login'], params);
      return false;
    } else if (this.appStorage.usemode === 'local') {
      if (this.audioService.audiomanagers.length === 0) {
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
