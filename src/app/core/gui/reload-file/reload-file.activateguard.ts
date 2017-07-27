import {Injectable} from '@angular/core';

import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {Observable} from 'rxjs/Rx';
import {SessionService} from '../../shared/service/session.service';
import {SettingsService} from '../../shared/service/settings.service';
import {isNullOrUndefined} from 'util';

@Injectable()
export class ReloadFileGuard implements CanActivate {

  constructor(private sessService: SessionService,
              private router: Router,
              private settingsService: SettingsService) {
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    if (this.sessService.LoggedIn !== true) {
      this.router.navigate(['/login']);
      return false;
    } else {
      if (isNullOrUndefined(this.settingsService.app_settings)) {
        return this.settingsService.settingsloaded.first();
      } else {
        return this.settingsService.validated;
      }
    }
  }
}
