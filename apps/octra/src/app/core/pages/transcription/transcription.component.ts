import {
  ChangeDetectorRef,
  Component,
  ComponentFactoryResolver,
  ComponentRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import {Router} from '@angular/router';
import {TranslocoService} from '@ngneat/transloco';
import {
  BrowserInfo,
  hasProperty,
  hasPropertyTree,
  navigateTo,
  ShortcutGroup,
  ShortcutManager,
  SubscriptionManager
} from '@octra/utilities';
import {interval, Subscription, throwError, timer} from 'rxjs';
import * as X2JS from 'x2js';
import {AppInfo} from '../../../app.info';
import {editorComponents} from '../../../editors/components';
import {OCTRAEditor} from '../../../editors/octra-editor';
import {InactivityModalComponent} from '../../modals/inactivity-modal/inactivity-modal.component';
import {MissingPermissionsModalComponent} from '../../modals/missing-permissions/missing-permissions.component';
import {ModalService} from '../../modals/modal.service';
import {OverviewModalComponent} from '../../modals/overview-modal/overview-modal.component';
import {
  ModalEndAnswer,
  TranscriptionDemoEndModalComponent
} from '../../modals/transcription-demo-end/transcription-demo-end-modal.component';
import {TranscriptionGuidelinesModalComponent} from '../../modals/transcription-guidelines-modal/transcription-guidelines-modal.component';
import {TranscriptionSendingModalComponent} from '../../modals/transcription-sending-modal/transcription-sending-modal.component';
import {TranscriptionStopModalAnswer} from '../../modals/transcription-stop-modal/transcription-stop-modal.component';
import {IDataEntry, parseServerDataEntry} from '../../obj/data-entry';
import {ProjectSettings} from '../../obj/Settings';

import {LoadeditorDirective} from '../../shared/directive/loadeditor.directive';

import {
  AlertService,
  APIService,
  AudioService,
  KeymappingService,
  SettingsService,
  TranscriptionService,
  UserInteractionsService
} from '../../shared/service';
import {AppStorageService} from '../../shared/service/appstorage.service';
import {AsrService} from '../../shared/service/asr.service';
import {BugReportService} from '../../shared/service/bug-report.service';
import {NavbarService} from '../../component/navbar/navbar.service';
import {IFile, Level, PartiturConverter} from '@octra/annotation';
import {AudioManager} from '@octra/media';
import {LoginMode} from '../../store';
import {ShortcutsModalComponent} from '../../modals/shortcuts-modal/shortcuts-modal.component';
import {MDBModalRef, MDBModalService} from 'angular-bootstrap-md';
import {modalConfigurations} from '../../modals/types';

@Component({
  selector: 'octra-transcription',
  templateUrl: './transcription.component.html',
  styleUrls: ['./transcription.component.scss'],
  providers: [AlertService]
})
export class TranscriptionComponent implements OnInit, OnDestroy {

  public waitForSend = false;
  modalShortcutsDialogue: MDBModalRef;
  modalOverview: MDBModalRef;
  transcrSendingModal: MDBModalRef;
  modalGuidelines: MDBModalRef;
  inactivityModal: MDBModalRef;
  missingPermissionsModal: MDBModalRef;
  @ViewChild(LoadeditorDirective, {static: true}) appLoadeditor: LoadeditorDirective;

  public sendError = '';
  public saving = '';
  public interface = '';
  public editorloaded = false;
  user: number;
  public platform = BrowserInfo.platform;
  private subscrmanager: SubscriptionManager<Subscription>;
  private sendOk = false;
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
    guidelines: false
  }

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
          pc: 'ALT + 8'
        }
      },
      {
        name: 'guidelines',
        title: 'guidelines',
        focusonly: false,
        keys: {
          mac: 'ALT + 9',
          pc: 'ALT + 9'
        }
      },
      {
        name: 'overview',
        title: 'overview',
        focusonly: false,
        keys: {
          mac: 'ALT + 0',
          pc: 'ALT + 0'
        }
      }
    ]
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
          pc: 'SHIFT + ALT + 1'
        }
      },
      {
        name: 'feedback2',
        title: 'feedback and send 2',
        focusonly: false,
        keys: {
          mac: 'SHIFT + ALT + 2',
          pc: 'SHIFT + ALT + 2'
        }
      },
      {
        name: 'feedback3',
        title: 'feedback and send 3',
        focusonly: false,
        keys: {
          mac: 'SHIFT + ALT + 3',
          pc: 'SHIFT + ALT + 3'
        }
      }
    ]
  };

  showCommentSection = false;

  public get Interface(): string {
    return this.interface;
  }

  get loaded(): boolean {
    return (this.audio.loaded && !(this.transcrService.guidelines === undefined || this.transcrService.guidelines === undefined));
  }

  get appc(): any {
    return this.settingsService.appSettings;
  }

  get projectsettings(): ProjectSettings {
    return this.settingsService.projectsettings;
  }

  get responsive(): boolean {
    return this.settingsService.responsive.enabled;
  }

  private _currentEditor: ComponentRef<Component>;

  get currentEditor(): ComponentRef<Component> {
    return this._currentEditor;
  }

  private get appSettings() {
    return this.settingsService.appSettings;
  }

  set comment(value: string) {
    this.transcrService.feedback.comment = value;
    this.appStorage.comment = value;
  }

  get comment(): string {
    return this.transcrService?.feedback?.comment;
  }

  constructor(public router: Router,
              private _componentFactoryResolver: ComponentFactoryResolver,
              public audio: AudioService,
              public uiService: UserInteractionsService,
              public transcrService: TranscriptionService,
              public appStorage: AppStorageService,
              public keyMap: KeymappingService,
              public navbarServ: NavbarService,
              public settingsService: SettingsService,
              public modService: ModalService,
              public langService: TranslocoService,
              private api: APIService,
              private bugService: BugReportService,
              private cd: ChangeDetectorRef,
              private asrService: AsrService,
              private alertService: AlertService,
              private modalService: MDBModalService) {
    this.subscrmanager = new SubscriptionManager<Subscription>();
    this.audioManager = this.audio.audiomanagers[0];

    this.navbarServ.transcrService = this.transcrService;
    this.navbarServ.uiService = this.uiService;

    this.shortcutManager = new ShortcutManager();
    this.shortcutManager.registerShortcutGroup(this.modalShortcuts);

    this.subscrmanager.add(this.audioManager.statechange.subscribe(async (state) => {
        if (!appStorage.playonhover && !this.modalVisiblities.overview) {
          let caretpos = -1;

          if (this.currentEditor !== undefined && (this.currentEditor.instance as any).editor !== undefined) {
            caretpos = (this.currentEditor.instance as any).editor.caretpos;
          }

          // make sure that events from playonhover are not logged
          const currentEditorName = this.appStorage.interface;
          this.uiService.logAudioEvent(currentEditorName, state, this.audioManager.playposition, caretpos, undefined, undefined);
        }
      },
      (error) => {
        console.error(error);
      }));

    this.subscrmanager.add(this.keyMap.onShortcutTriggered.subscribe((event) => {
      if (this.appStorage.useMode === LoginMode.ONLINE || this.appStorage.useMode === LoginMode.DEMO) {
        if (['SHIFT + ALT + 1', 'SHIFT + ALT + 2', 'SHIFT + ALT + 3'].includes(event.shortcut)) {
          event.event.preventDefault();
          this.waitForSend = true;

          this.appStorage.afterSaving().then(() => {
            this.waitForSend = false;
            if (event.shortcut === 'SHIFT + ALT + 1') {
              this.sendTranscriptionForShortAudioFiles('bad');
              this.uiService.addElementFromEvent('shortcut', {
                value: 'send_transcription:1'
              }, Date.now(), this.audio.audiomanagers[0].playposition, -1, undefined, undefined, this.interface);
            } else if (event.shortcut === 'SHIFT + ALT + 2') {
              this.sendTranscriptionForShortAudioFiles('middle');
              this.uiService.addElementFromEvent('shortcut', {
                value: 'send_transcription:2'
              }, Date.now(), this.audio.audiomanagers[0].playposition, -1, undefined, undefined, this.interface);
            } else if (event.shortcut === 'SHIFT + ALT + 3') {
              this.sendTranscriptionForShortAudioFiles('good');
              this.uiService.addElementFromEvent('shortcut', {
                value: 'send_transcription:3'
              }, Date.now(), this.audio.audiomanagers[0].playposition, -1, undefined, undefined, this.interface);
            }
          }).catch((error) => {
            console.error(error);
          });
        }
      }
    }));

    this.subscrmanager.add(this.navbarServ.toolApplied.subscribe((toolName: string) => {
      switch (toolName) {
        case('combinePhrases'):
          this.alertService.showAlert('success', this.langService.translate('tools.alerts.done', {
            value: toolName
          })).catch((error) => {
            console.error(error);
          });
          if (this.currentEditor !== undefined && (this.currentEditor.instance as any).editor !== undefined) {
            (this._currentEditor.instance as any).update();
          }
          break;
      }
    }));

    this.subscrmanager.add(this.modService.showmodal.subscribe((event: { type: string, data, emitter: any }) => {
      if (this.currentEditor !== undefined && (this.currentEditor.instance as any).editor !== undefined) {
        const editor = this._currentEditor.instance as OCTRAEditor;
        console.log(`CALL disable all shortcuts!`);
        editor.disableAllShortcuts();
      } else {
        console.log(``);
      }
    }));

    this.subscrmanager.add(this.modService.closemodal.subscribe(() => {
      if (this.currentEditor !== undefined && (this.currentEditor.instance as any).editor !== undefined) {
        const editor = this._currentEditor.instance as OCTRAEditor;
        console.log(`CALL enable all shortcuts!`);
        editor.enableAllShortcuts();
      }

    }));

    this.subscrmanager.add(this.audio.missingPermission.subscribe(() => {
      this.modService.openModal(MissingPermissionsModalComponent, modalConfigurations.missingPermission);
    }));
  }

  abortTranscription = () => {
    if ((this.appStorage.useMode === LoginMode.ONLINE || this.appStorage.useMode === LoginMode.DEMO)
      && this.settingsService.projectsettings.octra !== undefined
      && this.settingsService.projectsettings.octra.theme !== undefined
      && this.settingsService.isTheme('shortAudioFiles')) {
      // clear transcription

      this.transcrService.endTranscription();

      if (this.appStorage.useMode !== LoginMode.DEMO) {
        this.api.setOnlineSessionToFree(this.appStorage).then(() => {
          this.logout(true);
        }).catch((error) => {
          console.error(error);
        });
      } else {
        // is demo mode
        this.logout(true);
      }
    } else {
      this.modService.show('transcriptionStop').then((answer: TranscriptionStopModalAnswer) => {
        if (answer === TranscriptionStopModalAnswer.QUIT) {
          this.logout(false);
        }
      }).catch((error) => {
        console.error(error);
      });
    }
  };

  onSendError = (error) => {
    this.sendError = error.message;
    return throwError(error);
  };

  ngOnInit() {
    this.showCommentSection = (
        this.settingsService.isTheme('shortAudioFiles') ||
        this.settingsService.isTheme('korbinian')
      ) && (this.appStorage.useMode === 'online' || this.appStorage.useMode === 'demo')
      && this.transcrService.feedback !== undefined;

    this.subscrmanager.add(this.transcrService.alertTriggered.subscribe((alertConfig) => {
      this.alertService.showAlert(alertConfig.type, alertConfig.data, alertConfig.unique, alertConfig.duration);
    }));

    console.log(`init transcription component`);
    this.navbarServ.interfaces = this.projectsettings.interfaces;

    this.keyMap.registerGeneralShortcutGroup(this.generalShortcuts);

    for (const marker of this.transcrService.guidelines.markers) {
      if (marker.type === 'break') {
        this.transcrService.breakMarker = marker;
        break;
      }
    }

    // this.transcrService.annotation.audiofile.sampleRate = this.audioManager.ressource.info.sampleRate;
    this.navbarServ.showInterfaces = this.settingsService.projectsettings.navigation.interfaces;
    this.checkCurrentEditor();
    this.interface = this.appStorage.interface;

    // load guidelines on language change
    this.subscrmanager.add(this.langService.langChanges$.subscribe(
      () => {
        this.settingsService.loadGuidelines();
      }
    ));

    this.subscrmanager.add(this.navbarServ.interfacechange.subscribe(
      (editor) => {
        this.changeEditor(editor).catch((error) => {
          console.error(error);
        });
      }
    ));

    this.bugService.init(this.transcrService);

    if (this.appStorage.useMode === LoginMode.ONLINE) {
      // console.log(`opened job ${this.appStorage.dataID} in project ${this.appStorage.onlineSession?.loginData?.project}`);
    }

    this.asrService.init();

    // first change
    this.changeEditor(this.interface).then(() => {
      (this._currentEditor.instance as any).afterFirstInitialization();
    }).catch((error) => {
      console.error(error);
    });

    // because of the loading data before through the loading component you can be sure the audio was loaded
    // correctly

    this.subscrmanager.add(this.appStorage.saving.subscribe(
      (saving: string) => {
        if (saving === 'saving') {
          this.saving = 'saving';
        } else if (saving === 'error') {
          this.saving = 'error';
        } else if (saving === 'success') {
          this.subscrmanager.add(timer(200).subscribe(() => {
            this.saving = 'success';
          }));
        }
      }
    ));

    this.navbarServ.showExport = this.settingsService.projectsettings.navigation.export;

    if (this.transcrService.annotation !== undefined) {
      this.levelSubscriptionID = this.subscrmanager.add(
        this.transcrService.currentLevelSegmentChange.subscribe(this.transcrService.saveSegments)
      );
    } else {
      this.subscrmanager.add(this.transcrService.dataloaded.subscribe(() => {
        this.levelSubscriptionID = this.subscrmanager.add(
          this.transcrService.currentLevelSegmentChange.subscribe(this.transcrService.saveSegments)
        );
      }));
    }

    this.subscrmanager.add(this.transcrService.levelchanged.subscribe(
      (level: Level) => {
        (this.currentEditor.instance as any).update();

        // important: subscribe to level changes in order to save proceedings
        this.subscrmanager.removeById(this.levelSubscriptionID);
        this.levelSubscriptionID = this.subscrmanager.add(
          this.transcrService.currentLevelSegmentChange.subscribe(this.transcrService.saveSegments)
        );
        this.uiService.addElementFromEvent('level', {value: 'changed'}, Date.now(),
          this.audioManager.createSampleUnit(0),
          -1, undefined, undefined, level.name);
      }
    ));

    if (this.appStorage.useMode === LoginMode.ONLINE || this.appStorage.useMode === LoginMode.DEMO) {
      if (this.settingsService.appSettings.octra.inactivityNotice !== undefined
        && this.settingsService.appSettings.octra.inactivityNotice.showAfter !== undefined
        && this.settingsService.appSettings.octra.inactivityNotice.showAfter > 0) {
        // if waitTime is 0 the inactivity modal isn't shown
        let waitTime = this.settingsService.appSettings.octra.inactivityNotice.showAfter;
        waitTime = waitTime * 60 * 1000;
        this.subscrmanager.add(interval(5000).subscribe(
          () => {
            if (Date.now() - this.uiService.lastAction > waitTime && !this.modalVisiblities.inactivity) {
              if (this.inactivityModal === undefined) {
                this.modService.openModal(InactivityModalComponent, modalConfigurations.inactivity).then((answer) => {
                  switch (answer) {
                    case('quit'):
                      this.abortTranscription();
                      break;
                    case('new'):
                      this.closeTranscriptionAndGetNew();
                      break;
                    case('continue'):
                      // reload OCTRA to continue
                      break;
                  }
                  this.uiService.lastAction = Date.now();
                  this.inactivityModal = undefined;
                }).catch((error) => {
                  this.inactivityModal = undefined;
                  console.error(error);
                });
              }
            }
          }
        ));
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

  ngOnDestroy() {
    this.subscrmanager.destroy();
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown($event) {
    const shortcutInfo = this.shortcutManager.checkKeyEvent($event, Date.now());
    if (shortcutInfo !== undefined) {
      $event.preventDefault();

      switch (shortcutInfo.shortcutName) {
        case ('shortcuts'):
          if (!this.modalVisiblities.shortcuts) {
            this.modalShortcutsDialogue = this.modService.openModalRef(ShortcutsModalComponent, modalConfigurations.shortcuts);
            this.modalVisiblities.shortcuts = true;
          } else {
            this.modalShortcutsDialogue.hide();
            this.modalVisiblities.shortcuts = false;
          }
          break;
        case('guidelines'):
          if (!this.modalVisiblities.guidelines) {
            this.modalGuidelines = this.modService.openModalRef(TranscriptionGuidelinesModalComponent, modalConfigurations.transcriptionGuidelines);
            this.modalVisiblities.guidelines = true;
          } else {
            this.modalGuidelines.hide();
            this.modalVisiblities.guidelines = false;
          }
          break;
        case('overview'):
          if (!this.modalVisiblities.overview) {
            this.transcrService.analyse();
            this.modalOverview = this.modService.openModalRef(OverviewModalComponent, modalConfigurations.overview);
            this.modalVisiblities.overview = true;
          } else {
            this.modalOverview.hide();
            this.modalVisiblities.overview = false;
          }
          break;
      }
    }
  }

  @HostListener('window:keyup', ['$event'])
  onKeyUp($event) {
    this.shortcutManager.checkKeyEvent($event, Date.now());
  }

  changeEditor(name: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.editorloaded = false;
      this.cd.detectChanges();
      let comp: any = undefined;

      if ((name === undefined || name === undefined) || name === '') {
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

      if (!(comp === undefined || comp === undefined)) {
        const id = this.subscrmanager.add(comp.initialized.subscribe(
          () => {
            this.editorloaded = true;
            this.subscrmanager.removeById(id);
            this.cd.detectChanges();

            resolve();
          }
        ));

        if (!(this.appLoadeditor === undefined || this.appLoadeditor === undefined)) {
          const componentFactory = this._componentFactoryResolver.resolveComponentFactory(comp);

          this.subscrmanager.add(timer(20).subscribe(() => {
            const viewContainerRef = this.appLoadeditor.viewContainerRef;
            viewContainerRef.clear();

            this._currentEditor = viewContainerRef.createComponent(componentFactory);

            if (hasProperty((this.currentEditor.instance as any), 'openModal')) {
              this.subscrmanager.add((this.currentEditor.instance as any).openModal.subscribe(() => {
                (this.currentEditor.instance as any).disableAllShortcuts();
                this.modService.openModal(OverviewModalComponent, modalConfigurations.overview).then(() => {
                  (this.currentEditor.instance as any).enableAllShortcuts();
                }).catch((error) => {
                  console.error(error);
                });
              }));
            }

            this.uiService.addElementFromEvent('editor:changed', {value: name}, Date.now(),
              undefined, undefined, undefined, undefined, 'editors');
            console.log(`opened ${name}`);

            this.cd.detectChanges();
          }));

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

    const json: any = this.transcrService.exportDataToJSON();

    if (this.appStorage.useMode === LoginMode.ONLINE) {
      this.transcrSendingModal = this.modService.openModalRef(TranscriptionSendingModalComponent, modalConfigurations.transcriptionSending);
      this.api.saveSession(json.transcript, json.project, json.annotator,
        json.jobno, json.id, json.status, json.comment, json.quality, json.log).then((result) => {
        if (result !== undefined) {
          this.unsubscribeSubscriptionsForThisAnnotation();
          this.appStorage.submitted = true;

          this.subscrmanager.add(timer(500).subscribe(() => {
            this.waitForSend = false;
            this.transcrSendingModal.hide();

            // only if opened
            this.modalOverview.hide();

            this.nextTranscription(result);
          }));
        } else {
          this.sendError = this.langService.translate('send error');
        }
      }).catch((error) => {
        this.onSendError(error);
      });
    } else if (this.appStorage.useMode === LoginMode.DEMO) {
      // only if opened
      this.modalOverview.hide();

      this.modService.openModal(TranscriptionDemoEndModalComponent, modalConfigurations.transcriptionDemo).then((action: ModalEndAnswer) => {
        this.appStorage.savingNeeded = false;
        this.waitForSend = false;

        switch (action) {
          case(ModalEndAnswer.CANCEL):
            break;
          case(ModalEndAnswer.QUIT):
            this.abortTranscription();
            break;
          case(ModalEndAnswer.CONTINUE):
            this.transcrSendingModal = this.modService.openModalRef(TranscriptionSendingModalComponent, modalConfigurations.transcriptionSending);
            this.subscrmanager.add(timer(1000).subscribe(() => {
              // simulate nextTranscription
              this.transcrSendingModal.hide();
              this.reloadDemo();
            }));
            break;
        }
      }).catch((error) => {
        console.error(error);
      });
    }
  }

  onSendButtonClick() {
    this.waitForSend = true;
    this.appStorage.afterSaving().then(() => {
      // after saving
      // make sure no tasks are pending
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

        if (this.projectsettings.octra !== undefined &&
          this.projectsettings.octra.showOverviewIfTranscriptNotValid !== undefined) {
          showOverview = this.projectsettings.octra.showOverviewIfTranscriptNotValid;
        }

        if (this.projectsettings.octra !== undefined
          && this.projectsettings.octra.sendValidatedTranscriptionOnly !== undefined) {
          validTranscriptOnly = this.projectsettings.octra.sendValidatedTranscriptionOnly;
        }

        if ((
            (!validTranscript && showOverview) /*||  !this.modalOverview.feedBackComponent.valid*/)
          || (validTranscriptOnly && !validTranscript)
        ) {
          this.waitForSend = false;
          this.modalOverview = this.modService.openModalRef(OverviewModalComponent, modalConfigurations.overview);
        } else {
          this.onSendNowClick();
        }
      });
    });
  }

  nextTranscription(json: any) {
    this.transcrService.endTranscription(false);

    if (json !== undefined) {
      const data = json.data as IDataEntry;
      if (data && hasProperty(data, 'url') && hasProperty(data, 'id')) {
        // get transcript data that already exists
        const jsonStr = JSON.stringify(json.data);
        let serverDataEntry = parseServerDataEntry(jsonStr);

        if (hasPropertyTree(serverDataEntry, 'transcript')) {
          if (!Array.isArray(serverDataEntry.transcript)) {
            console.log(`server transcript is not array, set []`);
            serverDataEntry = {
              ...serverDataEntry,
              transcript: []
            };
          } else {
            console.log(`seervertranscript is array`);
          }
        } else {
          console.log(`no server transcript`);
        }

        if (!hasPropertyTree(serverDataEntry, 'logtext') ||
          !Array.isArray(serverDataEntry.logtext)) {
          serverDataEntry = {
            ...serverDataEntry,
            logtext: []
          };
        }

        let promptText = '';
        if (this.appStorage.useMode === LoginMode.ONLINE && hasProperty(data, 'prompttext') && data.prompttext !== '') {
          // get transcript data that already exists
          promptText = json.data.prompttext;
        }

        let serverComment = '';
        if (this.appStorage.useMode === LoginMode.ONLINE && hasProperty(data, 'comment') && data.comment !== '') {
          // get transcript data that already exists
          serverComment = data.comment;
        }

        let jobsLeft = 0;
        if (hasProperty(json, 'message')) {
          const counter = (json.message === '') ? '0' : json.message;
          jobsLeft = Number(counter);
        }

        this.appStorage.serverDataEntry = serverDataEntry;

        this.appStorage.setOnlineSession({
          id: this.appStorage.onlineSession.loginData.id,
          project: this.appStorage.onlineSession.loginData.project,
          password: this.appStorage.onlineSession.loginData.password,
          jobno: this.appStorage.onlineSession.loginData.jobNumber
        }, data.id, data.url, promptText, serverComment, jobsLeft, true);

        navigateTo(this.router, ['/user/load'], AppInfo.queryParamsHandling).catch((error) => {
          console.error(error);
        });
      } else {
        console.error(`can't read next segment because audioURL or id is undefined!`);
        console.log(json);
      }
    } else {
      console.error(`json array for transcription next is undefined`);
    }
  }

  reloadDemo() {
    this.transcrService.endTranscription(false);
    this.clearDataPermanently();
    const audioExample = this.settingsService.getAudioExample(this.langService.getActiveLang());

    if (audioExample !== undefined) {
      // transcription available
      this.appStorage.setDemoSession(audioExample.url, audioExample.description, this.appStorage.jobsLeft - 1);

      navigateTo(this.router, ['/user/load'], AppInfo.queryParamsHandling).catch((error) => {
        console.error(`navigation failed`);
        console.error(error);
      });
    }
  }

  closeTranscriptionAndGetNew() {
    // close current session
    if (this.appStorage.useMode === LoginMode.ONLINE) {
      this.api.closeSession(this.appStorage.onlineSession.loginData.id, this.appStorage.dataID, this.appStorage.servercomment).then(() => {
        // begin new session
        this.api.beginSession(this.appStorage.onlineSession.loginData.project, this.appStorage.onlineSession.loginData.id, this.appStorage.onlineSession.loginData.jobNumber).then((json) => {
          // new session
          this.nextTranscription(json);
        }).catch((error) => {
          console.error(error);
        });
      }).catch((error) => {
        console.error(error);
      });
    } else if (this.appStorage.useMode === LoginMode.DEMO) {
      this.reloadDemo();
    }
  }

  clearDataPermanently() {
    // replace with store method
    this.appStorage.submitted = false; // ok
    this.appStorage.clearAnnotationPermanently(); // ok
    this.appStorage.feedback = {}; // ok
    this.appStorage.comment = ''; // ok
    this.appStorage.clearLoggingDataPermanently(); // ok
    this.uiService.elements = [];
  }

  public onSaveTranscriptionButtonClicked() {
    const converter = new PartiturConverter();
    const oannotjson = this.transcrService.annotation.getObj(this.transcrService.audioManager.ressource.info.duration);
    const result: IFile = converter.export(oannotjson, this.transcrService.audiofile, 0).file;
    result.name = result.name.replace('-' + oannotjson.levels[0].name, '');

    // upload transcript
    const form: FormData = new FormData();
    let host = 'https://clarin.phonetik.uni-muenchen.de/BASWebServices/services/';

    if (!(this.appStorage.urlParams.host === undefined)) {
      host = this.appStorage.urlParams.host;
    }

    const url = `${host}uploadFileMulti`;

    form.append('file0', new File([result.content], result.name, {type: 'text/plain'}));

    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);

    xhr.onloadstart = () => {
      console.log('start');
    };

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
        window.parent.postMessage({
          data: {
            transcript_url: resulturl
          },
          status: 'success'
        }, '*');
      } else {
        window.parent.postMessage({
          status: 'error',
          error: json.message
        }, '*');
      }
    };
    xhr.send(form);
  }

  public sendTranscriptionForShortAudioFiles(type: 'bad' | 'middle' | 'good') {
    switch (type) {
      case('bad'):
        this.appStorage.feedback = 'SEVERE';
        break;
      case('middle'):
        this.appStorage.feedback = 'SLIGHT';
        break;
      case('good'):
        this.appStorage.feedback = 'OK';
        break;
      default:
    }

    this.onSendButtonClick();
  }

  public sendTranscriptionForKorbinian(type: 'NO' | 'VE' | 'EE' | 'AN') {
    this.transcrService.feedback.comment = this.transcrService.feedback.comment.replace(/(((?:NO)|(?:VE)|(?:EE)|(?:AN))(\s*;\s*)*)/g, '');
    const servercomment = this.appStorage.servercomment.replace(/(((?:NO)|(?:VE)|(?:EE)|(?:AN))(\s*;\s*)*)/g, '');

    if (servercomment !== '' && this.transcrService.feedback.comment === '') {
      this.transcrService.feedback.comment = type + '; ' + servercomment;
    } else if ((servercomment === '' && this.transcrService.feedback.comment !== '')
      || (servercomment !== '' && this.transcrService.feedback.comment !== '')) {
      this.transcrService.feedback.comment = type + '; ' + this.transcrService.feedback.comment;
    } else {
      this.transcrService.feedback.comment = type;
    }
    this.onSendButtonClick();
  }

  private unsubscribeSubscriptionsForThisAnnotation() {
    if (this.levelSubscriptionID > 0) {
      this.subscrmanager.removeById(this.levelSubscriptionID);
      this.levelSubscriptionID = 0;
    }
  }

  private logout(clearSession: boolean) {
    this.transcrService.endTranscription(true);
    if (clearSession) {
      this.uiService.elements = [];
    }
    this.appStorage.logout(clearSession);
  }

  openGuidelines() {
    this.modalGuidelines = this.modService.openModalRef(TranscriptionGuidelinesModalComponent, modalConfigurations.transcriptionGuidelines);
    this.modalVisiblities.guidelines = true;
  }

  openOverview() {
    this.modalOverview = this.modService.openModalRef(OverviewModalComponent, modalConfigurations.overview);
    this.modalVisiblities.overview = true;
  }

  openShortcutsModal() {
    this.modalShortcutsDialogue = this.modService.openModalRef(ShortcutsModalComponent, modalConfigurations.shortcuts);
    this.modalVisiblities.shortcuts = true;
  }
}
