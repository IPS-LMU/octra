import {Injectable} from '@angular/core';

import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {Functions} from 'octra-components';
import {Observable} from 'rxjs';
import {AppInfo} from '../../../app.info';
import {AppStorageService} from '../service/appstorage.service';

@Injectable()
export class TranscrEndGuard implements CanActivate {

  constructor(private appStorage: AppStorageService, private router: Router) {

  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {
    if (!this.appStorage.submitted) {
      Functions.navigateTo(this.router, ['/user/load'], AppInfo.queryParamsHandling).catch((error) => {
        console.error(error);
      });
      return false;
    }
    return true;
  }
}
