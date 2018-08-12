import {Injectable} from '@angular/core';

import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {Observable} from 'rxjs/Observable';
import {AppStorageService} from '../../shared/service/appstorage.service';
import {SettingsService} from '../../shared/service/settings.service';

@Injectable()
export class MembersAreaGuard implements CanActivate {

  constructor(private appStorage: AppStorageService, private router: Router,
              private settService: SettingsService) {

  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {

    if (this.appStorage.LoggedIn !== true) {
      this.router.navigate(['/login'], {
        queryParamsHandling: 'preserve'
      });
      return false;
    } else if (this.appStorage.usemode === 'local') {
      if (this.appStorage.file === null) {
        // navigate to reload-file
        this.router.navigate(['/user/transcr/reload-file'], {
          queryParamsHandling: 'preserve'
        });
        return false;
      }
    } else if (!this.settService.allloaded) {
      this.router.navigate(['/user/load'], {
        queryParamsHandling: 'preserve'
      });
    }

    return true;
  }
}
