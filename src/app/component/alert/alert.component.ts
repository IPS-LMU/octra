import {
	Component,
	OnInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef, OnDestroy
} from '@angular/core';

import { MessageService } from "../../service/message.service";
import { OCTRANIMATIONS } from "../../shared/OCTRAnimations";
import { SubscriptionManager } from "../../shared/SubscriptionManager";

@Component({
	selector       : 'app-alert',
	templateUrl    : './alert.component.html',
	styleUrls      : [ './alert.component.css' ],
	animations     : OCTRANIMATIONS,
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class AlertComponent implements OnInit, OnDestroy {
	constructor(private cd: ChangeDetectorRef,
				private msgService: MessageService) {
		this.subscrmanager = new SubscriptionManager();
	}

	state: string = "inactive";
	text: string = "";
	type: string = "error";
	show: boolean = false;

	private subscrmanager: SubscriptionManager;

	ngOnInit() {
		this.state = "inactive";
		this.show = false;

		this.cd.markForCheck();
		this.subscrmanager.add(this.msgService.showmessage.subscribe(
			(result) => {
				this.showMessage(result.type, result.message);
			}
		));
	}

	ngOnDestroy() {
		this.subscrmanager.destroy();
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
