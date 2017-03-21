import { Component, OnInit, ViewChild, Input } from '@angular/core';
import { ModalComponent } from "ng2-bs3-modal/components/modal";
import { isNullOrUndefined } from "util";
import { Observable } from "rxjs";
import { TranscriptionService } from "../../service/transcription.service";
import { SubscriptionManager } from "../../shared/SubscriptionManager";

@Component({
	selector   : 'app-transcr-guidelines',
	templateUrl: './transcr-guidelines.component.html',
	styleUrls  : [ './transcr-guidelines.component.css' ]
})
export class TranscrGuidelinesComponent implements OnInit {
	@ViewChild('modal_guidelines') modal_guidelines: ModalComponent;

	@Input() guidelines = null;

	private subscrmanager:SubscriptionManager = new SubscriptionManager();
	private collapsed:any[][] = [];
	private entries:number = 0;

	private counter = 0;

	constructor(
		private transcrService:TranscriptionService
	) {
		this.subscrmanager.add(
			transcrService.guidelinesloaded.subscribe(
				(guidelines)=>{
					this.entries = 0;
					this.guidelines = guidelines;

					for(let i = 0; i < guidelines.instructions.length; i++){
						this.entries += guidelines.instructions[i].entries.length;
					}
					this.unCollapseAll();
					console.log("entries: " + this.entries);
				}
			)
		);
	}

	get visible(): boolean {
		return this.modal_guidelines.visible;
	}

	ngOnInit() {
	}

	public open() {
		this.modal_guidelines.open();
	}

	public close() {
		this.modal_guidelines.dismiss();
	}

	private unCollapseAll(){
		this.collapsed = [];

		for(let i = 0; i < this.guidelines.instructions.length; i++){
			let elem = [];
			for(let j = 0; j < this.guidelines.instructions[i].entries.length; j++){
				elem.push(true);
			}
			this.collapsed.push(elem);
		}
	}

	private toggle(group:number, entry:number){
		this.collapsed[group][entry] = !this.collapsed[group][entry];
	}
}
