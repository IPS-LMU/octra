import { Component, EventEmitter, OnInit } from '@angular/core';
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
  public static editorname = 'New Editor';
  public initialized: EventEmitter<void> = new EventEmitter<void>();

  constructor(
    public audio: AudioService,
    public settingsService: SettingsService,
    public appStorage: AppStorageService,
  ) {
    super();
  }

  ngOnInit() {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  afterFirstInitialization() {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  enableAllShortcuts() {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  disableAllShortcuts() {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  openSegment(index: number) {
    // only needed if an segment can be opened. For audio files smaller than 35 sec
  }
}
