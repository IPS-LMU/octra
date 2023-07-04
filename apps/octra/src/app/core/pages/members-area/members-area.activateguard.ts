import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { inject } from '@angular/core';
import { AppStorageService } from '../../shared/service/appstorage.service';
import { AppInfo } from '../../../app.info';
import { navigateTo } from '@octra/ngx-utilities';

export const MEMBER_AREA_GUARD: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const appStorage = inject(AppStorageService);
  const router = inject(Router);

  if (appStorage.loggedIn !== true) {
    console.log(`members area logged in false`);
    const params = AppInfo.queryParamsHandling;
    params.fragment = route.fragment;
    params.queryParams = route.queryParams;

    navigateTo(router, ['/login'], params).catch((error) => {
      console.error(error);
    });
    return false;
  }
  console.log(`members area logged in true`);

  return true;
};
