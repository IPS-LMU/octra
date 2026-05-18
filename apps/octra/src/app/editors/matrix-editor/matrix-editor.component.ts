import { ChangeDetectionStrategy, Component, EventEmitter, inject, OnInit } from '@angular/core';
import { AnnotationLevelType } from '@octra/annotation';
import { OctraComponentsModule } from '@octra/ngx-components';
import { OctraUtilitiesModule } from '@octra/ngx-utilities';
import { AudioChunk } from '@octra/web-media';
import { NavbarService } from '../../core/component/navbar/navbar.service';
import { TranscrOverviewComponent } from '../../core/component/transcr-overview';
import { AudioService, SettingsService } from '../../core/shared/service';
import { AppStorageService } from '../../core/shared/service/appstorage.service';
import { AnnotationStoreService } from '../../core/store/login-mode/annotation/annotation.store.service';
import { TwoDEditorComponent } from '../2D-editor';
import { OCTRAEditor, OctraEditorRequirements, SupportedOctraEditorMetaData } from '../octra-editor';

@Component({
  selector: 'octra-matrix-editor',
  templateUrl: './matrix-editor.component.html',
  styleUrls: ['./matrix-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OctraComponentsModule, OctraUtilitiesModule, TranscrOverviewComponent],
})
export class MatrixEditorComponent extends OCTRAEditor implements OnInit, OctraEditorRequirements {
  audio = inject(AudioService);
  settingsService = inject(SettingsService);
  appStorage = inject(AppStorageService);
  annotationStoreService = inject(AnnotationStoreService);
  navbarService = inject(NavbarService);

  static override meta: SupportedOctraEditorMetaData = {
    name: 'Matrix-Editor',
    supportedLevelTypes: [AnnotationLevelType.SEGMENT],
    translate: 'interfaces.Matrix-Editor',
    icon: 'bi bi-table',
    supportsASR: false,
  };

  public initialized: EventEmitter<void> = new EventEmitter<void>();

  public audioChunk!: AudioChunk;

  ngOnInit() {
    this.initialized.emit();
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  afterFirstInitialization() {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  enableAllShortcuts() {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  disableAllShortcuts() {}

  overviewStatusChange($event: { status: 'loading' | 'ready' | 'updated' }) {
    if ($event.status === 'ready') {
      this.initialized.emit();
    }
  }

  override openSegment($event: { levelID: number; itemID: number }) {
    this.navbarService.interfacechange.emit({
      editor: TwoDEditorComponent,
      context: {
        command: 'open unit',
        ...$event,
      },
    });
  }

  override ngOnDestroy() {
    super.ngOnDestroy();
  }
}
