import {Injectable} from '@angular/core';

import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {Observable} from 'rxjs/Rx';
import {AppStorageService} from '../../shared/service/appstorage.service';
import {SettingsService} from '../../shared/service/settings.service';
import {isNullOrUndefined} from 'util';

@Injectable()
export class ReloadFileGuard implements CanActivate {

  constructor(private sessService: AppStorageService,
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
