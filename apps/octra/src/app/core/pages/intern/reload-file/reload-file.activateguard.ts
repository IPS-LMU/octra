import { Injectable } from '@angular/core';

import {
  ActivatedRouteSnapshot,
  CanActivate,
  RouterStateSnapshot,
} from '@angular/router';
import { SettingsService } from '../../../shared/service';
import { AppStorageService } from '../../../shared/service/appstorage.service';
import { Store } from '@ngrx/store';
import { AppInfo } from '../../../../app.info';
import { RoutingService } from '../../../shared/service/routing.service';

@Injectable()
export class ReloadFileGuard implements CanActivate {
  constructor(
    private appStorage: AppStorageService,
    private routingService: RoutingService,
    private settingsService: SettingsService,
    private store: Store
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    if (!this.appStorage.loggedIn) {
      const params = AppInfo.queryParamsHandling;
      params.fragment = route.fragment!;
      params.queryParams = route.queryParams;

      this.routingService
        .navigate('ReloadFileGuard route back to login', ['/login'], params)
        .catch((error) => {
          console.error(error);
        });
      return false;
    } else {
      console.log(`reload file guard projectconfig set ok`);
      return true;
    }
  }
}
