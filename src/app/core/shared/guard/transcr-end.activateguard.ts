import {Injectable} from '@angular/core';

import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {Observable} from 'rxjs/Rx';
import {AppStorageService} from '../service/appstorage.service';

@Injectable()
export class TranscrEndGuard implements CanActivate {

  constructor(private sessService: AppStorageService, private router: Router) {

  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {
    if (!this.sessService.submitted) {
      this.router.navigate(['/user/load']);
      return false;
    }
    return true;
  }
}
