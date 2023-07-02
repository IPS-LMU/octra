import { Injectable } from '@angular/core';

import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { Observable } from 'rxjs';
import { AppInfo } from '../../../app.info';
import { AppStorageService } from '../service/appstorage.service';
import { navigateTo } from '@octra/ngx-utilities';

@Injectable()
export class TranscrEndGuard implements CanActivate {
  constructor(private appStorage: AppStorageService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | boolean {
    console.log(`submitted is ${this.appStorage.submitted}`);
    if (!this.appStorage.submitted) {
      console.log(`not submitted, to load`);
      navigateTo(
        this.router,
        ['/user/load'],
        AppInfo.queryParamsHandling
      ).catch((error) => {
        console.error(error);
      });
      return false;
    }
    console.log(`is submitted`);
    return true;
  }
}
