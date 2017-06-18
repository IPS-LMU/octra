import {EventEmitter, Injectable} from '@angular/core';
import {File} from '../shared/Converters/Converter';
import {TextConverter} from '../shared/Converters/TextConverter';
import {SessionService} from './session.service';
import {AnnotJSONConverter} from '../shared/Converters/AnnotJSONConverter';
import {TranscriptionService} from './transcription.service';
import {UserInteractionsService} from './userInteractions.service';
import {OAudiofile} from '../types/annotjson';

@Injectable()
export class NavbarService {
  get interfaces(): string[] {
    return this._interfaces;
  }

  set interfaces(value: string[]) {
    this._interfaces = value;
  }

  get show_interfaces(): boolean {
    return this._show_interfaces;
  }

  set show_interfaces(value: boolean) {
    this._show_interfaces = value;
  }

  get show_export(): boolean {
    return this._show_export;
  }

  set show_export(value: boolean) {
    this._show_export = value;
  }

  public onexportbuttonclick = new EventEmitter<any>();
  public interfacechange = new EventEmitter<string>();
  public onclick = new EventEmitter<string>();

  private _show_export = false;
  private _show_interfaces = false;
  private _interfaces: string[] = [];

  public transcrService: TranscriptionService;
  public uiService: UserInteractionsService;

  public dataloaded = false;

  public exportformats: any = {
    filename: '',
    bitrate: 0,
    samplerate: 0,
    duration: 0,
    filesize: {
      size: 0,
      label: ''
    }
  };

  constructor(private sessService: SessionService) {

  }

  public doclick(name: string) {
    this.onclick.emit(name);
  }
}
