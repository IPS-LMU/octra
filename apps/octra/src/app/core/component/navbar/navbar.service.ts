import { EventEmitter, inject, Injectable } from '@angular/core';
import { FileSize, getFileSize } from '@octra/utilities';
import { AudioService, UserInteractionsService } from '../../shared/service';
import { OCTRAEditor } from '../../../editors/octra-editor';

@Injectable({ providedIn: 'root' })
export class NavbarService {
  uiService = inject(UserInteractionsService);
  private audio = inject(AudioService);

  public interfacechange = new EventEmitter<typeof OCTRAEditor>();
  public onclick = new EventEmitter<string>();
  public openSettings = new EventEmitter<void>();

  public dataloaded = false;
  public showNavbar = true;

  public toolApplied = new EventEmitter<string>();

  private _showExport = false;
  isCollapsed = true;

  currentEditor?: typeof OCTRAEditor;

  public get fileSize(): FileSize | undefined {
    if (this.audio.audioManager?.resource?.size !== undefined) {
      return getFileSize(this.audio.audioManager.resource.size);
    }
    return undefined;
  }

  get showExport(): boolean {
    return this._showExport;
  }

  set showExport(value: boolean) {
    this._showExport = value;
  }

  private _showInterfaces = false;

  get showInterfaces(): boolean {
    return this._showInterfaces;
  }

  set showInterfaces(value: boolean) {
    this._showInterfaces = value;
  }

  private _interfaces: string[] = [];

  get interfaces(): string[] {
    return this._interfaces;
  }

  set interfaces(value: string[]) {
    this._interfaces = value;
  }

  public doclick(name: string) {
    this.onclick.emit(name);
  }
}
