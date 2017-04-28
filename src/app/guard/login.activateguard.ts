import {Injectable} from '@angular/core';

import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {Observable} from 'rxjs/Rx';
import {SessionService} from '../service/session.service';

@Injectable()
export class ALoginGuard implements CanActivate {

  constructor(private sessService: SessionService, private router: Router) {

  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {
    if (this.sessService.LoggedIn === true) {
      this.router.navigate(['/user/transcr']);
      return false;
    }
    return true;
  }
}
