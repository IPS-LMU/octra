import {EventEmitter, Injectable} from '@angular/core';
import {BrowserInfo} from '../BrowserInfo';
import {isUnset, Shortcut, ShortcutEvent, ShortcutGroup, ShortcutManager} from '@octra/utilities';

@Injectable()
export class KeymappingService {
  private shortcutsManager: ShortcutManager;
  private readonly _beforeShortcutTriggered = new EventEmitter<ShortcutEvent>();
  private readonly _onShortcutTriggered: EventEmitter<ShortcutEvent>;

  public get shortcutGroups(): ShortcutGroup[] {
    if (isUnset(this.shortcutsManager)) {
      return [];
    }

    return this.shortcutsManager.shortcuts;
  }

  private _pressedMetaKeys = {
    ctrl: false,
    cmd: false
  }

  public get generalShortcuts(): ShortcutGroup {
    return this.shortcutsManager.generalShortcuts;
  }

  get pressedMetaKeys() {
    return this._pressedMetaKeys;
  }

  get onShortcutTriggered(): EventEmitter<ShortcutEvent> {
    return this._onShortcutTriggered;
  }

  get beforeShortcutTriggered(): EventEmitter<ShortcutEvent> {
    return this._beforeShortcutTriggered;
  }

  constructor() {
    this.shortcutsManager = new ShortcutManager();
    this._onShortcutTriggered = new EventEmitter<ShortcutEvent>();
    window.onkeydown = this.onKeyDown;
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

  public registerGeneralShortcutGroup(shortcutGroup: ShortcutGroup) {
    this.shortcutsManager.generalShortcuts = shortcutGroup;
  }

  public unregister(identifier: string) {
    this.shortcutsManager.unregisterShortcutGroup(identifier);
  }

  public unregisterAll() {
    this.shortcutsManager.clearShortcuts();
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

  private onKeyDown = ($event: KeyboardEvent) => {
    this.shortcutsManager.checkKeyEvent($event, 'service').then((shortcutInfo: ShortcutEvent) => {
      if (!isUnset(shortcutInfo)) {
      }
    }).catch((error) => {
      console.error(error);
    });
  }

  private onKeyUp = ($event) => {
    this.shortcutsManager.checkKeyEvent($event, 'service').then((shortcutInfo) => {
      if (!isUnset(shortcutInfo)) {
        this._beforeShortcutTriggered.emit({...shortcutInfo, event: $event});
        this._onShortcutTriggered.emit({...shortcutInfo, event: $event});
      }
    }).catch((error) => {
      console.error(error);
    });
  }

  public checkShortcutAction(shortcut: string, shortcutGroup: ShortcutGroup, shortcutsEnabled: boolean) {
    return new Promise<string>((resolve) => {

      if (shortcutsEnabled) {
        const platform = BrowserInfo.platform;
        if (!isUnset(shortcutGroup)) {
          const foundShortcut = shortcutGroup.items.find(a => a.keys['' + platform] === shortcut);

          if (!isUnset(foundShortcut)) {
            resolve(foundShortcut.name);
          }
        }
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
