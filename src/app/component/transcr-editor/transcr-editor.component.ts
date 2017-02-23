import { Component, OnInit, OnDestroy, EventEmitter, Output, ChangeDetectorRef } from '@angular/core';
import { UserInteractionsService } from "../../service/userInteractions.service";
import { TranscrEditorConfig } from "./config/te.config";
import { KeymappingService } from "../../service/keymapping.service";
import { KeyMapping } from "../../shared/KeyMapping";
import { BrowserInfo } from "../../shared/BrowserInfo";
import { Functions } from "../../shared";
import { APP_CONFIG } from "../../app.config";
import { TranscrEditorConfigValidator } from "./validator/TranscrEditorConfigValidator";

@Component({
	selector   : 'app-transcr-editor',
	templateUrl: 'transcr-editor.component.html',
	styleUrls  : [ 'transcr-editor.component.css' ],
	providers  : [ TranscrEditorConfig ]
})

export class TranscrEditorComponent implements OnInit, OnDestroy {
	get is_typing(): boolean {
		return this._is_typing;
	}
	@Output('loaded') loaded: EventEmitter<boolean> = new EventEmitter<boolean>();
	@Output('onkeyup') onkeyup: EventEmitter<any> = new EventEmitter<any>();
	@Output('marker_insert') marker_insert: EventEmitter<string> = new EventEmitter<string>();
	@Output('marker_click') marker_click: EventEmitter<string> = new EventEmitter<string>();
	@Output('typing') typing: EventEmitter<string> = new EventEmitter<string>();

	private _settings:TranscrEditorConfig;

	get rawText(): string {
		return this.tidyUpRaw(this._rawText);
	}

	set rawText(value: string) {
		this._rawText = this.tidyUpRaw(value);
		this.textfield.summernote('code', this.rawToHTML(this._rawText));
	}

	get Settings(): any {
		return this._settings;
	}

	get html(): string {
		return (this.textfield) ? this.textfield.summernote('code') : "";
	}

	set Settings(value: any) {
		this._settings = value;
	}

	constructor(private cd: ChangeDetectorRef) {
		this._settings = new TranscrEditorConfig().Settings;
		this.validateConfig();
	}

	public textfield: any = null;
	private _rawText: string = "";
	private _html: string = "";
	private summernote_ui: any = null;
	private _is_typing:boolean = false;
	private lastkeypress:number = 0;

	ngOnInit() {
		this.Settings.height = 100;
		this.initialize();
	}

	/**
	 * converts the editor's html text to raw text
	 * @returns {string}
	 */
	getRawText = () => {
		let result: string = "";
		var html = this.textfield.summernote('code');
		let wrap = APP_CONFIG.Settings.WRAP;

		html = "<p>" + html + "</p>";
		var dom = jQuery(html);

		let replace_func = (i, elem)=> {
			var attr = jQuery(elem).attr("data-marker-code");
			if (elem.type == "select-one") {
				var value = jQuery(elem).attr("data-value");
				attr += "=" + value;
			}
			if (attr) {
				for (let i = 0; i < this.Settings.markers.length; i++) {
					let marker = this.Settings.markers[ i ];
					if (attr === marker.code) {
						if (marker.use_wrap) jQuery(elem).replaceWith(wrap.charAt(0) + attr + wrap.charAt(1));
						else jQuery(elem).replaceWith(attr);
						break;
					}
				}
			}
			else {
				jQuery(elem).remove();
			}
		};

		jQuery.each(dom.children(), replace_func);
		result = dom.text();
		result = this.tidyUpRaw(result);

		return result;
	};

	ngOnDestroy() {
		this.destroy();
	}

	public update() {
		this.destroy();
		this.initialize();
		this.cd.detectChanges();
	}

	/**
	 * destroys the summernote editor
	 */
	private destroy() {
		this.textfield.summernote('destroy');
		//delete tooltip overlays
		jQuery(".tooltip").remove();
	}

	/**
	 * initializes the editor and the containing summernote editor
	 */
	public initialize() {
		this.summernote_ui = jQuery.summernote.ui;
		let Navigation = this.initNavigation();

		this.textfield = jQuery(".textfield");
		this.textfield.summernote({
			height             : this.Settings.height,
			focus              : true,
			disableDragAndDrop : true,
			disableResizeEditor: true,
			disableResizeImage : true,
			popover            : [],
			airPopover         : [],
			toolbar            : [
				[ 'mybutton', Navigation.str_array ]
			],
			shortcuts          : false,
			buttons            : Navigation.buttons,
			callbacks          : {
				onKeydown: this.onKeyDownSummernote,
				onKeyup  : this.onKeyUpSummernote,
				onPaste  : function (e) {
					//prevent copy paste
					e.preventDefault();
				}
			}
		});

		this.textfield.summernote('removeModule', 'statusbar');

		jQuery(".note-btn-group").find(".note-btn").on("click", function () {
			jQuery(".tooltip").remove();
		});

		this.focus();
		this.loaded.emit(true);
	}

