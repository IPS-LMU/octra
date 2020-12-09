import {BrowserInfo} from './browser-info';
import {isUnset} from './functions';

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
  private shortcuts: ShortcutGroup[];

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
    this.shortcuts = [];
  }

  public shortcutsEnabled = true;

  private _pressedKey = {
    code: -1,
    name: ''
  };

  get pressedKey(): { code: number; name: string } {
    return this._pressedKey;
  }

  public getShortcutGroup(name: string) {
    return this.shortcuts.find(a => a.name === name);
  }

  public registerShortcutGroup(shortcutGroup: ShortcutGroup) {
    if (this.shortcuts.findIndex(a => a.name === shortcutGroup.name) < 0) {
      this.shortcuts.push(shortcutGroup);
    }
  }

  public unregisterShortcutGroup(groupName: string) {
    this.shortcuts = this.shortcuts.filter(a => a.name !== groupName);
  }

  public clearShortcuts() {
    this.shortcuts = [];
  }

  public checkKeyEvent(event: KeyboardEvent): Promise<{ shortcutName: string, platform: string, shortcut: string }> {
    return new Promise<{ shortcutName: string, shortcut: string, platform: string }>((resolve) => {
      if (this.shortcutsEnabled) {
        if (event.type === 'keydown') {
          const shortcut = this.getShorcutCombination(event);

          if (this._pressedKey.code < 0) {
            this._pressedKey.code = event.keyCode;
            this._pressedKey.name = this.getNameByCode(event.keyCode);
          }

          const shortcutName = this.getCommand(shortcut, BrowserInfo.platform);

          if (!isUnset(shortcutName)) {
            event.preventDefault();
            resolve({
              platform: BrowserInfo.platform,
              shortcutName,
              shortcut
            });
          } else {
            resolve(null);
          }
        } else if (event.type === 'keyup') {
          if (event.keyCode === this._pressedKey.code) {
            this._pressedKey.code = -1;
            this._pressedKey.name = '';
          }

        }
      } else {
        resolve(null);
      }
    });
  }

  private getCommand(shortcut: string, platform: 'mac' | 'pc') {
    for (const shortcutGroup of this.shortcuts) {
      const elem = shortcutGroup.items.find(a => a.keys[platform] === shortcut);
      if (!isUnset(elem)) {
        return elem.name;
      }
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

  private getShorcutCombination(event: KeyboardEvent) {
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

    let isCombination = false;
    let comboKey = '';

    // only one kombination permitted
    if (alt && !(ctrl || shift)) {
      isCombination = true;
    } else if (ctrl && !(alt || shift)) {
      isCombination = true;
    } else if (shift && !(alt || ctrl)) {
      isCombination = true;
    }

    if (this._pressedKey.code > -1) {
      isCombination = true;
    }

    if (isCombination) {
      if (alt) {
        comboKey = 'ALT';
      } else if (ctrl) {
        comboKey = 'CTRL';
      } else if (shift) {
        comboKey = 'SHIFT';
      } else {
        comboKey = this.getNameByCode(this._pressedKey.code);
      }
    }

    // if name == comboKey, only one special Key pressed
    if (name !== comboKey) {
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
