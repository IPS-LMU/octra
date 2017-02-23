import { Injectable } from '@angular/core';

import { AudioService, AudioComponentService } from "../../../service";

@Injectable()
export class LoupeService extends AudioComponentService{
	constructor(protected audio:AudioService) {
		super(audio);
	}
}
