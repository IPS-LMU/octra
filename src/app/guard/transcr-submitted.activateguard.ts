import {Injectable} from '@angular/core';

import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {Observable} from 'rxjs/Rx';
import {SessionService} from '../service/session.service';

@Injectable()
export class TranscrSubmittedGuard implements CanActivate {

  constructor(private sessService: SessionService, private router: Router) {

  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {
    if (!this.sessService.submitted) {
      this.router.navigate(['/user/load']);
      return false;
    }
    return true;
  }
}
