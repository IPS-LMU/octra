import {BrowserInfo} from './browser-info';
import {isUnset} from './functions';

export interface ShortcutEvent {
  shortcut: string;
  platform: string;
  shortcutName: string;
  onFocusOnly: boolean;
  event: KeyboardEvent;
}

export interface KeyMappingEntry {
  name: string;
  keyCode: number;
}

export interface Shortcut {
  name: string;
  keys: {
    mac: string;
    pc: string;
  },
  title: string;
  focusonly: boolean;
}

export interface ShortcutGroup {
  name: string;
  items: Shortcut[];
}

export class ShortcutManager {
  get shortcuts(): ShortcutGroup[] {
    return this._shortcuts;
  }

  private _shortcuts: ShortcutGroup[];

  public generalShortcuts: ShortcutGroup = {
    name: 'general shortcuts',
    items: []
  }

  private keyMappingTable: KeyMappingEntry[] = [
    {
      name: 'CMD',
      keyCode: 91
    },
    {
      name: 'CMD',
      keyCode: 93
    },
    {
      name: 'ALT',
      keyCode: 18
    },
    {
      name: 'META',
      keyCode: -1
    },
    {
      name: 'CTRL',
      keyCode: 17
    },
    {
      name: 'TAB',
      keyCode: 9
    },
    {
      name: 'BACKSPACE',
      keyCode: 8
    },
    {
      name: 'ENTER',
      keyCode: 13
    },
    {
      name: 'ESC',
      keyCode: 27
    },
    {
      name: 'SPACE',
      keyCode: 32
    },
    {
      name: 'SHIFT',
      keyCode: 16
    },
    {
      name: 'ARROWLEFT',
      keyCode: 37
    },
    {
      name: 'ARROWUP',
      keyCode: 38
    },
    {
      name: 'ARROWRIGHT',
      keyCode: 39
    },
    {
      name: 'ARROWDOWN',
      keyCode: 40
    }
  ];

  constructor() {
    this._shortcuts = [];
  }

  private ignoreKeyUps = false;

  public shortcutsEnabled = true;

  public getShortcutGroup(name: string) {
    return this._shortcuts.find(a => a.name === name);
  }

  public registerShortcutGroup(shortcutGroup: ShortcutGroup) {
    if (this._shortcuts.findIndex(a => a.name === shortcutGroup.name) < 0) {
      this._shortcuts.push(shortcutGroup);
    }
  }

  public unregisterShortcutGroup(groupName: string) {
    this._shortcuts = this._shortcuts.filter(a => a.name !== groupName);
  }

  public clearShortcuts() {
    this._shortcuts = [];
  }

  public checkKeyEvent(event: KeyboardEvent, source: string): Promise<ShortcutEvent> {
    return new Promise<ShortcutEvent>((resolve) => {
      if (this.shortcutsEnabled) {
        if (event.type === 'keydown') {
          this.ignoreKeyUps = false;
          resolve(null);
        } else if (event.type === 'keyup' && !this.ignoreKeyUps) {
          const shortcut = this.getShorcutCombination(event);
          const shortcutObj = this.getCommand(shortcut, BrowserInfo.platform);

          if (!isUnset(shortcutObj)) {
            event.preventDefault();

            if (shortcut.indexOf('+') > -1) {
              this.ignoreKeyUps = true;
            } else {
              this.ignoreKeyUps = false;
            }

            resolve({
              platform: BrowserInfo.platform,
              shortcutName: shortcutObj.name,
              onFocusOnly: shortcutObj.focusonly,
              shortcut,
              event
            });

          } else {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      } else {
        resolve(null);
      }
    });
  }

  private getCommand(shortcut: string, platform: 'mac' | 'pc'): Shortcut {
    for (const shortcutGroup of this._shortcuts) {
      const elem = shortcutGroup.items.find(a => a.keys[platform] === shortcut);
      if (!isUnset(elem)) {
        return elem;
      }
    }

    // look for general shortcut
    const generalShortcutElem = this.generalShortcuts.items.find(a => a.keys[platform] === shortcut);

    if (!isUnset(generalShortcutElem)) {
      return generalShortcutElem;
    }

    return null;
  }

  /**
   *
   * gets the name of a special Key by number
   */
  private getNameByCode(code: number): string {
    for (const elem of this.keyMappingTable) {
      if (elem.keyCode === code) {
        return elem.name;
      }
    }
    return '';
  }

  public getShorcutCombination(event: KeyboardEvent) {
    const keycode = event.which; // which has better browser compatibility
    const alt = event.altKey;
    const ctrl = event.ctrlKey;
    const meta = event.metaKey;
    const shift = event.shiftKey;

    let name = this.getNameByCode(keycode);
    if (name === '' && !(event.which === null || event.which === undefined)) {
      name = String.fromCharCode(event.which).toUpperCase();
    }

    if (!name) {
      name = '';
    }

    if (name === 'CONTROL') {
      name = 'CTRL';
    }

    let comboKey = '';

    if (alt || ctrl || shift) {
      if (shift) {
        comboKey = 'SHIFT';
      }

      if (alt) {
        if (comboKey !== '') {
          comboKey += ' + ';
        }
        comboKey += 'ALT';
      }

      if (ctrl) {
        if (comboKey !== '') {
          comboKey += ' + ';
        }
        comboKey += 'CTRL';
      }
    } else {
      comboKey = this.getNameByCode(event.keyCode);
    }

    // if name == comboKey, only one special Key pressed
    if (comboKey.indexOf(name) < 0) {
      if (comboKey !== '') {
        comboKey += ' + ';
      }

      if (event.key !== '' && name !== '') {
        if (name.length === 1) {
          // keyName is normal char
          name = String.fromCharCode(keycode);
        }
        comboKey += name;
      }
    }
    return comboKey;
  }
}
