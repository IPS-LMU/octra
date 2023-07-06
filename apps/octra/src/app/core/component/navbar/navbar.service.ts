import { EventEmitter, Injectable } from '@angular/core';
import {
  TranscriptionService,
  UserInteractionsService,
} from '../../shared/service';
import { AudioRessource } from '@octra/media';
import { FileSize } from '@octra/utilities';

@Injectable()
export class NavbarService {
  public interfacechange = new EventEmitter<string>();
  public onclick = new EventEmitter<string>();
  public transcrService!: TranscriptionService;
  public uiService!: UserInteractionsService;
  public dataloaded = false;
  public ressource!: AudioRessource;
  public filesize!: FileSize;
  public showNavbar = true;

  public toolApplied = new EventEmitter<string>();

  private _showExport = false;

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
