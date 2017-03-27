import {
	Component, OnInit, Output, AfterViewInit, ViewChild, OnDestroy, ChangeDetectionStrategy,
	ChangeDetectorRef
} from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';

import { SessionService } from "../../service/session.service";
import { UserInteractionsService } from "../../service/userInteractions.service";
import { AudioService } from "../../service/audio.service";
import { TranscriptionService } from "../../service/transcription.service";
import { ModalComponent } from 'ng2-bs3-modal/ng2-bs3-modal';
import { Observable, Subscription } from "rxjs";
import { ComponentCanDeactivate } from "../../guard/login.deactivateguard";
import { APIService } from "../../service/api.service";
import { Functions } from "../../shared/Functions";
import { NavbarService } from "../../service/navbar.service";
import { SubscriptionManager } from "../../shared";


@Component({
	selector       : 'app-transcription-submit',
	templateUrl    : './transcription-submit.component.html',
	styleUrls      : [ './transcription-submit.component.css' ],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class TranscriptionSubmitComponent implements OnInit, ComponentCanDeactivate, OnDestroy, AfterViewInit {

	@ViewChild('modal') modal: ModalComponent;
	@ViewChild('modal2') modal2: ModalComponent;

	constructor(private sessService: SessionService,
				private router: Router,
				private transcrService: TranscriptionService,
				private api: APIService,
				private cd: ChangeDetectorRef,
				private sanitizer: DomSanitizer,
				private navbarServ: NavbarService) {

		this.subscrmanager = new SubscriptionManager();
	}

	private feedback_data = {
		quality_speaker: "",
		quality_audio  : "",
		comment        : ""
	};

	private send_ok = false;
	private send_error: string = "";
	private subscrmanager: SubscriptionManager;

	ngOnInit() {
		if (!this.transcrService.segments && this.sessService.SampleRate) {
			this.transcrService.loadSegments(this.sessService.SampleRate);
		}
		this.transcrService.analyse();
		this.feedback_data = this.sessService.feedback;

		//set change detection interval
		setInterval(() => {
			this.cd.markForCheck();
		}, 800);
		this.navbarServ.show_hidden = false;
	}

	canDeactivate(): Observable<boolean> | boolean {
		return this.send_ok;
	}

	abort() {
		this.router.navigate([ '/logout' ]);
	}

	private back() {
		this.feedback_data.comment = this.feedback_data.comment.replace(/(<)|(\/>)|(>)/g, "\s");
		this.sessService.save("feedback", this.feedback_data);
		this.router.navigate([ '/user/transcr' ]);
	}

	onSubmit(form: NgForm) {
		this.feedback_data.comment = this.feedback_data.comment.replace(/(<)|(\/>)|(>)/g, "\s");
		this.sessService.save("feedback", this.feedback_data);
		this.modal.open();
	}

	onSendNowClick() {
		this.modal.dismiss();
		this.modal2.open();
		this.send_ok = true;

		let json: any = this.transcrService.exportDataToJSON();
		let member_id: number = Number(this.sessService.member_id);

		this.subscrmanager.add(this.api.saveSession(json.transcript, json.project, json.annotator, member_id, json.id, json.status, json.comment, json.quality, json.log)
			.catch(this.onSendError)
			.subscribe((result) => {
					if (result != null && result.hasOwnProperty("statusText") && result.statusText === "OK") {
						this.sessService.submitted = true;
						this.modal2.close();
						setTimeout(() => {
							this.router.navigate([ '/user/transcr/submitted' ])
						}, 1000);
					}
					else {
						this.send_error = "Es ist ein Fehler aufgetreten. Lade diese Seite mit deinem Browser noch einmal und versuche es erneut";
					}
				}
			));
	}

	ngAfterViewInit() {
		jQuery.material.init();
	}

	onSendError = (error) => {
		this.send_error = error.message;
		return Observable.throw(error);
	};

	ngOnDestroy() {
		this.subscrmanager.destroy();
	}


	getURI(format: string): string {
		let result: string = "";

		switch (format) {
			case("text"):
				result += "data:text/plain;charset=UTF-8,";
				result += encodeURIComponent(this.transcrService.getTranscriptString("text"));
				break;
			case("annotJSON"):
				result += "data:application/json;charset=UTF-8,";
				result += encodeURIComponent(this.transcrService.getTranscriptString("annotJSON"));
				break;
		}

		return result;
	}

	sanitize(url: string) {
		return this.sanitizer.bypassSecurityTrustUrl(url);
	}
}
