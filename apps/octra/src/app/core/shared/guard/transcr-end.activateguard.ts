import { Injectable } from '@angular/core';

import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { Observable } from 'rxjs';
import { AppStorageService } from '../service/appstorage.service';

@Injectable()
export class TranscrEndGuard {
  constructor(private appStorage: AppStorageService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | boolean {
    // TODO remove this class
    return true;
  }
}
