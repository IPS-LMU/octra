import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  RouterStateSnapshot,
} from '@angular/router';
import { inject } from '@angular/core';
import { ApplicationStoreService } from '../../store/application/application-store.service';
import { map } from 'rxjs';

export const CONFIG_LOADED_GUARD: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const applicationStoreService = inject(ApplicationStoreService);
  return applicationStoreService.appconfig$.pipe(
    map((a) => {
      return a !== undefined;
    })
  );
};
