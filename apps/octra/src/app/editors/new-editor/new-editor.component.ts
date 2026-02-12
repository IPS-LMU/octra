import { Component, EventEmitter, inject, OnInit } from '@angular/core';
import { AudioService, SettingsService } from '../../core/shared/service';
import { AppStorageService } from '../../core/shared/service/appstorage.service';
import { OCTRAEditor, OctraEditorRequirements } from '../octra-editor';

@Component({
  selector: 'octra-new-editor',
  templateUrl: './new-editor.component.html',
  styleUrls: ['./new-editor.component.scss'],
})
export class NewEditorComponent
  extends OCTRAEditor
  implements OnInit, OctraEditorRequirements
{
  audio = inject(AudioService);
  settingsService = inject(SettingsService);
  appStorage = inject(AppStorageService);

  public static editorname = 'New Editor';
  public initialized: EventEmitter<void> = new EventEmitter<void>();

  ngOnInit() {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  afterFirstInitialization() {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  enableAllShortcuts() {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  disableAllShortcuts() {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  openSegment(segment: {
    itemID: number;
    levelID: number;
  }) {
    // only needed if an segment can be opened. For audio files smaller than 35 sec
  }
}
