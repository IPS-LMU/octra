import {
  ChangeDetectorRef,
  Component,
  ComponentFactoryResolver,
  ComponentRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoService } from '@ngneat/transloco';
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

import {
  AlertService,
  AudioService,
  KeymappingService,
  SettingsService,
  UserInteractionsService,
} from '../../../shared/service';
import { AppStorageService } from '../../../shared/service/appstorage.service';
import { BugReportService } from '../../../shared/service/bug-report.service';
import { NavbarService } from '../../../component/navbar/navbar.service';
import { LoginMode } from '../../../store';
import { ShortcutsModalComponent } from '../../../modals/shortcuts-modal/shortcuts-modal.component';
import { PromptModalComponent } from '../../../modals/prompt-modal/prompt-modal.component';
import { OctraAPIService } from '@octra/ngx-octra-api';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { DefaultComponent } from '../../../component/default.component';
import { AnnotationStoreService } from '../../../store/login-mode/annotation/annotation.store.service';
import { AuthenticationStoreService } from '../../../store/authentication';
import {
  AudioManager,
  BrowserInfo,
  ShortcutGroup,
  ShortcutManager,
} from '@octra/web-media';
import { PartiturConverter } from '@octra/annotation';
import X2JS from 'x2js';

@Component({
  selector: 'octra-transcription',
  templateUrl: './transcription.component.html',
  styleUrls: ['./transcription.component.scss'],
})
export class TranscriptionComponent
  extends DefaultComponent
  implements OnInit, OnDestroy
{
  get selectedTheme(): string {
    return this._selectedTheme;
  }

  get useMode(): string {
    return this._useMode;
  }

  public waitForSend = false;
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
  private sendOk = false;
  private _useMode = '';
  private _selectedTheme = '';
  private levelSubscriptionID = 0;
  private audioManager: AudioManager;

  private shortcutManager: ShortcutManager;

  modalVisiblities = {
    overview: false,
    inactivity: false,
    shortcuts: false,
    permissions: false,
    sending: false,
    demoEnd: false,
    guidelines: false,
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
      },
      {
        name: 'guidelines',
        title: 'guidelines',
        focusonly: false,
        keys: {
          mac: 'ALT + 9',
          pc: 'ALT + 9',
        },
      },
      {
        name: 'overview',
        title: 'overview',
        focusonly: false,
        keys: {
          mac: 'ALT + 0',
          pc: 'ALT + 0',
        },
      },
    ],
  };

  public generalShortcuts: ShortcutGroup = {
    name: 'general shortcuts',
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
      },
      {
        name: 'feedback2',
        title: 'feedback and send 2',
        focusonly: false,
        keys: {
          mac: 'SHIFT + ALT + 2',
          pc: 'SHIFT + ALT + 2',
        },
      },
      {
        name: 'feedback3',
        title: 'feedback and send 3',
        focusonly: false,
        keys: {
          mac: 'SHIFT + ALT + 3',
          pc: 'SHIFT + ALT + 3',
        },
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

  get responsive(): boolean {
    return this.settingsService.responsive.enabled;
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

  constructor(
    public router: Router,
    private _componentFactoryResolver: ComponentFactoryResolver,
    public audio: AudioService,
    public uiService: UserInteractionsService,
    public appStorage: AppStorageService,
    public keyMap: KeymappingService,
    public navbarServ: NavbarService,
    public settingsService: SettingsService,
    public modService: OctraModalService,
    private modalService: NgbModal,
    public langService: TranslocoService,
    private api: OctraAPIService,
    private bugService: BugReportService,
    private cd: ChangeDetectorRef,
    private alertService: AlertService,
    public annotationStoreService: AnnotationStoreService,
    private authService: AuthenticationStoreService
  ) {
    super();
    this.audioManager = this.audio.audiomanagers[0];

    this.shortcutManager = new ShortcutManager();
    this.shortcutManager.registerShortcutGroup(this.modalShortcuts);

    this.subscrManager.add(
      this.audioManager.statechange.subscribe(
        async (state) => {
          if (!appStorage.playonhover && !this.modalVisiblities.overview) {
            let caretpos = -1;

            if (
              this.currentEditor !== undefined &&
              (this.currentEditor.instance as any).editor !== undefined
            ) {
              caretpos = (this.currentEditor.instance as any).editor.caretpos;
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
                undefined
              );
            }
          }
        },
        (error) => {
          console.error(error);
        }
      )
    );

    this.subscrManager.add(
      this.keyMap.onShortcutTriggered.subscribe((event) => {
        if (
          this._useMode === LoginMode.ONLINE ||
          this._useMode === LoginMode.DEMO
        ) {
          if (
            ['SHIFT + ALT + 1', 'SHIFT + ALT + 2', 'SHIFT + ALT + 3'].includes(
              event.shortcut
            )
          ) {
            event.event.preventDefault();
            this.waitForSend = true;

            this.appStorage
              .afterSaving()
              .then(() => {
                this.waitForSend = false;
                if (event.shortcut === 'SHIFT + ALT + 1') {
                  this.sendTranscriptionForShortAudioFiles('bad');
                  this.uiService.addElementFromEvent(
                    'shortcut',
                    {
                      value: 'send_transcription:1',
                    },
                    Date.now(),
                    this.audio.audiomanagers[0].playPosition,
                    -1,
                    undefined,
                    undefined,
                    this.interface
                  );
                } else if (event.shortcut === 'SHIFT + ALT + 2') {
                  this.sendTranscriptionForShortAudioFiles('middle');
                  this.uiService.addElementFromEvent(
                    'shortcut',
                    {
                      value: 'send_transcription:2',
                    },
                    Date.now(),
                    this.audio.audiomanagers[0].playPosition,
                    -1,
                    undefined,
                    undefined,
                    this.interface
                  );
                } else if (event.shortcut === 'SHIFT + ALT + 3') {
                  this.sendTranscriptionForShortAudioFiles('good');
                  this.uiService.addElementFromEvent(
                    'shortcut',
                    {
                      value: 'send_transcription:3',
                    },
                    Date.now(),
                    this.audio.audiomanagers[0].playPosition,
                    -1,
                    undefined,
                    undefined,
                    this.interface
                  );
                }
              })
              .catch((error) => {
                console.error(error);
              });
          }
        }
      })
    );

    this.subscrManager.add(
      this.navbarServ.toolApplied.subscribe((toolName: string) => {
        switch (toolName) {
          case 'combinePhrases':
            this.alertService
              .showAlert(
                'success',
                this.langService.translate('tools.alerts.done', {
                  value: toolName,
                })
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
      })
    );

    this.subscrManager.add(
      this.modService.showmodal.subscribe(
        (event: { type: string; data: any; emitter: any }) => {
          if (
            this.currentEditor !== undefined &&
            (this.currentEditor.instance as any).editor !== undefined
          ) {
            const editor = this._currentEditor
              .instance as OctraEditorRequirements;
            editor.disableAllShortcuts();
          }
        }
      )
    );

    this.subscrManager.add(
      this.modService.closemodal.subscribe(() => {
        if (
          this.currentEditor !== undefined &&
          (this.currentEditor.instance as any).editor !== undefined
        ) {
          const editor = this._currentEditor
            .instance as OctraEditorRequirements;
          editor.enableAllShortcuts();
        }
      })
    );

    this.subscrManager.add(
      this.audio.missingPermission.subscribe(() => {
        this.modService.openModal(
          MissingPermissionsModalComponent,
          MissingPermissionsModalComponent.options
        );
      })
    );
  }

  abortTranscription = () => {
    if (
      (this._useMode === LoginMode.ONLINE ||
        this._useMode === LoginMode.DEMO) &&
      this.projectsettings.octra !== undefined &&
      this.projectsettings.octra.theme !== undefined &&
      this.settingsService.isTheme('shortAudioFiles')
    ) {
      // clear transcription

      this.annotationStoreService.endTranscription();
      this.annotationStoreService.quit(true, true);
    } else {
      // TODO check other themes than shortAudioFiles
      this.modService
        .openModal(
          TranscriptionStopModalComponent,
          TranscriptionStopModalComponent.options
        )
        .then((answer: any) => {
          if (answer === TranscriptionStopModalAnswer.QUIT) {
            this.logout(false);
          }
        })
        .catch((error) => {
          console.error(error);
        });
    }
  };

  ngOnInit() {
    this._useMode = this.appStorage.useMode;
    this._selectedTheme =
      this.projectsettings?.octra === undefined ||
      this.projectsettings?.octra?.theme === undefined
        ? 'default'
        : this.projectsettings?.octra.theme;
    this.showCommentSection =
      (this.settingsService.isTheme('shortAudioFiles') ||
        this.settingsService.isTheme('korbinian')) &&
      (this._useMode === 'online' || this._useMode === 'demo');

    /*
    this.subscrManager.add(
      this.transcrService.alertTriggered.subscribe((alertConfig) => {
        this.alertService.showAlert(
          alertConfig.type,
          alertConfig.data,
          alertConfig.unique,
          alertConfig.duration
        );
      })
    );

     */

    this.navbarServ.interfaces = this.projectsettings.interfaces;

    this.keyMap.registerGeneralShortcutGroup(this.generalShortcuts);

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

    this.subscrManager.add(
      this.navbarServ.interfacechange.subscribe((editor) => {
        this.changeEditor(editor).catch((error) => {
          console.error(error);
        });
      })
    );

    if (this._useMode === LoginMode.ONLINE) {
      // console.log(`opened job ${this.appStorage.dataID} in project ${this.appStorage.onlineSession?.loginData?.project}`);
    }

    // first change
    if (this.interface) {
      this.changeEditor(this.interface)
        .then(() => {
          (this._currentEditor.instance as any).afterFirstInitialization();
        })
        .catch((error) => {
          console.error(error);
        });
    }

    // because of the loading data before through the loading component you can be sure the audio was loaded
    // correctly

    this.subscrManager.add(
      this.appStorage.saving.subscribe((saving: string) => {
        if (saving === 'saving') {
          this.saving = 'saving';
        } else if (saving === 'error') {
          this.saving = 'error';
        } else if (saving === 'success') {
          this.subscrManager.add(
            timer(200).subscribe(() => {
              this.saving = 'success';
            })
          );
        }
      })
    );

    this.navbarServ.showExport =
      this.settingsService.projectsettings?.navigation?.export === true;

    /*
    this.subscrManager.add(
      this.transcrService.levelchanged.subscribe((level: Level) => {
        (this.currentEditor.instance as any).update();

        // important: subscribe to level changes in order to save proceedings
        this.subscrManager.removeById(this.levelSubscriptionID);
        this.uiService.addElementFromEvent(
          'level',
          { value: 'changed' },
          Date.now(),
          this.audioManager.createSampleUnit(0),
          -1,
          undefined,
          undefined,
          level.name
        );
      })
    );*/

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
        this.subscrManager.add(
          interval(5000).subscribe(() => {
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
                    InactivityModalComponent.options
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
          })
        );
      }
    }

    this.cd.markForCheck();
    this.cd.detectChanges();
  }

  private async checkCurrentEditor() {
    // TODO move this to another place
    const currentEditor = this.appStorage.interface;
    const found = this.projectsettings.interfaces.find((x) => {
      return currentEditor === x;
    });

    if (found === undefined) {
      this.appStorage.interface = this.projectsettings.interfaces[0];
    }
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown($event: KeyboardEvent) {
    const shortcutInfo = this.shortcutManager.checkKeyEvent($event, Date.now());
    if (shortcutInfo !== undefined) {
      $event.preventDefault();

      switch (shortcutInfo.shortcutName) {
        case 'shortcuts':
          if (!this.modalVisiblities.shortcuts) {
            this.modalShortcutsDialogue = this.modService.openModalRef(
              ShortcutsModalComponent,
              ShortcutsModalComponent.options
            );
            this.modalVisiblities.shortcuts = true;
          } else {
            this.modalShortcutsDialogue!.close();
            this.modalVisiblities.shortcuts = false;
          }
          break;
        case 'guidelines':
          if (!this.modalVisiblities.guidelines) {
            this.modalGuidelines = this.modService.openModalRef(
              TranscriptionGuidelinesModalComponent,
              TranscriptionGuidelinesModalComponent.options
            );
            this.modalVisiblities.guidelines = true;
          } else {
            this.modalGuidelines!.close();
            this.modalVisiblities.guidelines = false;
          }
          break;
        case 'overview':
          if (!this.modalVisiblities.overview) {
            this.annotationStoreService.analyse();
            this.modalOverview = this.modService.openModalRef(
              OverviewModalComponent,
              OverviewModalComponent.options
            );
            this.modalVisiblities.overview = true;
          } else {
            this.modalOverview!.close();
            this.modalVisiblities.overview = false;
          }
          break;
      }
    }
  }

  @HostListener('window:keyup', ['$event'])
  onKeyUp($event: KeyboardEvent) {
    this.shortcutManager.checkKeyEvent($event, Date.now());
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
          this.subscrManager.add(
            timer(20).subscribe(() => {
              const viewContainerRef = this.appLoadeditor.viewContainerRef;
              viewContainerRef.clear();

              this._currentEditor =
                viewContainerRef.createComponent<OCTRAEditor>(comp);

              const id = this.subscrManager.add(
                this._currentEditor.instance.initialized.subscribe(() => {
                  this.editorloaded = true;
                  this.subscrManager.removeById(id);
                  this.cd.detectChanges();

                  resolve();
                })
              );
              if (
                hasProperty(this.currentEditor.instance as any, 'openModal')
              ) {
                this.subscrManager.add(
                  (this.currentEditor.instance as any).openModal.subscribe(
                    () => {
                      (
                        this.currentEditor.instance as any
                      ).disableAllShortcuts();
                      this.modService
                        .openModal(
                          OverviewModalComponent,
                          OverviewModalComponent.options
                        )
                        .then(() => {
                          (
                            this.currentEditor.instance as any
                          ).enableAllShortcuts();
                        })
                        .catch((error) => {
                          console.error(error);
                        });
                    }
                  )
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
                'editors'
              );
              this.cd.detectChanges();
            })
          );
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
    this.sendOk = true;

    if (this._useMode === LoginMode.ONLINE) {
      if (this._useMode === LoginMode.ONLINE) {
        this.annotationStoreService.sendAnnotation();
      }
    } else if (this._useMode === LoginMode.DEMO) {
      // only if opened
      if (this.modalVisiblities.overview) {
        this.modalOverview!.close();
      }

      this.modService
        .openModal(
          TranscriptionDemoEndModalComponent,
          TranscriptionDemoEndModalComponent.options
        )
        .then((action: any) => {
          this.appStorage.savingNeeded = false;
          this.waitForSend = false;

          switch (action) {
            case ModalEndAnswer.CANCEL:
              break;
            case ModalEndAnswer.QUIT:
              this.abortTranscription();
              break;
            case ModalEndAnswer.CONTINUE:
              this.transcrSendingModal = this.modService.openModalRef(
                TranscriptionSendingModalComponent,
                TranscriptionSendingModalComponent.options
              );
              this.subscrManager.add(
                timer(1000).subscribe(() => {
                  // simulate nextTranscription
                  this.transcrSendingModal!.close();
                  this.reloadDemo();
                })
              );
              break;
          }
        })
        .catch((error) => {
          console.error(error);
        });
    }
  }

  onSendButtonClick() {
    this.waitForSend = true;
    this.appStorage.afterSaving().then(() => {
      // after saving
      // make sure no tasks are pending
      /* TODO add
      new Promise<void>((resolve) => {
        if (this.transcrService.tasksBeforeSend.length === 0) {
          resolve();
        } else {
          Promise.all(this.transcrService.tasksBeforeSend).then(() => {
            this.transcrService.tasksBeforeSend = [];
            resolve();
          });
        }
      }).then(() => {
        let showOverview = true;
        let validTranscriptOnly = false;

        this.transcrService.validateAll();
        const validTranscript = this.transcrService.transcriptValid;

        if (
          this.projectsettings.octra !== undefined &&
          this.projectsettings.octra.showOverviewIfTranscriptNotValid !==
            undefined
        ) {
          showOverview =
            this.projectsettings.octra.showOverviewIfTranscriptNotValid;
        }

        if (
          this.projectsettings.octra !== undefined &&
          this.projectsettings.octra.sendValidatedTranscriptionOnly !==
            undefined
        ) {
          validTranscriptOnly =
            this.projectsettings.octra.sendValidatedTranscriptionOnly;
        }

        if (
          (!validTranscript &&
            showOverview) /*||  !this.modalOverview.feedBackComponent.valid||
          (validTranscriptOnly && !validTranscript)
        ) {
          this.waitForSend = false;
          this.modalOverview = this.modService.openModalRef(
            OverviewModalComponent,
            OverviewModalComponent.options
          );
        } else {
          this.onSendNowClick();
        }
      });*/
    });
  }

  reloadDemo() {
    this.annotationStoreService.endTranscription(true);
    this.clearDataPermanently();
    this.authService.loginDemo();
  }

  closeTranscriptionAndGetNew() {
    // close current session
    if (this._useMode === LoginMode.ONLINE) {
      /* TODO
        this.api.freeAnnotation(this.appStorage.onlineSession.currentProject.id, this.appStorage.onlineSession.sessionData.transcriptID).then(() => {
        this.api.startAnnotation(this.appStorage.onlineSession.currentProject.id).then((result) => {
          this.transcrService.endTranscription(false);
          navigateTo(this.router, ['/load'], AppInfo.queryParamsHandling).catch((error) => {
            console.error(error);
          });
        }).catch((error) => {
          console.error(error);
        });
      }).catch((error) => {
        console.error(error);
      }); */
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
    const converter = new PartiturConverter();
    const oannotjson = this.annotationStoreService.transcript!.serialize(
      this.audio.audioManager.resource.name,
      this.audio.audioManager.resource.info.sampleRate,
      this.audio.audioManager.resource.info.duration
    );
    const result = converter.export(
      oannotjson,
      this.audio.audioManager.resource.getOAudioFile(),
      0
    );

    if (!result.error && result.file) {
      result.file.name = result.file.name.replace(
        '-' + oannotjson.levels[0].name,
        ''
      );

      // upload transcript
      const form: FormData = new FormData();
      let host =
        'https://clarin.phonetik.uni-muenchen.de/BASWebServices/services/';

      if (!(this.appStorage.urlParams.host === undefined)) {
        host = this.appStorage.urlParams.host;
      }

      const url = `${host}uploadFileMulti`;

      form.append(
        'file0',
        new File([result.file.content], result.file.name, {
          type: 'text/plain',
        })
      );

      const xhr = new XMLHttpRequest();
      xhr.open('POST', url);

      xhr.onloadstart = () => {};

      xhr.onerror = (e) => {
        console.error(e);
      };

      xhr.onloadend = (e) => {
        const result2 = (e.currentTarget as any).responseText;

        const x2js = new X2JS();
        let json: any = x2js.xml2js(result2);
        json = json.UploadFileMultiResponse;

        if (json.success === 'true') {
          // TODO set urls to results only
          let resulturl = '';
          if (Array.isArray(json.fileList.entry)) {
            resulturl = json.fileList.entry[0].value;
          } else {
            // json attribute entry is an object
            resulturl = json.fileList.entry.value;
          }

          // send upload url to iframe owner
          window.parent.postMessage(
            {
              data: {
                transcript_url: resulturl,
              },
              status: 'success',
            },
            '*'
          );
        } else {
          window.parent.postMessage(
            {
              status: 'error',
              error: json.message,
            },
            '*'
          );
        }
      };
      xhr.send(form);
    } else {
      alert(`Annotation conversion failed: ${result.error}`);
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

  private logout(clearSession: boolean) {
    this.annotationStoreService.endTranscription(true);
    if (clearSession) {
      this.uiService.elements = [];
    }
    this.appStorage.logout(clearSession);
  }

  openGuidelines() {
    this.modalGuidelines = this.modService.openModalRef(
      TranscriptionGuidelinesModalComponent,
      TranscriptionGuidelinesModalComponent.options
    );
    this.modalVisiblities.guidelines = true;
  }

  openOverview() {
    this.modalOverview = this.modService.openModalRef(
      OverviewModalComponent,
      OverviewModalComponent.options
    );
    this.modalVisiblities.overview = true;
  }

  openShortcutsModal() {
    this.modalShortcutsDialogue = this.modService.openModalRef(
      ShortcutsModalComponent,
      ShortcutsModalComponent.options
    );
    this.modalVisiblities.shortcuts = true;
  }

  openPromptModal() {
    this.modService.openModalRef(
      PromptModalComponent,
      PromptModalComponent.options
    );
  }
}
