import { Injectable, OnDestroy } from '@angular/core';

import { CanActivate, RouterStateSnapshot, ActivatedRouteSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs/Rx';
import { SessionService } from "../service/session.service";
import { SettingsService } from "../service/settings.service";
import { SubscriptionManager } from "../shared/SubscriptionManager";
import { isNullOrUndefined } from "util";

@Injectable()
export class SettingsGuard implements CanActivate {

	subscrmanager: SubscriptionManager;

	constructor(private sessService: SessionService,
				private router: Router,
				private settingsService: SettingsService) {
		this.subscrmanager = new SubscriptionManager();

	}

	canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable < boolean > | boolean {

		this.subscrmanager.add(this.settingsService.settingsloaded.subscribe((validated) => {
			console.log("validated = " + validated);
		}));

		if(isNullOrUndefined(this.settingsService.app_settings)){
			return this.settingsService.settingsloaded;
		} else{
			console.log(this.settingsService.validated);
			return this.settingsService.validated;
		}
	}
}