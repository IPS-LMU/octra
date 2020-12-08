import {EventEmitter, Injectable} from '@angular/core';
import {BrowserInfo} from '../BrowserInfo';
import {isUnset, Shortcut, ShortcutGroup, ShortcutManager} from '@octra/utilities';

@Injectable()
export class KeymappingService {
  private shortcutsManager: ShortcutManager;
  private readonly _beforeKeyDown = new EventEmitter<KeyMappingShortcutEvent>();
  private readonly _onkeydown: EventEmitter<KeyMappingShortcutEvent>;
  private readonly _onkeyup: EventEmitter<KeyMappingShortcutEvent>;

  private _pressedMetaKeys = {
    ctrl: false,
    cmd: false
  }

  get pressedMetaKeys() {
    return this._pressedMetaKeys;
  }

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
    this.shortcutsManager = new ShortcutManager();
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

  public register(shortcutGroup: ShortcutGroup): ShortcutGroup {
    this.shortcutsManager.registerShortcutGroup(shortcutGroup);
    return this.shortcutsManager.getShortcutGroup(shortcutGroup.name);
  }

  public unregister(identifier: string) {
    this.shortcutsManager.unregisterShortcutGroup(identifier);
  }

  public getShortcuts(identifier: string): Shortcut[] {
    const shortcutGroup = this.shortcutsManager.getShortcutGroup(identifier);

    if (!isUnset(shortcutGroup)) {
      return shortcutGroup.items;
    }

    return [];
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
    this.shortcutsManager.checkKeyEvent($event).then((shortcutInfo) => {
      console.log(`combo: ${shortcutInfo.shortcut}`);

      this._beforeKeyDown.emit({...shortcutInfo, event: $event});
      this._onkeydown.emit({...shortcutInfo, event: $event});
    }).catch((error) => {
      console.error(error);
    });
  }

  private onKeyUp = ($event) => {
    this.shortcutsManager.checkKeyEvent($event).then((shortcutInfo) => {
      this._onkeyup.emit({...shortcutInfo, event: $event});
    }).catch((error) => {
      console.error(error);
    });
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
  shortcut: string;
  platform: string;
  shortcutName: string;
  event: KeyboardEvent;
}
