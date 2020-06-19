import {Component, EventEmitter, OnInit} from '@angular/core';
import {
  AudioService,
  KeymappingService,
  SettingsService,
  TranscriptionService,
  UserInteractionsService
} from '../../core/shared/service';
import {AppStorageService} from '../../core/shared/service/appstorage.service';
import {LinearEditorComponent} from '../linear-editor';
import {OCTRAEditor} from '../octra-editor';

@Component({
  selector: 'octra-new-editor',
  templateUrl: './new-editor.component.html',
  styleUrls: ['./new-editor.component.css']
})
export class NewEditorComponent extends OCTRAEditor implements OnInit {
  public static editorname = 'New Editor';
  public static initialized: EventEmitter<void> = new EventEmitter<void>();

  constructor(public audio: AudioService,
              public keyMap: KeymappingService,
              public transcrService: TranscriptionService,
              private uiService: UserInteractionsService,
              public settingsService: SettingsService,
              public appStorage: AppStorageService) {
    super();
  }

  ngOnInit() {
    LinearEditorComponent.initialized.emit();
  }

  afterFirstInitialization() {
  }

  enableAllShortcuts() {
  }

  disableAllShortcuts() {
  }

}
