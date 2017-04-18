import { Injectable, OnDestroy } from '@angular/core';

import { CanActivate, RouterStateSnapshot, ActivatedRouteSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs/Rx';
import { SessionService } from "../service/session.service";
import { SettingsService } from "../service/settings.service";

@Injectable()
export class ALoginGuard implements CanActivate{

	constructor(private sessService: SessionService, private router: Router) {

	}

	canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable < boolean > | boolean {
		if (this.sessService.LoggedIn == true) {
			console.log("go to transcr from login");
			this.router.navigate([ '/user/transcr' ]);
			return false;
		}
		return true;
	}
}