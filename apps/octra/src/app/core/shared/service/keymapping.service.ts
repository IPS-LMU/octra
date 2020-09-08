import {EventEmitter, Injectable} from '@angular/core';
import {BrowserInfo} from '../BrowserInfo';
import {isUnset} from '@octra/utilities';
import {KeyMapping} from '@octra/components';

@Injectable()
export class KeymappingService {
  private shortcuts: any[] = [];
  private readonly _beforeKeyDown = new EventEmitter<KeyMappingShortcutEvent>();
  private readonly _onkeydown: EventEmitter<KeyMappingShortcutEvent>;
  private readonly _onkeyup: EventEmitter<KeyMappingShortcutEvent>;

  get onkeydown(): EventEmitter<KeyMappingShortcutEvent> {
    return this._onkeydown;
  }

  get onkeyup(): EventEmitter<KeyMappingShortcutEvent> {
    return this._onkeyup;
  }

  get beforeKeyDown(): EventEmitter<KeyMappingShortcutEvent> {
    return this._beforeKeyDown;
  }

  constructor() {
    this._onkeydown = new EventEmitter<KeyMappingShortcutEvent>();
    window.onkeydown = this.onKeyDown;

    this._onkeyup = new EventEmitter<KeyMappingShortcutEvent>();
    window.onkeyup = this.onKeyUp;
  }

  public getEntryList(name: string): Entry[] {
    const list = this.getShortcuts(name);

    if (list) {
      let i = 0;
      for (const entry in list) {
        if (list.hasOwnProperty(entry)) {
          i++;
        }
      }

      if (i > 0) {
        const result: Entry[] = [];

        for (const entry in list) {
          if (!(list[entry] === null || list[entry] === undefined) && list.hasOwnProperty(entry)) {
            const val = list[entry];
            result.push(new Entry(entry, val));
          }
        }

        return result;
      } else {
        console.error(`no shortcuts found!`);
      }
    }
    return [];
  }

  public register(identifier: string, shortcuts: any): any {
    if (!this.getShortcuts(identifier)) {
      this.shortcuts.push({
        identifier,
        shortcuts: this.cloneShortcuts(shortcuts)
      });
    }
    // TODO
    return this.getShortcuts(identifier);
  }

  public unregister(identifier: string) {
    if (this.shortcuts.length > 0) {
      let j = -1;
      for (let i = 0; i < this.shortcuts.length; i++) {
        if (this.shortcuts[i].identifier === identifier) {
          j = i;
          break;
        }
      }

      if (j > 0) {
        this.shortcuts.splice(j, 1);
      }
    }
  }

  public getShortcuts(identifier: string): any {
    for (const shortcut of this.shortcuts) {
      if (shortcut.identifier === identifier) {
        return shortcut.shortcuts;
      }
    }

    return null;
  }

  /**
   * get Shortcut for labels
   */
  public getShortcut(identifier: string, key: string): string {
    const shortcuts = this.getShortcuts(identifier);

    if (shortcuts && !isUnset(shortcuts[key])) {
      const platform = BrowserInfo.platform;
      if (shortcuts[key].keys[platform]) {
        let shortc = '[' + shortcuts[key].keys[platform] + ']';
        shortc = shortc.replace('BACKSPACE', 'DEL');
        return shortc;
      }
    }

    return '';
  }

  private onKeyDown = ($event) => {
    const combo = KeyMapping.getShortcutCombination($event);
    this._beforeKeyDown.emit({comboKey: combo, event: $event});
    this._onkeydown.emit({comboKey: combo, event: $event});
  }

  private onKeyUp = ($event) => {
    const combo = KeyMapping.getShortcutCombination($event);
    this._onkeyup.emit({comboKey: combo, event: $event});
  }

  public checkShortcutAction(comboKey: string, shortcuts: any, shortcutsEnabled: boolean) {
    return new Promise<string>((resolve) => {

      if (shortcutsEnabled) {
        let foundShortcut = '';
        const platform = BrowserInfo.platform;
        if (!isUnset(shortcuts)) {
          for (const shortcut in shortcuts) {
            if (shortcuts.hasOwnProperty(shortcut)) {
              const currentShortcut = shortcuts['' + shortcut + ''];

              if (currentShortcut.keys['' + platform + ''] === comboKey) {
                foundShortcut = shortcut;
                break;
              }
            }
          }
        }
        resolve(foundShortcut);
      }
    });
  }

  private cloneShortcuts(shortcuts: any): any {
    const result: any = {};
    for (const elem in shortcuts) {
      if (shortcuts.hasOwnProperty(elem)) {
        result['' + elem + ''] = {
          keys: {
            mac: shortcuts[elem].keys.mac,
            pc: shortcuts[elem].keys.pc
          },
          title: shortcuts[elem].title,
          focusonly: shortcuts[elem].focusonly
        };
      }
    }

    return result;
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
  public key: string;
  public value: any;

  constructor(key: string, value: any) {
    this.key = key;
    this.value = value;
  }
}

export interface KeyMappingShortcutEvent {
  comboKey: string;
  event: KeyboardEvent;
}