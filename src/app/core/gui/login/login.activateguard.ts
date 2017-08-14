import {Injectable} from '@angular/core';

import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {Observable} from 'rxjs/Rx';
import {AppStorageService} from '../../shared/service/appstorage.service';

@Injectable()
export class ALoginGuard implements CanActivate {

  constructor(private sessService: AppStorageService, private router: Router) {

  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {
    if (this.sessService.LoggedIn === true) {
      this.router.navigate(['/user/transcr']);
      return false;
    }
    return true;
  }
}
