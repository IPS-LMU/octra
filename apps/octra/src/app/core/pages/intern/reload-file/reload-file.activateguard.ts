import { inject, Injectable } from '@angular/core';

import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AppInfo } from '../../../../app.info';
import { AppStorageService } from '../../../shared/service/appstorage.service';
import { RoutingService } from '../../../shared/service/routing.service';

@Injectable()
export class ReloadFileGuard {
  private appStorage = inject(AppStorageService);
  private routingService = inject(RoutingService);

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
      return true;
    }
  }
}
