import { Injectable } from "@angular/core";

import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from "@angular/router";
import { AppInfo } from "../../../app.info";
import { SettingsService } from "../../shared/service";
import { AppStorageService } from "../../shared/service/appstorage.service";
import * as fromAnnotation from "../../store/annotation";
import { Store } from "@ngrx/store";
import { afterDefined, navigateTo } from "@octra/utilities";

@Injectable()
export class ReloadFileGuard implements CanActivate {

  constructor(private appStorage: AppStorageService,
              private router: Router,
              private settingsService: SettingsService,
              private store: Store) {
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      if (!this.appStorage.loggedIn) {
        const params = AppInfo.queryParamsHandling;
        params.fragment = route.fragment;
        params.queryParams = route.queryParams;

        navigateTo(this.router, ['/login'], params).catch((error) => {
          console.error(error);
        });
        resolve(false);
      } else {
        afterDefined(this.store.select(fromAnnotation.selectProjectConfig)).then(() => {
          console.log(`reload file guard projectconfig set ok`);
          resolve(true);
        });
      }
    });
  }
}
