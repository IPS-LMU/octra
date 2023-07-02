import { Injectable } from '@angular/core';

import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { Observable } from 'rxjs';
import { AppInfo } from '../../../app.info';
import { AppStorageService } from '../../shared/service/appstorage.service';

@Injectable()
export class ALoginGuard implements CanActivate {
  constructor(private appStorage: AppStorageService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | boolean {
    if (this.appStorage.loggedIn) {
      console.log(`IS LOGGED IN!`);
      const params = AppInfo.queryParamsHandling;
      params.fragment = route.fragment;
      params.queryParams = route.queryParams;

      this.router.navigate(['/user/transcr'], params).catch((error) => {
        console.error(error);
      });
      return false;
    } else {
      console.log(`IS NOT LOGGED IN!`);
    }
    return true;
  }
}
