import {EventEmitter, Injectable} from '@angular/core';
import {File} from '../shared/Converters/Converter';
import {TextConverter} from '../shared/Converters/TextConverter';
import {SessionService} from './session.service';
import {AnnotJSONConverter} from '../shared/Converters/AnnotJSONConverter';
import {TranscriptionService} from './transcription.service';
import {UserInteractionsService} from './userInteractions.service';

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

  public get textfile(): File {
    const result = this.getExportFile('text');

    return result;
  }

  public get annotjsonfile(): File {
    const result = this.getExportFile('annotJSON');

    return result;
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
    },
    text: '',
    annotJSON: ''
  };

  constructor(private sessService: SessionService) {

  }

  public getExportFile(format: string): File {
    if (format === 'text') {
      const converter: TextConverter = new TextConverter();
      return converter.export(this.sessService.annotation);
    } else if (format === 'annotJSON') {
      const converter: AnnotJSONConverter = new AnnotJSONConverter();
      return converter.export(this.sessService.annotation);
    }

    return {
      name: '',
      content: 'nothing',
      encoding: '',
      type: ''
    };
  }

  onExportButtonClick(format: string) {
    this.onexportbuttonclick.emit({
      format: format
    });
  }

  public doclick(name: string) {
    this.onclick.emit(name);
  }
}
