import {Injectable} from '@angular/core';

import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {Observable} from 'rxjs/Rx';
import {SessionService} from '../../shared/service/session.service';

@Injectable()
export class LogoutGuard implements CanActivate {
  constructor(private sessService: SessionService,
              private router: Router) {

  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {
    // check if an active session is available
    if (this.sessService.logged_in) {
      return true;
    } else {
      this.router.navigate(['/user/transcr']);
    }
    return false;
  }
}
