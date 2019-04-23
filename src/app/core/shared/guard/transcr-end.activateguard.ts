import {Injectable} from '@angular/core';

import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {Observable} from 'rxjs/Observable';
import {AppStorageService} from '../service';
import {AppInfo} from '../../../app.info';
import {Functions} from '../Functions';

@Injectable()
export class TranscrEndGuard implements CanActivate {

  constructor(private appStorage: AppStorageService, private router: Router) {

  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {
    if (!this.appStorage.submitted) {
      Functions.navigateTo(this.router, ['/user/load'], AppInfo.queryParamsHandling);
      return false;
    }
    return true;
  }
}