	/**
	 * initializes the navigation bar of the editor
	 */
	initNavigation() {
		let result = {
			buttons  : {},
			str_array: []
		};
		for (let i = 0; i < this.Settings.markers.length; i++) {
			let marker = this.Settings.markers[ i ];
			result.buttons[ marker.code ] = this.createButton(marker);
			result.str_array.push(marker.code);
		}

		return result;
	}

	/**
	 * creates a marker button for the toolbar
	 * @param marker
	 * @returns {any}
	 */
	createButton(marker): any {
		let platform = BrowserInfo.platform;
		let wrap = APP_CONFIG.Settings.WRAP;
		let icon = "<img src='" + marker.icon_url + "' class='btn-icon' /> <span class='btn-description'>" + marker.button_text + "</span><span class='btn-shortcut'> [" + marker.shortcut[ platform ] + "]</span>";
		if(this.Settings.responsive){
			icon = "<img src='" + marker.icon_url + "' class='btn-icon' /> <span class='btn-description hidden-xs hidden-sm'>" + marker.button_text + "</span><span class='btn-shortcut hidden-xs hidden-sm hidden-md'> [" + marker.shortcut[ platform ] + "]</span>";
		}
		// create button
		let button = this.summernote_ui.button({
			contents: icon,
			tooltip : marker.description + " Shortcut: " + wrap.charAt(0) + marker.shortcut[ platform ] + wrap.charAt(1),
			click   : () => {
				// invoke insertText method with 'hello' on editor module.
				this.insertMarker(marker.code, marker.icon_url);
				this.marker_click.emit(marker.code);
			}
		});
		return button.render();   // return button as jquery object
	}

	/**
	 * inserts a marker to the editors html
	 * @param marker_code
	 * @param icon_url
	 */
	insertMarker = function (marker_code, icon_url) {
		let element = document.createElement("img");
		element.setAttribute("src", icon_url);
		element.setAttribute("class", "btn-icon-text");
		element.setAttribute("style", "height:16px");
		element.setAttribute("data-marker-code", marker_code);

		this.textfield.summernote('editor.insertNode', element);
		this.updateTextField();
	};

	/**
	 * called when key pressed in editor
	 * @param $event
	 */
	onKeyDownSummernote = ($event) => {
		let comboKey = KeyMapping.getShortcutCombination($event);
		let platform = BrowserInfo.platform;

		if (comboKey != "") {
			if (this.isDisabledKey(comboKey))
				$event.preventDefault();
			else {
				for (let i = 0; i < this.Settings.markers.length; i++) {
					let marker: any = this.Settings.markers[ i ];
					if (marker.shortcut[ platform ] == comboKey) {
						$event.preventDefault();
						this.insertMarker(marker.code, marker.icon_url);
						this.marker_insert.emit(marker.code);
						return;
					}
				}
			}
		}

		this.lastkeypress = Date.now();
	};

	/**
	 * called after key up in editor
	 * @param $event
	 */
	onKeyUpSummernote = ($event) => {
		//update rawText
		this.updateTextField();
		this.onkeyup.emit($event);

		setTimeout(()=>{
			if(Date.now() - this.lastkeypress < 500){
				if(!this._is_typing){
					this.typing.emit("started");
				}
				this._is_typing = true;
			} else{
				if(this._is_typing){
					this.typing.emit("stopped");
				}
				this._is_typing = false;
			}
		}, 500);
	};

	/**
	 * updates the raw text of the editor
	 */
	updateTextField() {
		this._rawText = this.getRawText();
	}

	/**
	 * checks if the combokey is part of the configs disabledkeys
	 * @param comboKey
	 * @returns {boolean}
	 */
	private isDisabledKey(comboKey: string): boolean {
		for (let i = 0; i < this.Settings.disabled_keys.length; i++) {
			if (this.Settings.disabled_keys[ i ] === comboKey) {
				return true;
			}
		}
		return false;
	}

	/**
	 * adds the comboKey to the list of disabled Keys
	 * @param comboKey
	 * @returns {boolean}
	 */
	public addDisableKey(comboKey: string): boolean {
		for (let i = 0; i < this.Settings.disabled_keys.length; i++) {
			if (this.Settings.disabled_keys[ i ] === comboKey) {
				return false;
			}
		}
		this.Settings.disabled_keys.push(comboKey);
		return true;
	}

