import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, inject, OnInit, ViewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Actions, ofType } from '@ngrx/effects';
import { AnnotationLevelType, AnnotJSONConverter, OctraAnnotation } from '@octra/annotation';
import { stringifyQueryParams } from '@octra/utilities';
import { AudioCutter } from '@octra/web-media';
import { timer } from 'rxjs';
import { EmuWebAppInMessageEventData, EmuWebAppOutMessageEventData } from '../../core/obj/emu-webapp.types';
import { AudioService, SettingsService } from '../../core/shared/service';
import { AppStorageService } from '../../core/shared/service/appstorage.service';
import { ShortcutService } from '../../core/shared/service/shortcut.service';
import { AnnotationActions } from '../../core/store/login-mode/annotation/annotation.actions';
import { AnnotationStoreService } from '../../core/store/login-mode/annotation/annotation.store.service';
import { OCTRAEditor, OctraEditorRequirements, SupportedOctraEditorMetaData } from '../octra-editor';

@Component({
  selector: 'octra-emu-webapp',
  templateUrl: './emu-webapp.component.html',
  styleUrls: ['./emu-webapp.component.scss'],
})
export class EmuWebAppEditorComponent extends OCTRAEditor implements OctraEditorRequirements, AfterViewInit, OnInit {
  audio = inject(AudioService);
  settingsService = inject(SettingsService);
  appStorage = inject(AppStorageService);
  sanitizer = inject(DomSanitizer);
  annotationStoreService = inject(AnnotationStoreService);
  actions$ = inject(Actions);
  shortcutService = inject(ShortcutService);

  static meta: SupportedOctraEditorMetaData = {
    name: 'EMU',
    supportedLevelTypes: [AnnotationLevelType.SEGMENT, AnnotationLevelType.ITEM, AnnotationLevelType.EVENT],
    editor: EmuWebAppEditorComponent,
    label: 'EMU-webApp',
    iconURL: '',
  };
  public initialized: EventEmitter<void> = new EventEmitter<void>();

  @ViewChild('iframe') iframe?: ElementRef<HTMLIFrameElement>;

  protected error?: string;
  protected iframeURL?: SafeResourceUrl;

  ngOnInit() {
    this.shortcutService.initShortcuts();
  }

  ngAfterViewInit() {
    if (this.audio.audioManager.resource.info.size <= 1024 * 1024 * 50) {
      if (this.settingsService.appSettings.octra.plugins?.emuWebApp?.url) {
        this.iframeURL = this.sanitizer.bypassSecurityTrustResourceUrl(
          `${this.settingsService.appSettings.octra.plugins?.emuWebApp?.url}${stringifyQueryParams({
            listenForMessages: true,
          })}`,
        );
      } else {
        this.error = 'Missing EMU webApp URL';
        this.initialized.emit();
      }
    } else {
      this.error = 'The EMU-webApp editor only supports audio files with a size smaller or equal 50 MB.';
      this.initialized.emit();
    }
  }

