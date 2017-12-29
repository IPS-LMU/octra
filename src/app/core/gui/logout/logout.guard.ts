import {Injectable} from '@angular/core';

import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {Observable} from 'rxjs/Observable';
import {AppStorageService} from '../../shared/service/appstorage.service';

@Injectable()
export class LogoutGuard implements CanActivate {
  constructor(private appStorage: AppStorageService,
              private router: Router) {

  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {
    // check if an active session is available
    if (this.appStorage.logged_in) {
      return true;
    } else {
      this.router.navigate(['/user/transcr'], {
        queryParamsHandling: 'preserve'
      });
    }
    return false;
  }
}
