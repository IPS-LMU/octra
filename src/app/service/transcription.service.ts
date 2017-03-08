import { Injectable, EventEmitter } from '@angular/core';
import 'rxjs/Rx';
import { Segments } from "../shared/Segments";
import { AudioService } from "./audio.service";
import { SessionService } from "./session.service";
import { Subscription } from "rxjs";
import { Functions } from "../shared/Functions";
import { UserInteractionsService } from "./userInteractions.service";
import { StatisticElem } from "../shared/StatisticElement";
import { MouseStatisticElem } from "../shared/MouseStatisticElem";
import { KeyStatisticElem } from "../shared/KeyStatisticElem";
import { Logger } from "../shared/Logger";
import { NavbarService } from "./navbar.service";
import { TextConverter } from "../shared/Converters/TextConverter";
import { FileService } from "./file.service";
import { AnnotJSONConverter } from "../shared/Converters/AnnotJSONConverter";
import { SubscriptionManager } from "../shared";
import { SettingsService } from "./settings.service";


@Injectable()
export class TranscriptionService {
	get last_sample(): number {
		return this._last_sample;
	}

	set last_sample(value: number) {
		this._last_sample = value;
	}

	get segments(): Segments {

		return this._segments;
	}

	set segments(value: Segments) {
		this._segments = value;
	}

	private get app_settings(): any {
		return this.settingsService.app_settings;
	}

	private subscrmanager: SubscriptionManager;

	public onaudioloaded = new EventEmitter<any>();
	public dataloaded = new EventEmitter<any>();
	private _segments: Segments;
	private _last_sample: number;
	private saving: boolean = false;

	public filename: string = "";

	private feedback: any = {
		quality_speaker: "",
		quality_audio  : "",
		comment        : ""
	};

	get statistic(): any {
		return this._statistic;
	}

	private _selectedSegment: any = null;
	private state: string = "ANNOTATED";

	get selectedSegment(): any {
		return this._selectedSegment;
	}

	set selectedSegment(value: any) {
		this._selectedSegment = value;
	}

	private _statistic: any = {
		transcribed: 0,
		empty      : 0,
		pause      : 0
	};

	constructor(private audio: AudioService,
				private sessServ: SessionService,
				private uiService: UserInteractionsService,
				private navbarServ: NavbarService,
				private settingsService: SettingsService) {
		this.subscrmanager = new SubscriptionManager();

		if (this.app_settings.octra.logging) {
			this.subscrmanager.add(this.audio.statechange.subscribe((state) => {
				this.uiService.addElementFromEvent("audio_" + state, { value: state }, Date.now(), "audio");
			}));
		}

		this.subscrmanager.add(this.navbarServ.onexportbuttonclick.subscribe((button) => {
			let result = {};

			if (button.format == "text") {
				//format to text file
				this.navbarServ.exportformats.text = this.getTranscriptString(button.format);
			}
			else if (button.format == "annotJSON") {
				//format to annotJSON file
				this.navbarServ.exportformats.annotJSON = this.getTranscriptString(button.format);
			}
			this.navbarServ.exportformats.filename = this.filename;
		}));
	}

	public getTranscriptString(format: string): string {
		let result: string = "";

		let data = this.exportDataToJSON();
		if (format == "text") {
			//format to text file
			let tc: TextConverter = new TextConverter();
			result = tc.convert(data);
		}
		else if (format == "annotJSON") {
			//format to text file
			let ac: AnnotJSONConverter = new AnnotJSONConverter();
			result = ac.convert(data);
			result = JSON.stringify(result, null, 4);
		}

		return result;
	}

	public resetSegments(sample_rate: number) {
		this.sessServ.transcription = [];
		this.segments = new Segments(sample_rate, this.sessServ.transcription, this._last_sample);
	}

	public loadSegments(sample_rate: number) {
		if (!this.sessServ.transcription) {
			this.sessServ.transcription = [];
		}

		this.segments = new Segments(sample_rate, this.sessServ.transcription, this._last_sample);

		if (!this.sessServ.feedback) {
			this.sessServ.feedback = {
				quality_speaker: "",
				quality_audio  : "",
				comment        : ""
			};
		}

		this.feedback = this.sessServ.feedback;

		if (this.sessServ.logs == null) {
			this.sessServ.logs = [];
			this.uiService.elements = [];
		}
		else
			this.uiService.fromAnyArray(this.sessServ.logs);


		this.analyse();
		this.dataloaded.emit();
	}

	public exportDataToJSON(): any {
		let data: any = {};
		if (this.segments) {
			let log_data: any[] = this.extractUI(this.uiService.elements);

			data = {
				project   : "transcription",
				annotator : "",
				transcript: null,
				comment   : this.feedback.comment,
				status    : this.state,
				quality   : {
					quality_audio  : this.feedback.quality_audio,
					quality_speaker: this.feedback.quality_speaker
				},
				id        : this.sessServ.data_id,
				log       : log_data
			};

			let transcript: any[] = [];

			for (let i = 0; i < this.segments.length; i++) {
				let segment = this.segments.get(i);

				let last_bound = 0;
				if (i > 0) {
					last_bound = this.segments.get(i - 1).time.samples;
				}

				let segment_json: any = {
					start : last_bound,
					length: segment.time.samples - last_bound,
					text  : segment.transcript
				};

				transcript.push(segment_json);
			}

			data.transcript = transcript;
		}
		return data;
	}

