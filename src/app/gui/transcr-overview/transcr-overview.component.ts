import {
	Component, SecurityContext, ChangeDetectionStrategy, OnInit, ChangeDetectorRef,
	OnDestroy, ViewChild, AfterViewInit, ElementRef, Input, OnChanges, Output, EventEmitter
} from '@angular/core';
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";

import { TranscriptionService, AudioService } from "../../service";
import { Subscription } from "rxjs";
import { Functions } from "../../shared/Functions";
import { SubscriptionManager } from "../../shared";
import { isNullOrUndefined } from "util";
import { onerror } from "q";
import { Segment } from "../../shared/Segment";
import { Segments } from "../../shared/Segments";

@Component({
	selector   : 'app-transcr-overview',
	templateUrl: './transcr-overview.component.html',
	styleUrls  : [ './transcr-overview.component.css' ]
})
export class TranscrOverviewComponent implements OnInit, OnDestroy, AfterViewInit, OnChanges {

	private errortooltip: any;

	public selectedError: any = "";
	private errorY: number = 0;

	public get numberOfSegments(): number {
		return (this.segments) ? this.segments.length : 0;
	}

	public get transcrSegments(): number {
		return (this.segments) ? this.transcrService.statistic.transcribed : 0;
	}

	public get pauseSegments(): number {
		return (this.segments) ? this.transcrService.statistic.pause : 0;
	}

	public get emptySegments(): number {
		return (this.segments) ? this.transcrService.statistic.empty : 0;
	}

	public get foundErrors(): number {
		let found = 0;

		if (this.shown_segments.length > 0) {
			let result_str = "";
			for (let i = 0; i < this.shown_segments.length; i++) {
				result_str += this.shown_segments[ i ].transcription.html;
			}

			found = (result_str.match(/<div class='error_underline'/g) || []).length;
		}

		return found;
	}

	public shown_segments: any[] = [];
	@Input() segments: Segment[];

	private subscrmanager: SubscriptionManager;
	private updating: boolean = false;
	@Input() public show_transcriptiontable: boolean = true;
	public show_loading: boolean = true;

	@Input("visible") visible: boolean = true;

	@Output("segmentclicked") segmentclicked: EventEmitter<number> = new EventEmitter<number>();

	private updateSegments() {
		if (!this.segments || !this.transcrService.guidelines) return [];

		this.show_loading = true;
		let start_time = 0;
		let result = [];

		for (let i = 0; i < this.segments.length; i++) {
			let segment = this.segments[ i ];

			let obj = {
				start        : start_time,
				end          : segment.time.seconds,
				transcription: {
					text: segment.transcript,
					html: segment.transcript
				},
				validation   : ""
			};

			if (typeof validateAnnotation === "function") {
				obj.transcription.html = this.transcrService.underlineTextRed(obj.transcription.text, validateAnnotation(obj.transcription.text, this.transcrService.guidelines));
			}
			obj.transcription.html = this.transcrService.rawToHTML(obj.transcription.html);

			result.push(obj);

			start_time = segment.time.seconds;
		}

		this.shown_segments = result;
		this.show_loading = false;
	}

	constructor(public transcrService: TranscriptionService,
				public audio: AudioService,
				public sanitizer: DomSanitizer) {

		this.subscrmanager = new SubscriptionManager();
	}

	ngOnDestroy() {
		this.subscrmanager.destroy();
		this.errortooltip.css("display", "none");
	}

	ngOnInit() {
	}

	sanitizeHTML(str: string): SafeHtml {
		return this.sanitizer.bypassSecurityTrustHtml(str);
	}

	onMouseOver($event) {
		let target = jQuery($event.target);
		if (target.is(".error_underline") || target.parent().is(".error_underline")) {

			if (!target.is(".error_underline"))
				target = target.parent();

			let errorcode = target.attr("data-errorcode");

			this.selectedError = this.transcrService.getErrorDetails(errorcode);

			if (this.selectedError != null) {
				this.errortooltip.children(".title").text(this.selectedError.title);
				this.errortooltip.children(".description").text(this.selectedError.description);
				let y = target.offset().top - jQuery(this.errortooltip).height() - 20;
				let x = target.offset().left;
				this.errortooltip.css("margin-top", y + "px");
				this.errortooltip.css("margin-left", x + "px");
				this.errortooltip.fadeIn("fast");
			}
		}
		else {
			this.selectedError = null;
			this.errortooltip.css("display", "none");
		}
	}

	ngAfterViewInit() {
		this.errortooltip = jQuery("<div></div>");
		this.errortooltip.addClass("error-tooltip");
		this.errortooltip.append(jQuery("<div></div>").addClass("title").text("Title"));
		this.errortooltip.append(jQuery("<div></div>")
			.addClass("description").text(""));

		this.errortooltip.on("mouseleave", function () {
			jQuery(this).css("display", "none");
		});
		this.errortooltip.on("mouseout", function () {
			jQuery(this).css("display", "none");
		});

		jQuery("body").append(this.errortooltip);

		this.errortooltip = jQuery(".error-tooltip");

		if (this.visible) {
			this.updateSegments();
		}
	}

	ngOnChanges(event) {
		this.show_loading = true;
		if (!isNullOrUndefined(event.visible) && event.visible.currentValue == true) {
			this.updateSegments();
			this.transcrService.analyse();
		} else if(!isNullOrUndefined(event.visible) && event.visible.currentValue == false){
			jQuery(".error-tooltip").css("display", "none");
		}
	}

	public onSegmentClicked(segnumber: number) {
		this.segmentclicked.emit(segnumber);
	}
}
