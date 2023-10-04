import { Injectable } from '@angular/core';
import hotkeys, { HotkeysEvent } from 'hotkeys-js';
import { Shortcut, ShortcutGroup } from '@octra/web-media';

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

  constructor() {}

  registerGeneralShortcutGroup(shortcutGroup: ShortcutGroup) {
    if (!this._generalShortcuts.find((a) => a.name === shortcutGroup.name)) {
      this._generalShortcuts.push(shortcutGroup);
    }
  }

  registerShortcutGroup(shortcutGroup: ShortcutGroup) {
    if (!this._groups.find((a) => a.name === shortcutGroup.name)) {
      this._groups.push(shortcutGroup);
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

    const registerItems = (group: ShortcutGroup, isGeneral: boolean) => {
      for (const item of group.items) {
        const hotkeyString = Array.from(new Set([item.keys.mac, item.keys.pc]))
          .filter((a) => a !== undefined)
          .join(',');
        hotkeys(hotkeyString, (kEvent, hEvent) => {
          const groups = isGeneral ? this._generalShortcuts : this._groups;
          const Group = groups.find((a) => a.name === group.name);
          if (Group && item.callback) {
            if (Group.enabled) {
              console.log(`run callback for ${group.name}, ${item.name}`);
              kEvent.preventDefault();
              item.callback(kEvent, item, hEvent, Group);
            } else {
              console.log(
                `Can't run callback, group is disabled ${group.name}`
              );
            }
          }
        });
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
        console.log(`disable group ${groupName}`);
        return {
          ...a,
          enabled: false,
        };
      }
      return a;
    });
  }

  public enableGroup(groupName: string) {
    this._groups = this._groups.map((a) => {
      if (a.name === groupName) {
        console.log(`enable group ${groupName}`);
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
    callback?: (
      keyboardEvent: KeyboardEvent,
      shortcut: Shortcut,
      hotkeyEvent: HotkeysEvent
    ) => void
  ) {
    const groupIndex = this._groups.findIndex((a) => a.name == groupName);

    if (groupIndex > -1) {
      const itemIndex = this._groups[groupIndex].items.findIndex(
        (a) => a.name === itemName
      );
      if (itemIndex > -1) {
        this._groups[groupIndex].items[itemIndex].callback = callback;
      }
    }
  }
}
