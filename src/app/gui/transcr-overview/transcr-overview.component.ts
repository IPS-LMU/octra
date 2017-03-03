import {
	Component, SecurityContext, ChangeDetectionStrategy, OnInit, ChangeDetectorRef,
	OnDestroy
} from '@angular/core';
import { DomSanitizer } from "@angular/platform-browser";

import { TranscriptionService, AudioService } from "../../service";
import { Subscription } from "rxjs";
import { Functions } from "../../shared/Functions";
import { SubscriptionManager } from "../../shared";

@Component({
	selector       : 'app-transcr-overview',
	templateUrl    : './transcr-overview.component.html',
	styleUrls      : [ './transcr-overview.component.css' ],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class TranscrOverviewComponent implements OnInit, OnDestroy {
	private get numberOfSegments(): number {
		return (this.transcrService.segments) ? this.transcrService.segments.length : 0;
	}

	private get transcrSegments(): number {
		return (this.transcrService.segments) ? this.transcrService.statistic.transcribed : 0;
	}

	private get pauseSegments(): number {
		return (this.transcrService.segments) ? this.transcrService.statistic.pause : 0;
	}

	private get emptySegments(): number {
		return (this.transcrService.segments) ? this.transcrService.statistic.empty : 0;
	}

	private segments: any[] = [];
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
				transcript: this.transcrService.rawToHTML(segment.transcript),
				validation: ""
			};

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

	constructor(private transcrService: TranscriptionService,
				private audio: AudioService,
				private sanitizer: DomSanitizer,
				private cd: ChangeDetectorRef) {

		this.subscrmanager = new SubscriptionManager();
	}

	ngOnDestroy(){
		this.subscrmanager.destroy();
	}

	ngOnInit() {
		if(this.audio.audiobuffer == null) {
			this.subscrmanager.add(this.audio.afterloaded.subscribe(() => {
				this.subscrmanager.add(this.transcrService.segments.onsegmentchange.subscribe(() => {
					if (!this.updating) {
						this.updating = true;
						setTimeout(() => {
							this.updateSegments();
							this.cd.markForCheck();
							this.updating = false;
						}, 1000);
					}
				}));

				this.updateSegments();
				this.cd.markForCheck();
			}));

			this.updateSegments();
			this.cd.markForCheck();
		} else{

			this.subscrmanager.add(this.transcrService.segments.onsegmentchange.subscribe(() => {
				if (!this.updating) {

					this.updating = true;
					setTimeout(() => {
						this.updateSegments();
						this.cd.markForCheck();
						this.updating = false;
					}, 1000);
				}
			}));
			this.updateSegments();
			this.cd.markForCheck();
		}
	}

	sanitizeHTML(str: string): string {
		return this.sanitizer.sanitize(SecurityContext.HTML, str);
	}
}
