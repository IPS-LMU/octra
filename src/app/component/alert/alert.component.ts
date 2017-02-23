import {
	Component,
	OnInit,
	AfterViewInit,
	ViewChild,
	ElementRef,
	animate,
	transition,
	style,
	state,
	trigger,
	ChangeDetectionStrategy,
	ChangeDetectorRef
} from '@angular/core';
import { MessageService } from "../../service/message.service";

@Component({
	selector       : 'app-alert',
	templateUrl    : './alert.component.html',
	styleUrls      : [ './alert.component.css' ],
	animations     : [
		trigger('heroState', [
			state('inactive', style({
				opacity: 0
			})),
			state('active', style({
				opacity: 1
			})),
			transition('active => inactive', animate('300ms ease-out'))
		])
	],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class AlertComponent implements OnInit {
	@ViewChild('alert') alert: ElementRef;

	constructor(private cd: ChangeDetectorRef, private msgService: MessageService) {
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

		setTimeout(()=> {
			this.state = "inactive";
			this.cd.markForCheck();
		}, 3000);
	};
}