  afterIframeLoaded() {
    this.subscribe(
      this.actions$.pipe(
        ofType(
          AnnotationActions.addAnnotationLevel.do,
          AnnotationActions.removeAnnotationLevel.do,
          AnnotationActions.duplicateLevel.do,
          AnnotationActions.changeLevelName.do,
        ),
      ),
      {
        next: () => {
          this.updateEmuWebAppOptions();
        },
      },
    );

    this.subscriptionManager.removeByTag('watch annotation changes');
    this.subscribe(this.actions$.pipe(ofType(AnnotationActions.overviewModal.open)), {
      next: () => {
        this.subscribe(
          this.annotationStoreService.transcript$,
          {
            next: () => {
              this.updateEmuWebAppOptions();
            },
          },
          'watch annotation changes',
        );
      },
    });

    this.subscribe(this.actions$.pipe(ofType(AnnotationActions.overviewModal.close, AnnotationActions.overviewModal.send)), {
      next: () => {
        this.subscriptionManager.removeByTag('watch annotation changes');
      },
    });
    this.updateEmuWebAppOptions();

    try {
      const iframeDocument = this.iframe.nativeElement!.contentWindow.document;
      iframeDocument.addEventListener('keydown', (e) => {
        if (e.altKey) {
          if (!e.shiftKey) {
            if (e.code === 'Digit8') {
              // ALT + 8
              this.shortcutService.triggerGeneralShortcuts.emit({
                shortcut: 'ALT + 8',
              });
            } else if (e.code === 'Digit9') {
              // ALT + 9
              this.shortcutService.triggerGeneralShortcuts.emit({
                shortcut: 'ALT + 9',
              });
            } else if (e.code === 'Digit0') {
              // ALT + 0
              this.shortcutService.triggerGeneralShortcuts.emit({
                shortcut: 'ALT + 0',
              });
            }
          } else {
            if (e.code === 'Digit1') {
              // SHIFT + ALT + 1
              this.shortcutService.triggerGeneralShortcuts.emit({
                shortcut: 'SHIFT + ALT + 1',
              });
            } else if (e.code === 'Digit2') {
              this.shortcutService.triggerGeneralShortcuts.emit({
                shortcut: 'SHIFT + ALT + 1',
              });
            } else if (e.code === 'Digit3') {
              this.shortcutService.triggerGeneralShortcuts.emit({
                shortcut: 'SHIFT + ALT + 3',
              });
            }
          }
          e.preventDefault();
          e.stopPropagation();
        }
      });
    } catch (e) {
      console.warn("Shortcuts for OCTRA can't be triggered while using Emu-webApp because origins are not the same.");
    }
  }

  updateEmuWebAppOptions() {
    this.subscriptionManager.removeByTag('init emu');
    this.subscribe(
      timer(1000),
      {
        next: async () => {
          const resource = this.audio.audioManager.resource;
          const params = {
            listenForMessages: true,
            disableBundleListSidebar: true,
            saveToWindowParent: false,
            labelType: 'annotJSON',
          };

          let audioArrayBuffer: ArrayBuffer | undefined;
          if (resource.info.type.includes('wav')) {
            audioArrayBuffer = resource.arraybuffer;
          } else {
            const audioCutter = new AudioCutter(resource.info);
            const buffer = (
              await audioCutter.cutAudioFileFromChannelData(resource.info, resource.info.name, this.audio.audioManager.channel, {
                number: 1,
                sampleStart: 0,
                sampleDur: resource.info.duration.samples,
              })
            ).uint8Array;
            audioArrayBuffer = buffer.buffer as ArrayBuffer;
          }

          const command: EmuWebAppInMessageEventData = {
            type: 'command',
            command: 'load',
            params,
            audioArrayBuffer,
            annotation: JSON.parse(
              new AnnotJSONConverter().export(
                this.annotationStoreService.transcript.serialize(resource.info.fullname, resource.info.sampleRate, resource.info.duration),
              ).file!.content,
            ),
          };
          this.iframe.nativeElement.contentWindow.postMessage(command, '*');

          this.initialized.emit();
        },
      },
      'init emu',
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  afterFirstInitialization() {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  enableAllShortcuts() {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  disableAllShortcuts() {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  openSegment(item: { levelID: number; itemID: number }) {
    // only needed if an segment can be opened. For audio files smaller than 35 sec
  }

  @HostListener('window:message', ['$event'])
  windowMessageReceived(event: MessageEvent) {
    const url = this.settingsService.appSettings.octra.plugins?.emuWebApp?.url.replace(/(^https?:\/\/[^/]+)(.*)/g, '$1');

    if (url === event.origin) {
      const data = event.data as EmuWebAppOutMessageEventData;
      if (data.data?.annotation && data.trigger === 'autoSave') {
        const anno = OctraAnnotation.deserialize(data.data.annotation);
        anno.changeCurrentLevelIndex(this.annotationStoreService.transcript.selectedLevelIndex);
        this.annotationStoreService.overwriteTranscript(anno);
      }
    }
  }
}
