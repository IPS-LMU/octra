import { Injectable } from '@angular/core';

@Injectable()
export class LoginService {
	private db_data = [
		{
			user_id: 4,
		}, {
			user_id: 5,
		}, {
			user_id: 6,
		},
		{
			user_id: 7,
		},

		{
			user_id: 8,
		},
		{
			user_id: 9,
		},
		{
			user_id: 10,
		},
		{
			user_id: 11,
		},
		{
			user_id: 12,
		},
		{
			user_id: 14,
		},
		{
			user_id: 16,
		},
		{
			user_id: 20,
		},
		{
			user_id: 23,
		},
		{
			user_id: 25,
		},
		{
			user_id: 31,
		},
		{
			user_id: 33,
		},
		//neu
		{
			user_id: 35,
		},
		{
			user_id: 38,
		},
		{
			user_id: 40,
		},
		//neu
		{
			user_id: 41,
		},
		{
			user_id: 42,
		},
		//neu
		{
			user_id: 44,
		},
		//neu
		{
			user_id: 47,
		},
		{
			user_id: 48,
		},
		{
			user_id: 50,
		},
		{
			user_id: 53,
		},
		{
			user_id: 55,
		},
		//neu
		{
			user_id: 56,
		},
		//test
		{
			user_id: 57,
		},
		{
			user_id:58
		},
		{
			user_id:59
		},
		{
			user_id: 60,
		}
	];

	constructor() {
	}

	public checkLoginData(user_id: number) {
		for (let i = 0; i < this.db_data.length; i++) {
			if (user_id === this.db_data[ i ].user_id)
				return true;
		}
		return false;
	}

}
