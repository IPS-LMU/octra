import {
	Component, SecurityContext, ChangeDetectionStrategy, OnInit, ChangeDetectorRef,
	OnDestroy
} from '@angular/core';
import { DomSanitizer } from "@angular/platform-browser";

import { TranscriptionService, AudioService } from "../../service";
import { Subscription } from "rxjs";
import { Functions } from "../../shared/Functions";
import { SubscriptionManager } from "../../shared";
import { isNullOrUndefined } from "util";

@Component({
	selector       : 'app-transcr-overview',
	templateUrl    : './transcr-overview.component.html',
	styleUrls      : [ './transcr-overview.component.css' ],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class TranscrOverviewComponent implements OnInit, OnDestroy {
	public get numberOfSegments(): number {
		return (this.transcrService.segments) ? this.transcrService.segments.length : 0;
	}

	public get transcrSegments(): number {
		return (this.transcrService.segments) ? this.transcrService.statistic.transcribed : 0;
	}

	public get pauseSegments(): number {
		return (this.transcrService.segments) ? this.transcrService.statistic.pause : 0;
	}

	public get emptySegments(): number {
		return (this.transcrService.segments) ? this.transcrService.statistic.empty : 0;
	}

	public segments: any[] = [];
	private subscrmanager: SubscriptionManager;
	private updating: boolean = false;

	private updateSegments() {
		if (!this.transcrService.segments) return [];

		let start_time = 0;
		let result = [];
		for (let i = 0; i < this.transcrService.segments.length; i++) {
			let segment = this.transcrService.segments.get(i);

			let obj = {
				start     : start_time,
				end       : segment.time.seconds,
				transcript: segment.transcript,
				validation: ""
			};

			if (typeof validateAnnotation === "function") {
				obj.transcript = this.transcrService.underlineTextRed(obj.transcript, validateAnnotation(obj.transcript));
			}
			obj.transcript = this.transcrService.rawToHTML(obj.transcript);

			let validation = this.transcrService.validateTranscription(segment.transcript);

			for (let i = 0; i < validation.length; i++) {
				obj.validation += validation[ i ];
				if (i < validation.length - 1)
					obj.validation += "<br/>";
			}

			result.push(obj);

			start_time = segment.time.seconds;
		}

		this.segments = result;
	}

	constructor(public transcrService: TranscriptionService,
				public audio: AudioService,
				public sanitizer: DomSanitizer,
				public cd: ChangeDetectorRef) {

		this.subscrmanager = new SubscriptionManager();
	}

	ngOnDestroy() {
		this.subscrmanager.destroy();
	}

	ngOnInit() {
		if (this.audio.audiobuffer == null) {
			this.subscrmanager.add(this.audio.afterloaded.subscribe(() => {
				this.subscrmanager.add(this.transcrService.segments.onsegmentchange.subscribe(() => {

					if (!this.updating) {
						this.updating = true;
						setTimeout(() => {
							console.log("ok3");
							this.updateSegments();
							this.cd.markForCheck();
							this.updating = false;
						}, 1000);
					}
				}));

				this.updateSegments();
				this.cd.markForCheck();
			}));
			console.log("ok1");
			this.updateSegments();
			this.cd.markForCheck();
		}
		else {

			this.subscrmanager.add(this.transcrService.segments.onsegmentchange.subscribe(() => {
				if (!this.updating) {

					this.updating = true;
					setTimeout(() => {
						console.log("ok4");
						this.updateSegments();
						this.cd.markForCheck();
						this.updating = false;
					}, 1000);
				}
			}));
			console.log("ok2");
			this.updateSegments();
			this.cd.markForCheck();
		}

		this.subscrmanager.add(this.transcrService.validationmethodloaded.subscribe(() => {
			setTimeout(()=>{
				this.updateSegments();
				this.cd.markForCheck();
			}, 1000);
		}));
	}

	sanitizeHTML(str: string): string {
		return this.sanitizer.sanitize(SecurityContext.HTML, str);
	}
}
