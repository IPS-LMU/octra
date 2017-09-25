import {Component, EventEmitter, OnInit} from '@angular/core';
import {LinearEditorComponent} from '../linear-editor/linear-editor.component';
import {KeymappingService} from '../../core/shared/service/keymapping.service';
import {AudioService} from '../../core/shared/service/audio.service';
import {TranscriptionService} from '../../core/shared/service/transcription.service';
import {UserInteractionsService} from '../../core/shared/service/userInteractions.service';
import {SettingsService} from '../../core/shared/service/settings.service';
import {AppStorageService} from '../../core/shared/service/appstorage.service';

@Component({
  selector: 'app-new-editor',
  templateUrl: './new-editor.component.html',
  styleUrls: ['./new-editor.component.css']
})
export class NewEditorComponent implements OnInit {
  public static editorname = 'New Editor';
  public static initialized: EventEmitter<void> = new EventEmitter<void>();

  constructor(public audio: AudioService,
              public keyMap: KeymappingService,
              public transcrService: TranscriptionService,
              private uiService: UserInteractionsService,
              public settingsService: SettingsService,
              public appStorage: AppStorageService) {
  }

  ngOnInit() {
    LinearEditorComponent.initialized.emit();
  }

}
