import {Injectable} from '@angular/core';

import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {AppStorageService} from '../../shared/service';
import {AppInfo} from '../../../app.info';
import {Observable} from 'rxjs';

@Injectable()
export class ALoginGuard implements CanActivate {

  constructor(private appStorage: AppStorageService, private router: Router) {

  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {
    if (this.appStorage.LoggedIn === true) {
      const params = AppInfo.queryParamsHandling;
      params.fragment = route.fragment;
      params.queryParams = route.queryParams;

      this.router.navigate(['/user/transcr'], params);
      return false;
    }
    return true;
  }
}
