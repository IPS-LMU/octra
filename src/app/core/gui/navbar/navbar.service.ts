import {EventEmitter, Injectable} from '@angular/core';
import {AppStorageService} from '../../shared/service/appstorage.service';
import {TranscriptionService} from '../../shared/service/transcription.service';
import {UserInteractionsService} from '../../shared/service/userInteractions.service';
import {AudioInfo} from '../../../media-components/obj/media/audio';
import {FileSize} from '../../shared/Functions';

@Injectable()
export class NavbarService {
  public onexportbuttonclick = new EventEmitter<any>();
  public interfacechange = new EventEmitter<string>();
  public onclick = new EventEmitter<string>();
  public transcrService: TranscriptionService;
  public uiService: UserInteractionsService;
  public dataloaded = false;
  public originalInfo: AudioInfo;
  public filesize: FileSize;

  private _show_export = false;

  get show_export(): boolean {
    return this._show_export;
  }

  set show_export(value: boolean) {
    this._show_export = value;
  }

  private _show_interfaces = false;

  get show_interfaces(): boolean {
    return this._show_interfaces;
  }

  set show_interfaces(value: boolean) {
    this._show_interfaces = value;
  }

  private _interfaces: string[] = [];

  get interfaces(): string[] {
    return this._interfaces;
  }

  set interfaces(value: string[]) {
    this._interfaces = value;
  }

  constructor(private appStorage: AppStorageService) {

  }

  public doclick(name: string) {
    this.onclick.emit(name);
  }
}
