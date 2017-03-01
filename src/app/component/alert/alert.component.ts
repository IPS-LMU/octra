import {
	Component,
	OnInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef
} from '@angular/core';

import { MessageService } from "../../service/message.service";
import { OCTRANIMATIONS } from "../../shared/OCTRAnimations";

@Component({
	selector       : 'app-alert',
	templateUrl    : './alert.component.html',
	styleUrls      : [ './alert.component.css' ],
	animations     : OCTRANIMATIONS,
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class AlertComponent implements OnInit {
	constructor(private cd: ChangeDetectorRef,
				private msgService: MessageService) {
	}

	state: string = "inactive";
	text: string = "";
	type: string = "error";
	show: boolean = false;

	ngOnInit() {
		this.state = "inactive";
		this.show = false;

		this.cd.markForCheck();
		this.msgService.showmessage.subscribe(
			(result) => {
				this.showMessage(result.type, result.message);
			}
		);
	}

	/**
	 * show alert on the right top corner of the screen.
	 * @param type "log", "error" or "info"
	 * @param message Message which should be shown
	 */
	public showMessage = (type: string, message: string) => {
		this.show = true;
		this.state = "active";
		this.type = type;
		this.text = message;
		this.cd.markForCheck();

		setTimeout(() => {
			this.state = "inactive";
			this.cd.markForCheck();
		}, 3000);
	};
}
