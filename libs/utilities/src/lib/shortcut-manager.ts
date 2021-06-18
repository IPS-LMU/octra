import {BrowserInfo} from './browser-info';

export interface ShortcutEvent {
  shortcut: string;
  platform: string;
  shortcutName: string;
  shortcutGroupName: string;
  onFocusOnly: boolean;
  event: KeyboardEvent;
  timestamp: number;
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
  enabled: boolean;
  name: string;
  items: Shortcut[];
}

export class ShortcutManager {
  get pressedKeys(): { other: number; ctrl: boolean; shift: boolean; alt: boolean; cmd: boolean } {
    return this._pressedKeys;
  }

  get shortcuts(): ShortcutGroup[] {
    return this._shortcuts;
  }

  private _shortcuts: ShortcutGroup[];
  public generalShortcuts: ShortcutGroup = {
    name: 'general shortcuts',
    enabled: true,
    items: []
  }

  private _pressedKeys = {
    alt: false,
    cmd: false,
    ctrl: false,
    shift: false,
    other: -1
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

  private protectedShortcuts: string[] = [
    'CMD + S', // Save dialogue
    'STRG + S',
    'CMD + P', // Print dialogue
    'STRG + P'
  ];

  constructor() {
    this._shortcuts = [];
  }

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

  public checkKeyEvent(event: KeyboardEvent, timestamp: number, checkPressKey = true): ShortcutEvent {
    if (this.shortcutsEnabled) {
      if (event.type === 'keydown') {
        // run shortcut check
        const shortcut = this.getShorcutCombination(event);
        const commandObj = this.getCommand(shortcut, BrowserInfo.platform);

        if (this.isProtectedShortcut(shortcut)) {
          // clear pressed keys
          this.resetPressedKeys();
          return null;
        }

        if (checkPressKey) {
          this.checkPressedKey(event);
        }

        if (commandObj !== undefined) {
          return {
            platform: BrowserInfo.platform,
            shortcutName: commandObj.shortcut.name,
            shortcutGroupName: commandObj.groupName,
            onFocusOnly: commandObj.shortcut.focusonly,
            shortcut,
            event,
            timestamp
          };

        } else {
          return null;
        }
      } else if (event.type === 'keyup') {
        if (checkPressKey) {
          this.checkPressedKey(event);
        }
        return null;
      } else {
        if (checkPressKey) {
          this.checkPressedKey(event);
        }
        return null;
      }
    } else {
      return null;
    }
  }

  public getCommandByEvent(event: KeyboardEvent) {
    const shortcut = this.getShorcutCombination(event);
    return this.getCommand(shortcut, BrowserInfo.platform);
  }

  private getCommand(shortcut: string, platform: 'mac' | 'pc'): {
    shortcut: Shortcut,
    groupName: string
  } {
    for (const shortcutGroup of this._shortcuts) {
      const elem = shortcutGroup.items.find(a => a.keys[platform] === shortcut);
      if (elem !== undefined) {
        if (shortcutGroup.enabled) {
          return {
            shortcut: elem,
            groupName: shortcutGroup.name
          };
        } else {
          return null;
        }
      }
    }

    // look for general shortcut
    const generalShortcutElem = this.generalShortcuts.items.find(a => a.keys[platform] === shortcut);

    if (generalShortcutElem !== undefined) {
      return {
        shortcut: generalShortcutElem,
        groupName: this.generalShortcuts.name
      };
    }

    return null;
  }

  /**
   *
   * gets the name of a special Key by number
   */
  private getNameByEvent(event: KeyboardEvent): string {
    const code = this.getKeyCode(event);

    if (code > -1) {
      if (BrowserInfo.platform === 'mac') {
        if (BrowserInfo.browser.toLowerCase().indexOf('firefox') > -1) {
          // Firefox
          if (code === 224 && (event.code === 'OSLeft' || event.code === 'OSRight')) {
            return 'CMD';
          }
        }
      }

      for (const elem of this.keyMappingTable) {
        if (elem.keyCode === code) {
          return elem.name;
        }
      }
    }

    return '';
  }

  public getShorcutCombination(event: KeyboardEvent) {
    const keyCode = this.getKeyCode(event);
    const alt = this._pressedKeys.alt;
    const ctrl = this._pressedKeys.ctrl;
    const cmd = this._pressedKeys.cmd;
    const shift = this._pressedKeys.shift;

    let name = this.getNameByEvent(event);
    if (name === '' && keyCode > -1) {
      name = String.fromCharCode(keyCode).toUpperCase();
    }

    if (!name) {
      name = '';
    }

    if (name === 'CONTROL') {
      name = 'CTRL';
    }

    let comboKey = '';

    if (alt || ctrl || shift || cmd) {
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

      if (cmd) {
        if (comboKey !== '') {
          comboKey += ' + ';
        }
        comboKey += 'CMD';
      }
    } else {
      comboKey = this.getNameByEvent(event);
    }

    // if name == comboKey, only one special Key pressed
    const keys = comboKey.split(' + ').filter(a => a !== null && a !== '');
    if (keys.find(a => a === name) === undefined) {
      if (name === 'A') {
        const ok = 2;
      }
      if (comboKey !== '') {
        comboKey += ' + ';
      }

      if (name !== '') {
        if (name.length === 1) {
          // keyName is normal char
          name = String.fromCharCode(keyCode);
        }
        comboKey += name;
      }
    }
    return comboKey;
  }

  private getKeyCode(event: KeyboardEvent): number {
    if (event.which !== undefined) {
      return event.which;
    }
    if (event.keyCode !== undefined) {
      return event.keyCode;
    }

    return -1;
  }

  private checkPressedKey(event: KeyboardEvent) {
    const keyName = this.getNameByEvent(event);
    const valueToSet = event.type === 'keydown';

    switch (keyName) {
      case ('ALT'):
        this._pressedKeys.alt = valueToSet;
        break;
      case ('SHIFT'):
        this._pressedKeys.shift = valueToSet;
        break;
      case ('CTRL'):
        this._pressedKeys.ctrl = valueToSet;
        break;
      case ('CMD'):
        this._pressedKeys.cmd = valueToSet;
        break;
    }

    this._pressedKeys.other = (valueToSet) ? this.getKeyCode(event) : -1;
  }

  private resetPressedKeys() {
    this._pressedKeys = {
      alt: false,
      shift: false,
      cmd: false,
      ctrl: false,
      other: -1
    };
  }

  public enableShortcutGroup(name: string) {
    const group = this.shortcuts.find(a => a.name === name);

    if (group !== undefined) {
      group.enabled = true;
    }
  }

  private isProtectedShortcut(shortcutCombination: string) {
    return this.protectedShortcuts.findIndex(a => a === shortcutCombination) > -1;
  }

  public disableShortcutGroup(name: string) {
    const group = this.shortcuts.find(a => a.name === name);

    if (group !== undefined) {
      group.enabled = false;
    }
  }
}
