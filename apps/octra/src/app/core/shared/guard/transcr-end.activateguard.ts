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
    // TODO remove this class
    return true;
  }
}
