import {Injectable} from '@angular/core';

import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {Observable} from 'rxjs/Rx';
import {SessionService} from '../service/session.service';
import {SettingsService} from '../service/settings.service';
import {isNullOrUndefined} from 'util';

@Injectable()
export class ReloadFileGuard implements CanActivate {

  constructor(private sessService: SessionService,
              private router: Router,
              private settingsService: SettingsService) {
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {
    if (this.sessService.LoggedIn !== true) {
      console.log('not logged in');
      this.router.navigate(['/login']);
      return false;
    } else {
      if (isNullOrUndefined(this.settingsService.app_settings)) {
        return this.settingsService.settingsloaded;
      } else {
        return this.settingsService.validated;
      }
    }
  }
}
