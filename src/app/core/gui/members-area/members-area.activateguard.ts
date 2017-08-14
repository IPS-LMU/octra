import {Injectable} from '@angular/core';

import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {Observable} from 'rxjs/Rx';
import {AppStorageService} from '../../shared/service/appstorage.service';
import {SettingsService} from '../../shared/service/settings.service';

@Injectable()
export class MembersAreaGuard implements CanActivate {

  constructor(private sessService: AppStorageService, private router: Router,
              private settService: SettingsService) {

  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {

    if (this.sessService.LoggedIn !== true) {
      this.router.navigate(['/login']);
      return false;
    } else if (this.sessService.uselocalmode === true) {
      if (this.sessService.file === null) {
        // navigate to reload-file
        this.router.navigate(['/user/transcr/reload-file']);
        return false;
      }
    } else if (this.sessService.submitted) {
      this.router.navigate(['/user/transcr/submitted']);
      return false;
    } else if (!this.settService.allloaded) {
      this.router.navigate(['/user/load']);
    }

    return true;
  }
}
