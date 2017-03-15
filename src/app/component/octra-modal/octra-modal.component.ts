import { Component, OnInit, OnDestroy, ViewChild, EventEmitter } from '@angular/core';
import { SubscriptionManager } from "../../shared/SubscriptionManager";
import { ModalComponent } from "ng2-bs3-modal/components/modal";
import { ModalService } from "../../service/modal.service";

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

	private functions:any;

	ngOnInit() {
		this.subscrmanager = new SubscriptionManager();

		this.subscrmanager.add(this.modService.showmodal.subscribe(
			(result: any) => {
				this.functions = result.functions;

				switch(result.type){
					case("login_invalid"):
						this.login_invalid.open();
						break;
					case("transcription_delete"):
						this.transcription_delete.open();
						break;
					case("transcription_stop"):
						this.transcription_stop.open();
						break;
				}
			}));
	}

	ngOnDestroy() {
		this.subscrmanager.destroy();
	}
}
