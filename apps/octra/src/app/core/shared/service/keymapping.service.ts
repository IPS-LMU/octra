import {EventEmitter, Injectable} from '@angular/core';
import {BrowserInfo} from '../BrowserInfo';
import {Shortcut, ShortcutEvent, ShortcutGroup, ShortcutManager} from '@octra/utilities';

@Injectable()
export class KeymappingService {
  private readonly _shortcutsManager: ShortcutManager;
  private readonly _beforeShortcutTriggered = new EventEmitter<ShortcutEvent>();
  private readonly _onShortcutTriggered: EventEmitter<ShortcutEvent>;

  public get shortcutsManager(): ShortcutManager {
    return this._shortcutsManager;
  }

  public get shortcutGroups(): ShortcutGroup[] {
    if (this._shortcutsManager === undefined) {
      return [];
    }

    return this._shortcutsManager.shortcuts;
  }

  public get pressedKeys() {
    return this._shortcutsManager.pressedKeys;
  }

  public get generalShortcuts(): ShortcutGroup {
    return this._shortcutsManager.generalShortcuts;
  }

  get onShortcutTriggered(): EventEmitter<ShortcutEvent> {
    return this._onShortcutTriggered;
  }

  get beforeShortcutTriggered(): EventEmitter<ShortcutEvent> {
    return this._beforeShortcutTriggered;
  }

  constructor() {
    this._shortcutsManager = new ShortcutManager();
    this._onShortcutTriggered = new EventEmitter<ShortcutEvent>();
    window.onkeydown = this.onKeyDown;
    window.onkeyup = this.onKeyUp;
  }

  public register(shortcutGroup: ShortcutGroup): ShortcutGroup {
    this._shortcutsManager.registerShortcutGroup(shortcutGroup);
    return this._shortcutsManager.getShortcutGroup(shortcutGroup.name);
  }

  public registerGeneralShortcutGroup(shortcutGroup: ShortcutGroup) {
    this._shortcutsManager.generalShortcuts = shortcutGroup;
  }

  public unregister(identifier: string) {
    this._shortcutsManager.unregisterShortcutGroup(identifier);
  }

  public unregisterAll() {
    this._shortcutsManager.clearShortcuts();
  }

  public getShortcuts(identifier: string): Shortcut[] {
    const shortcutGroup = this._shortcutsManager.getShortcutGroup(identifier);

    if (shortcutGroup !== undefined) {
      return shortcutGroup.items;
    }

    return [];
  }

  /**
   * get Shortcut for labels
   */
  public getShortcut(identifier: string, key: string): string {
    const shortcuts = this.getShortcuts(identifier);

    if (shortcuts && shortcuts[key] !== undefined) {
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
    const shortcutInfo = this._shortcutsManager.checkKeyEvent($event, Date.now());
    if (shortcutInfo !== undefined) {
      this._beforeShortcutTriggered.emit({...shortcutInfo, event: $event});
      this._onShortcutTriggered.emit({...shortcutInfo, event: $event});
    }
  }

  private onKeyUp = ($event) => {
    this._shortcutsManager.checkKeyEvent($event, Date.now());
  }

  public checkShortcutAction(shortcut: string, shortcutGroup: ShortcutGroup, shortcutsEnabled: boolean) {
    return new Promise<string>((resolve) => {
      if (shortcutsEnabled) {
        const platform = BrowserInfo.platform;
        if (shortcutGroup !== undefined) {
          const foundShortcut = shortcutGroup.items.find(a => a.keys['' + platform] === shortcut);

          if (foundShortcut !== undefined) {
            resolve(foundShortcut.name);
          }
        }
      }
    });
  }
}
