import { inject, Injectable } from '@angular/core';

import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { map, Observable } from 'rxjs';
import { AppInfo } from '../../../app.info';
import { RoutingService } from '../../shared/service/routing.service';
import { ApplicationStoreService } from '../../store/application/application-store.service';

@Injectable()
export class ALoginGuard {
  private appStoreService = inject(ApplicationStoreService);
  private routingService = inject(RoutingService);

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
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
      }),
    );
  }
}
