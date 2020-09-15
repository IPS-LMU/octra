import {Component, EventEmitter, OnInit} from '@angular/core';
import {
  AudioService,
  KeymappingService,
  SettingsService,
  TranscriptionService,
  UserInteractionsService
} from '../../core/shared/service';
import {AppStorageService} from '../../core/shared/service/appstorage.service';
import {OCTRAEditor} from '../octra-editor';
import {AudioChunk} from '@octra/media';

@Component({
  selector: 'octra-trn-editor',
  templateUrl: './trn-editor.component.html',
  styleUrls: ['./trn-editor.component.css']
})
export class TrnEditorComponent extends OCTRAEditor implements OnInit {
  public static editorname = 'TRN-Editor';
  public static initialized: EventEmitter<void> = new EventEmitter<void>();
  public audioChunk: AudioChunk;
  public segments: {}

  constructor(public audio: AudioService,
              public keyMap: KeymappingService,
              public transcrService: TranscriptionService,
              private uiService: UserInteractionsService,
              public settingsService: SettingsService,
              public appStorage: AppStorageService) {
    super();
  }

  ngOnInit() {
    this.audioChunk = this.audio.audiomanagers[0].mainchunk.clone();
    TrnEditorComponent.initialized.emit();
  }

  afterFirstInitialization() {
  }

  enableAllShortcuts() {
  }

  disableAllShortcuts() {
  }

  openSegment(index: number) {
    // only needed if an segment can be opened. For audio files smaller than 35 sec
  }

}
