import {Injectable} from '@angular/core';

import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {Observable} from 'rxjs/Observable';
import {AppStorageService} from '../service/appstorage.service';
import {SettingsService} from '../service/settings.service';
import 'rxjs/add/operator/first';

@Injectable()
export class SettingsGuard implements CanActivate {

  constructor(private appStorage: AppStorageService,
              private router: Router,
              private settingsService: SettingsService) {
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    if ((this.settingsService.appSettings === null || this.settingsService.appSettings === undefined)) {
      return this.settingsService.settingsloaded.first();
    } else {
      return this.settingsService.validated;
    }
  }
}
