import { EventEmitter, Injectable } from '@angular/core';
import { Shortcut, ShortcutGroup } from '@octra/web-media';
import hotkeys, { HotkeysEvent } from 'hotkeys-js';

@Injectable({
  providedIn: 'root',
})
export class ShortcutService {
  get generalShortcuts(): ShortcutGroup[] {
    return this._generalShortcuts;
  }

  get groups(): ShortcutGroup[] {
    return this._groups;
  }

  private _groups: ShortcutGroup[] = [];
  private _generalShortcuts: ShortcutGroup[] = [];
  private previouslyEnabled: string[] = [];

  readonly triggerGeneralShortcuts = new EventEmitter<{
    shortcut: string;
  }>();

  constructor() {
    window.addEventListener('blur', this.onWindowBlur);
  }

  private onWindowBlur = () => {
    // reset pressed keys
    hotkeys.ctrl = false;
    hotkeys.cmd = false;
    hotkeys.shift = false;
    hotkeys.alt = false;
  };

  registerGeneralShortcutGroup(shortcutGroup: ShortcutGroup) {
    if (!this._generalShortcuts.find((a) => a.name === shortcutGroup.name)) {
      this._generalShortcuts = [...this._generalShortcuts, shortcutGroup];
    }
  }

  registerShortcutGroup(shortcutGroup: ShortcutGroup) {
    if (!this._groups.find((a) => a.name === shortcutGroup.name)) {
      this._groups = [...this._groups, shortcutGroup];
    }
    this.initShortcuts();
  }

  unregisterShortcutGroup(name: string) {
    this._groups = this._groups.filter((a) => a.name !== name);
    this.initShortcuts();
  }

  initShortcuts() {
    hotkeys.unbind();
    hotkeys.filter = () => true;

    const runShortcut = (kEvent: KeyboardEvent, hEvent: HotkeysEvent, group: ShortcutGroup, item: Shortcut, isGeneral: boolean) => {
      const groups = isGeneral ? this._generalShortcuts : this._groups;

      const Group = groups.find((a) => a.name === group.name);
      if (Group && item.callback) {
        if (Group.enabled) {
          kEvent.preventDefault();
          item.callback(kEvent, item, hEvent, Group);
        }
      }
    };

    const registerItems = (group: ShortcutGroup, isGeneral: boolean) => {
      let redoUndoRegistered = false;
      for (const item of group.items) {
        if (!['CMD + Z', 'SHIFT + CMD + Z'].includes(item.keys.mac) && !['CTRL + Z', 'CTRL + Y'].includes(item.keys.pc)) {
          const hotkeyString = Array.from(new Set([item.keys.mac, item.keys.pc]))
            .filter((a) => a !== undefined)
            .join(',');
          hotkeys(hotkeyString, (kEvent, hEvent) => {
            runShortcut(kEvent, hEvent, group, item, isGeneral);
          });
        } else if (!redoUndoRegistered) {
          // fix because hotkeys js uses querty layout
          redoUndoRegistered = true;
          hotkeys('*', (kEvent, hEvent) => {
            const cmdPressed = hotkeys.cmd;
            const ctrlPressed = hotkeys.ctrl;
            const shiftPressed = hotkeys.shift;
            const key = kEvent.key;

            let shortcut = shiftPressed ? ['SHIFT'] : [];
            shortcut = ctrlPressed ? [...shortcut, 'CTRL'] : shortcut;
            shortcut = cmdPressed ? [...shortcut, 'CMD'] : shortcut;
            shortcut = key ? [...shortcut, key.toUpperCase()] : shortcut;

            const foundItem = group.items.find((a) => [a.keys.pc, a.keys.mac].includes(shortcut.join(' + ')));

            if (foundItem) {
              if (cmdPressed) {
                if (key === 'z') {
                  if (!shiftPressed) {
                    runShortcut(kEvent, hEvent, group, foundItem, isGeneral);
                  } else {
                    runShortcut(kEvent, hEvent, group, foundItem, isGeneral);
                  }
                }
              } else if (ctrlPressed) {
                if (key === 'z') {
                  runShortcut(kEvent, hEvent, group, foundItem, isGeneral);
                } else if (key === 'y') {
                  runShortcut(kEvent, hEvent, group, foundItem, isGeneral);
                }
              }
            }
          });
        }
      }
    };

    for (const group of this._groups) {
      registerItems(group, false);
    }

    for (const group of this._generalShortcuts) {
      registerItems(group, true);
    }
  }

  destroy() {
    hotkeys.unbind();
    window.removeEventListener('blur', this.onWindowBlur);
    this._groups = [];
  }

  public unregisterItemFromGroup(groupName: string, itemName: string) {
    this._groups = this._groups.map((a) => {
      if (a.name === groupName) {
        a.items = a.items.filter((b) => b.name !== itemName);
      }
      return a;
    });
  }

  public disableGroup(groupName: string) {
    this._groups = this._groups.map((a) => {
      if (a.name === groupName) {
        return {
          ...a,
          enabled: false,
        };
      }
      return a;
    });
  }

  disableAll() {
    this.previouslyEnabled = this._groups.filter((a) => a.enabled).map((a) => a.name);
    this._groups.forEach((group) => {
      group.enabled = false;
    });
  }

  enableAll() {
    this._groups.forEach((group) => {
      group.enabled = this.previouslyEnabled.includes(group.name);
    });
    this.previouslyEnabled = [];
  }

  public enableGroup(groupName: string) {
    this._groups = this._groups.map((a) => {
      if (a.name === groupName) {
        return {
          ...a,
          enabled: true,
        };
      }
      return a;
    });
  }

  public overwriteCallback(
    groupName: string,
    itemName: string,
    callback?: (keyboardEvent: KeyboardEvent | undefined, shortcut: Shortcut, hotkeyEvent?: HotkeysEvent) => void,
  ) {
    const groupIndex = this._groups.findIndex((a) => a.name == groupName);

    if (groupIndex > -1) {
      const itemIndex = this._groups[groupIndex].items.findIndex((a) => a.name === itemName);
      if (itemIndex > -1) {
        this._groups[groupIndex].items[itemIndex].callback = callback;
      }
    }
  }
}
