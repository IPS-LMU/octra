import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  RouterStateSnapshot,
} from '@angular/router';
import { inject } from '@angular/core';
import { ApplicationStoreService } from '../../store/application/application-store.service';
import { map } from 'rxjs';

export const IDB_LOADED_GUARD: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const appStorage = inject(ApplicationStoreService);
  return appStorage.idb$.pipe(
    map((a) => {
      return a.loaded;
    })
  );
};
