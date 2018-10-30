import {Injectable} from '@angular/core';

import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {Observable} from 'rxjs/Observable';
import {AppStorageService} from '../../shared/service/appstorage.service';
import {AppInfo} from '../../../app.info';
import {Functions} from '../../shared/Functions';

@Injectable()
export class LogoutGuard implements CanActivate {
  constructor(private appStorage: AppStorageService,
              private router: Router) {

  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {
    // check if an active session is available
    if (this.appStorage.LoggedIn) {
      return true;
    } else {
      const params = AppInfo.queryParamsHandling;
      params.fragment = route.fragment;
      params.queryParams = route.queryParams;

      Functions.navigateTo(this.router, ['/user/transcr'], params);
    }
    return false;
  }
}