	/**
	 * removes the combokey of list of disabled keys
	 * @param comboKey
	 * @returns {boolean}
	 */
	public removeDisableKey(comboKey: string): boolean {
		let j = -1;
		for (let i = 0; i < this.Settings.disabled_keys.length; i++) {
			if (this.Settings.disabled_keys[ i ] === comboKey) {
				j = i;
				return true;
			}
		}
		this.Settings.disabled_keys.splice(j, 1);

		return (j > -1) ? true : false;
	}

	/**
	 * converts raw text of markers to html
	 * @param rawtext
	 * @returns {string}
	 */
	private rawToHTML(rawtext: string): string {
		let result: string = rawtext;
		let wrap = APP_CONFIG.Settings.WRAP;

		if (APP_CONFIG.Settings.WRAP !== "" && APP_CONFIG.Settings.WRAP.length == 2) {
			//replace markers with wrap
			result = this.replaceMarkersWithHTML(result, true);
		}
		//replace markers with no wrap
		for (let i = 0; i < this.Settings.markers.length; i++) {
			let marker = this.Settings.markers[ i ];
			if (!marker.use_wrap) {
				let regex = new RegExp("(\\s)*(" + Functions.escapeRegex(marker.code) + ")(\\s)*", "g");

				let replace_func = (x, g1, g2, g3)=> {
					let s1 = (g1) ? g1 : "";
					let s2 = (g2) ? g2 : "";
					let s3 = (g3) ? g3 : "";
					return s1 + "<img src='" + marker.icon_url + "' class='btn-icon-text' style='height:16px;' data-marker-code='" + marker.code + "'/>" + s3;
				};

				result = result.replace(regex, replace_func);
			}
		}

		result = result.replace(/\s+$/g, "&nbsp;");
		result = (result !== "") ? "<p>" + result + "</p>" : "";

		return result;
	}

	/**
	 * set focus to the very last position of the editors text
	 */
	public focus() {
		setTimeout(()=> {
			if (this.rawText != "")
				Functions.placeAtEnd(jQuery('.note-editable.panel-body')[ 0 ]);
			this.textfield.summernote('focus');
		}, 500);
	}

	/**
	 * tidy up the raw text, remove white spaces etc.
	 * @param raw
	 * @returns {string}
	 */
	private tidyUpRaw(raw: string) {
		let result: string = raw;

		result = result.replace(/\[[~^a-z0-9]+\]/g, function (x) {
			return " " + x + " ";
		});
		//set whitespaces before *
		result = result.replace(/(\w|ä|ü|ö|ß|Ü|Ö|Ä)\*(\w|ä|ü|ö|ß|Ü|Ö|Ä)/g, "$1 *$2");
		//set whitespaces before and after **
		result = result.replace(/(\*\*)|(\s\*\*)|(\*\*\s)/g, " ** ");

		//replace all remaining tags
		result = result.replace(/[<>]+/g, "");
		//replace all numbers of whitespaces to one
		result = result.replace(/\s+/g, " ");
		//replace whitespaces at start an end
		result = result.replace(/^\s+/g, "");
		result = result.replace(/\s$/g, "");
		return result;
	}

	/**
	 * replace markers of the input string with its html pojection
	 * @param input
	 * @param use_wrap
	 * @returns {string}
	 */
	private replaceMarkersWithHTML(input: string, use_wrap: boolean): string {
		let result = input;
		let regex_str;
		if (use_wrap) {
			regex_str = Functions.escapeRegex(APP_CONFIG.Settings.WRAP.charAt(0)) + "([\\w~.^*-+]+)" + Functions.escapeRegex(APP_CONFIG.Settings.WRAP.charAt(1));
		}
		else {
			regex_str = "([\\w~.^*-+]+)";
		}
		let regex = new RegExp(regex_str, "g");

		let replace_func = (x, g1)=> {
			for (let i = 0; i < this.Settings.markers.length; i++) {
				let marker = this.Settings.markers[ i ];
				if (marker.code === g1 && marker.use_wrap == use_wrap) {
					return "<img src='" + marker.icon_url + "' class='btn-icon-text' style='height:16px;' data-marker-code='" + marker.code + "'/>";
				}
			}
			return (use_wrap) ? "[MARKER NOT FOUND]" : g1;
		};

		result = result.replace(regex, replace_func);

		return result;
	}

	private validateConfig() {
		let validator: TranscrEditorConfigValidator = new TranscrEditorConfigValidator();
		let validation = validator.validateObject(this._settings);
		if (!validation.success)
			throw validation.error;

	}
}