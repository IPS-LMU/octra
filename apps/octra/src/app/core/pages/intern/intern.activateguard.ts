import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { navigateTo } from '@octra/ngx-utilities';
import { AppInfo } from '../../../app.info';
import { AppStorageService } from '../../shared/service/appstorage.service';

export const AUTHENTICATED_GUARD: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const appStorage = inject(AppStorageService);
  const router = inject(Router);

  if (!appStorage.loggedIn) {
    const params = AppInfo.queryParamsHandling;
    params.fragment = route.fragment!;
    params.queryParams = route.queryParams;

    navigateTo(router, ['/login'], params).catch((error) => {
      console.error(error);
    });
    return false;
  }
  return true;
};
