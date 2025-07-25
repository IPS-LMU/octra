import {
  ChangeDetectorRef,
  Component,
  ComponentRef,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { hasProperty } from '@octra/utilities';
import { interval, timer } from 'rxjs';
import { editorComponents } from '../../../../editors/components';
import {
  OCTRAEditor,
  OctraEditorRequirements,
} from '../../../../editors/octra-editor';
import { InactivityModalComponent } from '../../../modals/inactivity-modal/inactivity-modal.component';
import { MissingPermissionsModalComponent } from '../../../modals/missing-permissions/missing-permissions.component';
import { OctraModalService } from '../../../modals/octra-modal.service';
import { OverviewModalComponent } from '../../../modals/overview-modal/overview-modal.component';
import {
  ModalEndAnswer,
  TranscriptionDemoEndModalComponent,
} from '../../../modals/transcription-demo-end/transcription-demo-end-modal.component';
import { TranscriptionGuidelinesModalComponent } from '../../../modals/transcription-guidelines-modal/transcription-guidelines-modal.component';
import { TranscriptionSendingModalComponent } from '../../../modals/transcription-sending-modal/transcription-sending-modal.component';
import {
  TranscriptionStopModalAnswer,
  TranscriptionStopModalComponent,
} from '../../../modals/transcription-stop-modal/transcription-stop-modal.component';
import { ProjectSettings } from '../../../obj/Settings';

import { LoadeditorDirective } from '../../../shared/directive/loadeditor.directive';

import { AsyncPipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { AnnotJSONConverter, Converter } from '@octra/annotation';
import {
  AudioManager,
  BrowserInfo,
  Shortcut,
  ShortcutGroup,
} from '@octra/web-media';
import { HotkeysEvent } from 'hotkeys-js';
import { AppInfo } from '../../../../app.info';
import { DefaultComponent } from '../../../component/default.component';
import { NavbarService } from '../../../component/navbar/navbar.service';
import { FastbarComponent } from '../../../component/taskbar/taskbar.component';
import { PromptModalComponent } from '../../../modals/prompt-modal/prompt-modal.component';
import { ShortcutsModalComponent } from '../../../modals/shortcuts-modal/shortcuts-modal.component';
import {
  AlertService,
  AudioService,
  SettingsService,
  UserInteractionsService,
} from '../../../shared/service';
import { AppStorageService } from '../../../shared/service/appstorage.service';
import { RoutingService } from '../../../shared/service/routing.service';
import { ShortcutService } from '../../../shared/service/shortcut.service';
import { LoginMode } from '../../../store';
import { ApplicationStoreService } from '../../../store/application/application-store.service';
import { AuthenticationStoreService } from '../../../store/authentication';
import { AnnotationStoreService } from '../../../store/login-mode/annotation/annotation.store.service';

@Component({
  selector: 'octra-transcription',
  templateUrl: './transcription.component.html',
  styleUrls: ['./transcription.component.scss'],
  imports: [
    NgClass,
    FastbarComponent,
    LoadeditorDirective,
    FormsModule,
    AsyncPipe,
    TranslocoPipe,
  ],
})
export class TranscriptionComponent
  extends DefaultComponent
  implements OnInit, OnDestroy
{
  router = inject(Router);
  audio = inject(AudioService);
  uiService = inject(UserInteractionsService);
  appStorage = inject(AppStorageService);
  shortcutService = inject(ShortcutService);
  navbarServ = inject(NavbarService);
  settingsService = inject(SettingsService);
  modService = inject(OctraModalService);
  private appStoreService = inject(ApplicationStoreService);
  langService = inject(TranslocoService);
  routingService = inject(RoutingService);
  private cd = inject(ChangeDetectorRef);
  private alertService = inject(AlertService);
  annotationStoreService = inject(AnnotationStoreService);
  private authService = inject(AuthenticationStoreService);

  get selectedTheme(): string {
    return this._selectedTheme;
  }

  get useMode(): string {
    return this._useMode;
  }

  modalShortcutsDialogue?: NgbModalRef;
  modalOverview?: NgbModalRef;
  transcrSendingModal?: NgbModalRef;
  modalGuidelines?: NgbModalRef;
  inactivityModal?: NgbModalRef;

  @ViewChild(LoadeditorDirective, { static: true })
  appLoadeditor!: LoadeditorDirective;

  public sendError = '';
  public saving = '';
  public interface?: string;
  public editorloaded = false;
  user?: number;
  public platform = BrowserInfo.platform;
  private _useMode = '';
  private _selectedTheme = '';
  private audioManager: AudioManager;

  modalVisiblities = {
    overview: false,
    inactivity: false,
    shortcuts: false,
    permissions: false,
    sending: false,
    demoEnd: false,
    guidelines: false,
  };

  private onAltSend = (
    keyboardEvent: KeyboardEvent,
    shortcut: Shortcut,
    hotKeyEvent: HotkeysEvent,
  ) => {
    if (
      this._useMode === LoginMode.ONLINE ||
      this._useMode === LoginMode.DEMO
    ) {
      if (
        ['SHIFT + ALT + 1', 'SHIFT + ALT + 2', 'SHIFT + ALT + 3'].includes(
          shortcut.keys.mac!,
        )
      ) {
        this.appStorage
          .afterSaving()
          .then(() => {
            if (shortcut.keys.mac! === 'SHIFT + ALT + 1') {
              this.sendTranscriptionForShortAudioFiles('bad');
              this.uiService.addElementFromEvent(
                'shortcut',
                {
                  value: 'send_transcription:1',
                },
                Date.now(),
                this.audio.audiomanagers[0].playPosition,
                undefined,
                undefined,
                undefined,
                this.interface,
              );
            } else if (shortcut.keys.mac! === 'SHIFT + ALT + 2') {
              this.sendTranscriptionForShortAudioFiles('middle');
              this.uiService.addElementFromEvent(
                'shortcut',
                {
                  value: 'send_transcription:2',
                },
                Date.now(),
                this.audio.audiomanagers[0].playPosition,
                undefined,
                undefined,
                undefined,
                this.interface,
              );
            } else if (shortcut.keys.mac! === 'SHIFT + ALT + 3') {
              this.sendTranscriptionForShortAudioFiles('good');
              this.uiService.addElementFromEvent(
                'shortcut',
                {
                  value: 'send_transcription:3',
                },
                Date.now(),
                this.audio.audiomanagers[0].playPosition,
                undefined,
                undefined,
                undefined,
                this.interface,
              );
            }
          })
          .catch((error) => {
            console.error(error);
          });
      }
    }
  };

  private onShortcutsModal = (
    keyboardEvent: KeyboardEvent,
    shortcut: Shortcut,
    hotKeyEvent: HotkeysEvent,
  ) => {
    if (!this.modalVisiblities.shortcuts) {
      this.openShortcutsModal();
    } else {
      this.modalShortcutsDialogue?.close();
      this.modalVisiblities.shortcuts = false;
    }
  };

  private onGuidelinesModal = (
    keyboardEvent: KeyboardEvent,
    shortcut: Shortcut,
    hotKeyEvent: HotkeysEvent,
  ) => {
    if (!this.modalVisiblities.guidelines) {
      this.openGuidelines();
    } else {
      this.modalGuidelines?.close();
      this.modalVisiblities.guidelines = false;
    }
  };

  private onOverviewModal = (
    keyboardEvent: KeyboardEvent,
    shortcut: Shortcut,
    hotKeyEvent: HotkeysEvent,
  ) => {
    if (!this.modalVisiblities.overview) {
      this.openOverview();
    } else {
      this.modalOverview?.close();
      this.modalVisiblities.overview = false;
    }
  };

  private modalShortcuts: ShortcutGroup = {
    name: 'modal shortcuts',
    enabled: true,
    items: [
      {
        name: 'shortcuts',
        title: 'shortcuts',
        focusonly: false,
        keys: {
          mac: 'ALT + 8',
          pc: 'ALT + 8',
        },
        callback: this.onShortcutsModal,
      },
      {
        name: 'guidelines',
        title: 'guidelines',
        focusonly: false,
        keys: {
          mac: 'ALT + 9',
          pc: 'ALT + 9',
        },
        callback: this.onGuidelinesModal,
      },
      {
        name: 'overview',
        title: 'overview',
        focusonly: false,
        keys: {
          mac: 'ALT + 0',
          pc: 'ALT + 0',
        },
        callback: this.onOverviewModal,
      },
    ],
  };

  public editorShortcuts: ShortcutGroup = {
    name: 'text editor',
    enabled: false,
    items: [],
  };

  public transcriptionShortcuts: ShortcutGroup = {
    name: 'transcription',
    enabled: true,
    items: [
      {
        name: 'feedback1',
        title: 'feedback and send 1',
        focusonly: false,
        keys: {
          mac: 'SHIFT + ALT + 1',
          pc: 'SHIFT + ALT + 1',
        },
        callback: this.onAltSend,
      },
      {
        name: 'feedback2',
        title: 'feedback and send 2',
        focusonly: false,
        keys: {
          mac: 'SHIFT + ALT + 2',
          pc: 'SHIFT + ALT + 2',
        },
        callback: this.onAltSend,
      },
      {
        name: 'feedback3',
        title: 'feedback and send 3',
        focusonly: false,
        keys: {
          mac: 'SHIFT + ALT + 3',
          pc: 'SHIFT + ALT + 3',
        },
        callback: this.onAltSend,
      },
    ],
  };

  showCommentSection = false;
  isInactivityModalVisible = false;

  get loaded(): boolean {
    return (
      this.audio.loaded && this.annotationStoreService.guidelines !== undefined
    );
  }

  get appc(): any {
    return this.settingsService.appSettings;
  }

  get projectsettings(): ProjectSettings {
    return this.settingsService.projectsettings!;
  }

  private _currentEditor!: ComponentRef<any>;

  get currentEditor(): ComponentRef<any> {
    return this._currentEditor;
  }

  private get appSettings() {
    return this.settingsService.appSettings;
  }

  get comment(): string {
    return this.annotationStoreService.comment;
  }

  constructor() {
    super();
    const appStorage = this.appStorage;

    this.audioManager = this.audio.audiomanagers[0];
    this.shortcutService.registerGeneralShortcutGroup(this.modalShortcuts);

    this.subscribe(this.audioManager.statechange, {
      next: async (state) => {
        if (!appStorage.playOnHover && !this.modalVisiblities.overview) {
          let caretpos = undefined;

          if (
            this.currentEditor !== undefined &&
            (this.currentEditor.instance as any).editor !== undefined
          ) {
            caretpos = (this.currentEditor.instance as any).editor
              .textSelection;
          }

          if (this.appStorage.interface) {
            // make sure that events from playonhover are not logged
            const currentEditorName = this.appStorage.interface;
            this.uiService.logAudioEvent(
              currentEditorName,
              state,
              this.audioManager.playPosition,
              caretpos,
              undefined,
              undefined,
            );
          }
        }
      },
      error: (error) => {
        console.error(error);
      },
    });

    this.subscribe(this.navbarServ.toolApplied, (toolName: string) => {
      switch (toolName) {
        case 'combinePhrases':
          this.alertService
            .showAlert(
              'success',
              this.langService.translate('tools.alerts.done', {
                value: toolName,
              }),
            )
            .catch((error) => {
              console.error(error);
            });
          if (
            this.currentEditor !== undefined &&
            (this.currentEditor.instance as any).editor !== undefined
          ) {
            (this._currentEditor.instance as any).update();
          }
          break;
      }
    });

    this.subscribe(this.audio.missingPermission, () => {
      this.modService.openModal(
        MissingPermissionsModalComponent,
        MissingPermissionsModalComponent.options,
      );
    });
  }

  abortTranscription = () => {
    if ([LoginMode.ONLINE, LoginMode.URL].includes(this.appStorage.useMode)) {
      this.modService
        .openModal(
          TranscriptionStopModalComponent,
          TranscriptionStopModalComponent.options,
        )
        .then((answer: any) => {
          if (answer === TranscriptionStopModalAnswer.QUIT) {
            this.annotationStoreService.quit(true, false, false);
          } else if (answer === TranscriptionStopModalAnswer.QUITRELEASE) {
            this.annotationStoreService.quit(true, true, false);
          }
          // else do nothing
        })
        .catch((error) => {
          console.error(error);
        });
    } else {
      this.annotationStoreService.quit(false, false, false);
    }
  };

  ngOnInit() {
    this._useMode = this.appStorage.useMode;
    this._selectedTheme = !this.projectsettings?.octra?.theme
      ? 'default'
      : this.projectsettings?.octra.theme;
    this.showCommentSection =
      this.settingsService.isTheme('shortAudioFiles') &&
      (this._useMode === 'online' || this._useMode === 'demo');

    this.subscribe(this.appStoreService.shortcutsEnabled$, {
      next: (shortcutsEnabled) => {
        if (this._currentEditor?.instance) {
          if (shortcutsEnabled) {
            (this._currentEditor.instance as OCTRAEditor).enableAllShortcuts();
            this.shortcutService.enableAll();
          } else {
            (this._currentEditor.instance as OCTRAEditor).disableAllShortcuts();
            this.shortcutService.disableAll();
          }
        }
      },
    });

    this.annotationStoreService.overwriteTidyUpAnnotation();

    this.navbarServ.interfaces = this.projectsettings.interfaces;
    this.shortcutService.registerGeneralShortcutGroup(
      this.transcriptionShortcuts,
    );

    /**
     for (const marker of this.transcrService.guidelines.markers) {
     if (marker.type === 'break') {
     this.transcrService.breakMarker = marker;
     break;
     }
     }
     **/

    // this.transcrService.annotation.audiofile.sampleRate = this.audioManager.ressource.info.sampleRate;
    this.navbarServ.showInterfaces = this.projectsettings.navigation.interfaces;
    this.checkCurrentEditor();
    this.interface = this.appStorage.interface;

    this.subscribe(this.navbarServ.interfacechange, (editor) => {
      this.changeEditor(editor).catch((error) => {
        console.error(error);
      });
    });

    if (this._useMode === LoginMode.ONLINE) {
      // console.log(`opened job ${this.appStorage.dataID} in project ${this.appStorage.onlineSession?.loginData?.project}`);
    }

    // first change
    if (this.interface) {
      this.changeEditor(this.interface)
        .then(() => {
          if (this.routingService.staticQueryParams.auto_playback !== false) {
            (this._currentEditor.instance as any).afterFirstInitialization();
          }
        })
        .catch((error) => {
          console.error(error);
        });
    }

    // because of the loading data before through the loading component you can be sure the audio was loaded
    // correctly

    this.subscribe(this.appStorage.saving, (saving: string) => {
      if (saving === 'saving') {
        this.saving = 'saving';
      } else if (saving === 'error') {
        this.saving = 'error';
      } else if (saving === 'success') {
        this.subscribe(timer(200), () => {
          this.saving = 'success';
        });
      }
    });

    this.navbarServ.showExport =
      this.settingsService.projectsettings?.navigation?.export === true;

    if (
      this._useMode === LoginMode.ONLINE ||
      this._useMode === LoginMode.DEMO
    ) {
      if (
        this.settingsService.appSettings.octra.inactivityNotice !== undefined &&
        this.settingsService.appSettings.octra.inactivityNotice.showAfter !==
          undefined &&
        this.settingsService.appSettings.octra.inactivityNotice.showAfter > 0
      ) {
        // if waitTime is 0 the inactivity modal isn't shown
        let waitTime =
          this.settingsService.appSettings.octra.inactivityNotice.showAfter;
        waitTime = waitTime * 60 * 1000;
        this.subscribe(interval(5000), () => {
          if (
            Date.now() - this.uiService.lastAction > waitTime &&
            !this.modalVisiblities.inactivity
          ) {
            if (
              this.inactivityModal === undefined &&
              !this.isInactivityModalVisible
            ) {
              this.isInactivityModalVisible = true;
              this.modService
                .openModal(
                  InactivityModalComponent,
                  InactivityModalComponent.options,
                )
                .then((answer) => {
                  this.isInactivityModalVisible = false;
                  switch (answer) {
                    case 'quit':
                      this.abortTranscription();
                      break;
                    case 'new':
                      this.closeTranscriptionAndGetNew();
                      break;
                    case 'continue':
                      // reload OCTRA to continue
                      break;
                  }
                  this.uiService.lastAction = Date.now();
                  this.inactivityModal = undefined;
                })
                .catch((error) => {
                  this.inactivityModal = undefined;
                  console.error(error);
                });
            }
          }
        });
      }
    }

    this.cd.markForCheck();
    this.cd.detectChanges();
    this.appStorage.saveCurrentPageAsLastPage();
  }

  private async checkCurrentEditor() {
    const currentEditor = this.appStorage.interface;
    const found = this.projectsettings.interfaces.find((x) => {
      return currentEditor === x;
    });

    if (found === undefined) {
      this.appStorage.interface = this.projectsettings.interfaces[0];
    }
  }

  changeEditor(name: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.editorloaded = false;
      this.cd.detectChanges();
      let comp: any;

      if (name === undefined || name === '') {
        // fallback to last editor
        name = editorComponents[editorComponents.length - 1].name;
      }
      for (const editorComponent of editorComponents) {
        if (name === editorComponent.name) {
          this.appStorage.interface = name;
          this.interface = name;
          comp = editorComponent.editor;
          break;
        }
      }

      if (!(comp === undefined)) {
        if (this.appLoadeditor !== undefined) {
          this.subscribe(timer(20), () => {
            const viewContainerRef = this.appLoadeditor.viewContainerRef;
            viewContainerRef.clear();

            this._currentEditor =
              viewContainerRef.createComponent<OCTRAEditor>(comp);

            const id = this.subscribe(
              this._currentEditor.instance.initialized,
              () => {
                this.editorloaded = true;
                this.subscriptionManager.removeById(id);
                this.cd.detectChanges();

                resolve();
              },
            );
            if (hasProperty(this.currentEditor.instance as any, 'openModal')) {
              this.subscribe(
                (this.currentEditor.instance as any).openModal,
                () => {
                  (this.currentEditor.instance as any).disableAllShortcuts();

                  this.subscriptionManager.removeByTag(
                    'overview modal transcr send',
                  );
                  this.modalOverview = this.modService.openModalRef(
                    OverviewModalComponent,
                    OverviewModalComponent.options,
                  );
                  this.subscribe(
                    this.modalOverview.componentInstance.transcriptionSend,
                    () => {
                      this.appStoreService.setShortcutsEnabled(true);
                      this.modalOverview?.close();
                      this.modalVisiblities.overview = false;
                      timer(1000).subscribe({
                        next: () => {
                          this.onSendNowClick();
                        },
                      });
                    },
                    'overview modal transcr send',
                  );

                  this.modalOverview.result
                    .then(() => {
                      this.appStoreService.setShortcutsEnabled(true);
                    })
                    .catch(() => {
                      this.appStoreService.setShortcutsEnabled(true);
                    });
                },
              );
            }

            this.uiService.addElementFromEvent(
              'editor:changed',
              { value: name },
              Date.now(),
              undefined,
              undefined,
              undefined,
              undefined,
              'editors',
            );
            this.cd.detectChanges();
          });
        } else {
          reject('ERROR appLoadeditor is undefined');
          console.error('ERROR appLoadeditor is undefined');
        }
      } else {
        reject('ERROR appLoadeditor is undefined');
        console.error('ERROR editor component is undefined');
      }
    });
  }

  public onSendNowClick() {
    // this.sendOk = true;

    if (this._useMode === LoginMode.ONLINE) {
      if (this._useMode === LoginMode.ONLINE) {
        this.annotationStoreService.sendOnlineAnnotation();
      }
    } else if (this._useMode === LoginMode.DEMO) {
      // only if opened
      if (this.modalVisiblities.overview) {
        this.modalOverview!.close();
      }

      this.modService
        .openModal(
          TranscriptionDemoEndModalComponent,
          TranscriptionDemoEndModalComponent.options,
        )
        .then((action: any) => {
          this.appStorage.savingNeeded = false;

          switch (action) {
            case ModalEndAnswer.CANCEL:
              break;
            case ModalEndAnswer.QUIT:
              this.abortTranscription();
              break;
            case ModalEndAnswer.CONTINUE:
              this.transcrSendingModal = this.modService.openModalRef(
                TranscriptionSendingModalComponent,
                TranscriptionSendingModalComponent.options,
              );
              this.subscribe(timer(1000), () => {
                // simulate nextTranscription
                this.transcrSendingModal!.close();
                this.reloadDemo();
              });
              break;
          }
        })
        .catch((error) => {
          console.error(error);
        });
    }
  }

  onSendButtonClick() {
    const showOverview =
      this.projectsettings.octra?.showOverviewIfTranscriptNotValid === undefined
        ? true
        : this.projectsettings.octra?.sendValidatedTranscriptionOnly;
    const validTranscriptOnly =
      this.projectsettings.octra?.sendValidatedTranscriptionOnly === undefined
        ? false
        : this.projectsettings.octra?.sendValidatedTranscriptionOnly;

    this.annotationStoreService.validateAll();
    const validTranscript = this.annotationStoreService.transcriptValid;

    if (
      (!validTranscript && showOverview) ||
      (validTranscriptOnly && !validTranscript)
    ) {
      this.modalOverview = this.modService.openModalRef(
        OverviewModalComponent,
        OverviewModalComponent.options,
      );
      this.subscriptionManager.removeByTag('overview modal transcr send');
      this.subscribe(
        this.modalOverview.componentInstance.transcriptionSend,
        () => {
          this.appStoreService.setShortcutsEnabled(true);
          this.modalOverview?.close();
          this.modalVisiblities.overview = false;
          timer(1000).subscribe({
            next: () => {
              this.onSendNowClick();
            },
          });
        },
        'overview modal transcr send',
      );
    } else {
      this.onSendNowClick();
    }
  }

  reloadDemo() {
    this.annotationStoreService.endTranscription(true);
    this.clearDataPermanently();
    this.authService.loginDemo();
  }

  closeTranscriptionAndGetNew() {
    // close current session
    if (this._useMode === LoginMode.ONLINE) {
    } else if (this._useMode === LoginMode.DEMO) {
      this.reloadDemo();
    }
  }

  clearDataPermanently() {
    // replace with store method
    this.appStorage.clearAnnotationPermanently(); // ok
    this.appStorage.feedback = {}; // ok
    this.annotationStoreService.changeComment(''); // ok
    this.appStorage.clearLoggingDataPermanently(); // ok
    this.uiService.elements = [];
  }

  public onSaveTranscriptionButtonClicked() {
    const aType = this.routingService.staticQueryParams.annotationExportType;
    let converter: Converter | undefined = undefined;

    if (!aType || aType === 'AnnotJSON') {
      converter = new AnnotJSONConverter();
    } else {
      converter = AppInfo.converters.find((a) => a.name === aType);

      if (!converter) {
        window.parent.postMessage(
          {
            error: `Export Type ${aType} is not supported.`,
            status: 'error',
          },
          '*',
        );
        return;
      }
    }

    const oannotjson = this.annotationStoreService.transcript!.serialize(
      this.audio.audioManager.resource.info.fullname,
      this.audio.audioManager.resource.info.sampleRate,
      this.audio.audioManager.resource.info.duration,
    );
    const result = converter.export(
      oannotjson,
      this.audio.audioManager.resource.getOAudioFile(),
      0,
    );

    if (!result.error && result.file) {
      // send result to iframe owner
      window.parent.postMessage(
        {
          data: {
            annotation: result.file,
          },
          status: 'success',
        },
        '*',
      );
    } else {
      console.error(`Annotation conversion failed: ${result.error}`);
      window.parent.postMessage(
        {
          error: `Annotation conversion failed: ${result.error}`,
          status: 'error',
        },
        '*',
      );
    }
  }

  public sendTranscriptionForShortAudioFiles(type: 'bad' | 'middle' | 'good') {
    switch (type) {
      case 'bad':
        this.appStorage.feedback = 'SEVERE';
        break;
      case 'middle':
        this.appStorage.feedback = 'SLIGHT';
        break;
      case 'good':
        this.appStorage.feedback = 'OK';
        break;
      default:
    }

    this.onSendButtonClick();
  }

  openGuidelines() {
    this.modalGuidelines = this.modService.openModalRef(
      TranscriptionGuidelinesModalComponent,
      TranscriptionGuidelinesModalComponent.options,
    );
    this.appStoreService.setShortcutsEnabled(false);
    this.modalGuidelines.result
      .then(() => {
        this.appStoreService.setShortcutsEnabled(true);
        this.modalVisiblities.guidelines = false;
      })
      .catch(() => {
        this.appStoreService.setShortcutsEnabled(true);
      });
    this.modalVisiblities.guidelines = true;
  }

  openOverview() {
    this.annotationStoreService.analyse();
    this.modalOverview = this.modService.openModalRef(
      OverviewModalComponent,
      OverviewModalComponent.options,
    );

    this.appStoreService.setShortcutsEnabled(false);
    this.subscriptionManager.removeByTag('overview modal transcr send');
    this.subscribe(
      this.modalOverview.componentInstance.transcriptionSend,
      () => {
        const editor = this._currentEditor.instance as OctraEditorRequirements;
        this.appStoreService.setShortcutsEnabled(true);
        this.modalOverview?.close();
        this.modalVisiblities.overview = false;
        timer(1000).subscribe({
          next: () => {
            this.onSendNowClick();
          },
        });
      },
      'overview modal transcr send',
    );

    this.modalOverview.result
      .then(() => {
        this.appStoreService.setShortcutsEnabled(true);
        this.modalVisiblities.overview = false;
      })
      .catch((err) => {
        this.appStoreService.setShortcutsEnabled(true);
        this.modalVisiblities.overview = false;
      });
    this.modalVisiblities.overview = true;
  }

  openShortcutsModal() {
    this.modalShortcutsDialogue = this.modService.openModalRef(
      ShortcutsModalComponent,
      ShortcutsModalComponent.options,
    );
    this.appStoreService.setShortcutsEnabled(false);
    this.modalShortcutsDialogue.result
      .then(() => {
        this.appStoreService.setShortcutsEnabled(true);
        this.modalVisiblities.shortcuts = false;
      })
      .catch(() => {
        this.appStoreService.setShortcutsEnabled(true);
      });
    this.modalVisiblities.shortcuts = true;
  }

  openPromptModal() {
    this.modService.openModalRef(
      PromptModalComponent,
      PromptModalComponent.options,
    );
  }
}
