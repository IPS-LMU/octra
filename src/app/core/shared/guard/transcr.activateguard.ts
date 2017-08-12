import {Injectable} from '@angular/core';

import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {Observable} from 'rxjs/Rx';
import {SessionService} from '../service/session.service';
import {SettingsService} from '../service/settings.service';

@Injectable()
export class TranscActivateGuard implements CanActivate {

  constructor(private sessService: SessionService,
              private router: Router,
              private settService: SettingsService) {

  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {
    if (!this.sessService.uselocalmode) {
      if (!this.settService.allloaded) {
        this.router.navigate(['/user/load']);
        return false;
      }
    } else {
      if (!this.settService.allloaded) {
        this.router.navigate(['/user/transcr/reload-file']);
        return false;
      }
    }
    return true;
  }
}
