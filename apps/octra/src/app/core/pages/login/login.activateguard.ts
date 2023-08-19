import { Injectable } from '@angular/core';

import {
  ActivatedRouteSnapshot,
  CanActivate,
  RouterStateSnapshot,
} from '@angular/router';
import { map, Observable } from 'rxjs';
import { AppInfo } from '../../../app.info';
import { ApplicationStoreService } from '../../store/application/application-store.service';
import { RoutingService } from '../../shared/service/routing.service';

@Injectable()
export class ALoginGuard implements CanActivate {
  constructor(
    private appStoreService: ApplicationStoreService,
    private routingService: RoutingService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | boolean {
    return this.appStoreService.loggedIn$.pipe(
      map((a) => {
        if (a) {
          const params = AppInfo.queryParamsHandling;
          params.fragment = route.fragment!;
          params.queryParams = route.queryParams;

          this.routingService
            .navigate('login guard', ['/intern/transcr'], params)
            .catch((error) => {
              console.error(error);
            });
          return false;
        } else {
        }
        return true;
      })
    );
  }
}
