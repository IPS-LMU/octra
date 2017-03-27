import { Injectable, EventEmitter } from '@angular/core';
import { KeyMapping } from "../shared/KeyMapping";
import { BrowserInfo } from "../shared/BrowserInfo";

@Injectable()
export class KeymappingService {
	get onkeydown(): EventEmitter<any> {
		return this._onkeydown;
	}
	get onkeyup(): EventEmitter<any> {
		return this._onkeyup;
	}

	private shortcuts:any[] = [];

	private _onkeydown:EventEmitter<any>;
	private _onkeyup:EventEmitter<any>;

	constructor() {
		this._onkeydown = new EventEmitter<any>();
		window.onkeydown = this.onKeyDown;

		this._onkeyup = new EventEmitter<any>();
		window.onkeyup = this.onKeyUp;
	}

	private onKeyDown = ($event) => {
		let combo = KeyMapping.getShortcutCombination($event);
		this._onkeydown.emit({comboKey: combo, event:$event});
	};

	private onKeyUp = ($event) => {
		let combo = KeyMapping.getShortcutCombination($event);
		this._onkeyup.emit({comboKey: combo, event:$event});
	};


	public getEntryList(name:string):Entry[] {
		let list = this.getShortcuts(name);

		if(list) {
			let i = 0;
			for (var entry in list) {
				i++;
			}

			if (i > 0) {
				let result: Entry[] = [];

				for (var entry in list) {
					let val = list[ entry ];
					result.push(new Entry(entry, val));
				}

				return result;
			}
		}
		return null;
	}

	private cloneShortcuts(shortcuts:any):any {
		let result:any = {};
		for (let elem in shortcuts) {
			result[ "" + elem + "" ] = {
				keys: {
					mac: shortcuts[ elem ].keys.mac,
					pc: shortcuts[ elem ].keys.pc
				},
				title: shortcuts[ elem ].title,
				focusonly: shortcuts[ elem ].focusonly
			};
		}

		return result;
	}

	public register(identifier:string, shortcuts:any):any{
		if(!this.getShortcuts(identifier)) {
			this.shortcuts.push({
				identifier: identifier,
				shortcuts : this.cloneShortcuts(shortcuts)
			});
		}
		//TODO
		return this.getShortcuts(identifier);
	}

	public unregister(identifier:string){
		if(this.shortcuts.length > 0){
			let j = -1;
			for(let i = 0; i < this.shortcuts.length; i++){
				if(this.shortcuts[i].identifier == identifier){
					j = i;
					break;
				}
			}

			if(j > 0)
				this.shortcuts.splice(j, 1);
		}
	}

	public getShortcuts(identifier:string):any{
		for(let i = 0; i < this.shortcuts.length; i++){
			if(this.shortcuts[i].identifier == identifier){
				return this.shortcuts[i].shortcuts;
			}
		}

		return null;
	}

	/**
	 * get Shortcut for labels
	 * @param key
	 * @returns {any}
	 */
	public getShortcut(identifier:string, key: string): string {
		let shortcuts = this.getShortcuts(identifier);

		if (shortcuts) {
			let platform = BrowserInfo.platform;
			if (shortcuts[ key ].keys[ platform ]) {
				let shortc = "[" + shortcuts[ key ].keys[ platform ] + "]";
				shortc = shortc.replace("BACKSPACE", "DEL");
				return shortc;
			}
		}

		return "";
	}

	/*private getRegist(combo:string):string{
		for(let i = 0; i < this.shortcuts.length; i++){
			let shortcuts = this.getEntryList(this.shortcuts[i].identifier);
			for(let j = 0; j < shortcuts.length; j++){
				if(shortcuts[j].value.keys.mac === combo){
					return this.shortcuts[i].identifier;
				}
			}
		}

		return null;
	}*/
}

export class Entry {
	public key:string;
	public value:any;

	constructor(key:string, value:any) {
		this.key = key;
		this.value = value;
	}
}
