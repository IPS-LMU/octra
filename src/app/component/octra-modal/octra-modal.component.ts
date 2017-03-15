import { Component, OnInit, OnDestroy, ViewChild, EventEmitter } from '@angular/core';
import { SubscriptionManager } from "../../shared/SubscriptionManager";
import { ModalComponent } from "ng2-bs3-modal/components/modal";
import { ModalService } from "../../service/modal.service";
import { isNullOrUndefined } from "util";

@Component({
	selector   : 'app-octra-modal',
	templateUrl: './octra-modal.component.html',
	styleUrls  : [ './octra-modal.component.css' ]
})
export class OctraModalComponent implements OnInit, OnDestroy {
	constructor(private modService: ModalService) {
	}

	private subscrmanager: SubscriptionManager;
	@ViewChild("login_invalid") login_invalid: ModalComponent;
	@ViewChild("transcription_delete") transcription_delete: ModalComponent;
	@ViewChild("transcription_stop") transcription_stop: ModalComponent;
	@ViewChild("error") error: ModalComponent;

	private data: any;

	ngOnInit() {
		this.subscrmanager = new SubscriptionManager();


		this.subscrmanager.add(this.modService.showmodal.subscribe(
			(result: any) => {
				this.data = result;

				if (!isNullOrUndefined(result.type)) {
					this[ result.type ].open();
				}
				else throw "modal function not supported";
			}));
	}

	ngOnDestroy() {
		this.subscrmanager.destroy();
	}
}
