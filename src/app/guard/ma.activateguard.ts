import { Injectable } from '@angular/core';

import { CanActivate, RouterStateSnapshot, ActivatedRouteSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs/Rx';
import { SessionService } from "../service/session.service";

@Injectable()
export class MembersAreaGuard implements CanActivate {

	constructor(private sessService: SessionService, private router: Router) {

	}

	canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {

		if (this.sessService.LoggedIn != true) {
			console.log("not logged in");
			this.router.navigate([ '/login' ]);
			return false;
		} else if(this.sessService.offline == true){
			if(this.sessService.file == null){
				//navigate to reload-file
				console.log("go to reload-file from ma active");
				this.router.navigate([ '/user/transcr/reload-file' ]);
				return false;
			}
		}
		else if (this.sessService.submitted) {
			console.log("go to submitted page from ma active");
			this.router.navigate([ '/user/transcr/submitted' ]);
			return false;
		}
		return true;
	}
}