	public loadAudioFile() {
		if (this.audio.audiocontext) {
			if (this.sessServ.offline != true) {
				let src = this.app_settings.audio_server.url + this.sessServ.audio_url;
				//extract filename
				this.filename = this.sessServ.audio_url.substr(this.sessServ.audio_url.lastIndexOf("/") + 1);
				this.filename = this.filename.substr(0, this.filename.lastIndexOf(".") - 1);

				this.subscrmanager.add(this.audio.afterloaded.subscribe((result) => {
					this.last_sample = this.audio.duration.samples;
					this.loadSegments(this.audio.samplerate);

					this.subscrmanager.add(this.segments.onsegmentchange.subscribe(this.saveSegments));

					this.onaudioloaded.emit(result);
				}));

				this.audio.loadAudio(src);
			}
			else {
				//offline mode
				this.filename = this.sessServ.file.name;
				this.filename = this.filename.substr(0, this.filename.lastIndexOf(".") - 1);

				this.subscrmanager.add(this.audio.afterloaded.subscribe((result) => {
					this.last_sample = this.audio.duration.samples;
					this.loadSegments(this.audio.samplerate);

					this.subscrmanager.add(this.segments.onsegmentchange.subscribe(this.saveSegments));

					this.onaudioloaded.emit(result);
				}));

				//read file
				let reader = new FileReader();

				reader.onload = ((theFile) => {
					return function (e) {
						// Render thumbnail.
					};
				})(this.sessServ.sessionfile);

				reader.onloadend = (ev) => {
					let t: any = ev.target;

					this.sessServ.offline = true;

					this.audio.decodeAudio(t.result);
				};

				if (this.sessServ.file != null) {
					//file not loaded. Load again!
					reader.readAsArrayBuffer(this.sessServ.file);
				}
			}
		}
	}

	public saveSegments = () => {
		let temp: any[] = [];

		//make sure, that no saving overhead exist. After saving request wait 1 second
		if (!this.saving) {
			this.saving = true;
			setTimeout(() => {
				for (let i = 0; i < this._segments.length; i++) {
					let seg = this._segments.get(i);
					temp.push(seg.toAny());
				}
				this.sessServ.save('transcription', temp);
				this.saving = false;
			}, 2000);
		}
	};

	public destroy() {
		this.subscrmanager.destroy();
	}

	private extractUI(ui_elements: StatisticElem[]): any[] {
		let result: any[] = [];

		if (ui_elements) {
			for (let i = 0; i < ui_elements.length; i++) {
				let elem = ui_elements[ i ];

				let new_elem = {
					timestamp : elem.timestamp,
					message   : "", //not implemented
					type      : elem.type,
					targetname: elem.target_name,
					value     : ""
				};

				if (elem instanceof MouseStatisticElem) {
					new_elem.value = elem.value;
				}
				else if (elem instanceof KeyStatisticElem) {
					new_elem.value = elem.char;
				}
				else {
					new_elem.value = elem.value
				}

				if (new_elem.value == null) {
					new_elem.value = "no obj";
					console.log(elem);
				}

				result.push(new_elem);
			}
		}

		return result;
	}

	public analyse() {
		this._statistic = {
			transcribed: 0,
			empty      : 0,
			pause      : 0
		};

		for (let i = 0; i < this.segments.length; i++) {
			let segment = this.segments.get(i);

			if (segment.transcript != "") {
				if (segment.transcript == "P") {
					this._statistic.pause++;
				}
				else {
					this._statistic.transcribed++;
				}
			}
			else {
				this._statistic.empty++;
			}
		}
	}

	public rawToHTML(rawtext: string): string {
		let result: string = rawtext;

		//replace markers with wrap
		result = this.replaceMarkersWithHTML(result);

		//replace markers with no wrap
		//TODO optimize as in replaceMarkersWithHTML function
		let markers = this.settingsService.markers.items;
		for (let i = 0; i < markers.length; i++) {
			let marker = markers[ i ];
			let regex = new RegExp("(\\s)*(" + Functions.escapeRegex(marker.code) + ")(\\s)*", "g");

			let replace_func = (x, g1, g2, g3) => {
				let s1 = (g1) ? g1 : "";
				let s2 = (g2) ? g2 : "";
				let s3 = (g3) ? g3 : "";
				return s1 + "<img src='" + marker.icon_url + "' class='btn-icon-text' style='height:16px;' data-marker-code='" + marker.code + "'/>" + s3;
			};

			result = result.replace(regex, replace_func);
		}

		return result;
	}

	private replaceMarkersWithHTML(input: string): string {
		let result = input;

		let markers = this.settingsService.markers.items;

		//because it's faster to concatenate the codes of markers:
		let regex_str = "";
		for (let i = 0; i < markers.length; i++) {
			regex_str += "(" + Functions.escapeRegex(markers[ i ].code) + ")";
			if (i < markers.length - 1)
				regex_str += "|";
		}

		let regex = new RegExp(regex_str, "g");
		let replace_func = (x, g1) => {
			for (let i = 0; i < markers.length; i++) {
				let marker = markers[ i ];
				if (marker.code === x) {
					return "<img src='" + marker.icon_url + "' class='btn-icon-text' style='height:16px;' data-marker-code='" + Functions.escapeHtml(marker.code) + "'/>";
				}
			}

			return g1;
		};

		result = result.replace(regex, replace_func);

		return result;
	}

	public validateTranscription(transcript: string): string[] {
		let result = [];
		//check for special letters
		let has_special_chars = (transcript.match(new RegExp("[#%,.?!`´/;^°]", "g")) != null);
		let has_digits = (transcript.match(new RegExp("[0-9]", "g")) != null);

		if (has_special_chars)
			result.push("- Spezielle Zeichen wie #%,.?!`´/:;^°");
		if (has_digits)
			result.push("- Ziffern vorhanden");

		return result;
	}
}
