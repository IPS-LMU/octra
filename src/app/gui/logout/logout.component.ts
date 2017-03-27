import { Component, OnInit} from '@angular/core';

import { LogoutService } from "../../service/logout.service";

@Component({

	selector: 'app-login',
	templateUrl: './logout.component.html',
	styleUrls: [ './logout.component.css' ],
	providers: [LogoutService]
})
export class LogoutComponent implements OnInit {

	valid = false;

	member = {
		id: "",
		pw: ""
	};

	constructor(private logoutService:LogoutService) {
	}

	ngOnInit() {
		this.logoutService.logout();
	}
}
