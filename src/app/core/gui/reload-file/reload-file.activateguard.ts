import {Injectable} from '@angular/core';

import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/catch';
import {AppStorageService, SettingsService} from '../../shared/service';
import 'rxjs/add/operator/first';
import {AppInfo} from '../../../app.info';
import {Functions} from '../../shared/Functions';

@Injectable()
export class ReloadFileGuard implements CanActivate {

  constructor(private appStorage: AppStorageService,
              private router: Router,
              private settingsService: SettingsService) {
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    if (this.appStorage.LoggedIn !== true) {
      const params = AppInfo.queryParamsHandling;
      params.fragment = route.fragment;
      params.queryParams = route.queryParams;

      Functions.navigateTo(this.router, ['/login'], params);
      return false;
    } else {
      if ((this.settingsService.appSettings === null || this.settingsService.appSettings === undefined)) {
        return this.settingsService.settingsloaded.first();
      } else {
        return this.settingsService.validated;
      }
    }
  }
}
