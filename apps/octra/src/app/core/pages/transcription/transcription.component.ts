import {
  AfterContentChecked,
  AfterContentInit,
  AfterViewChecked,
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ComponentFactoryResolver,
  ComponentRef,
  HostListener,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {Router} from '@angular/router';
import {TranslocoService} from '@ngneat/transloco';
import {Functions, isUnset, SubscriptionManager} from '@octra/utilities';
import {interval, throwError} from 'rxjs';
import * as X2JS from 'x2js';
import {AppInfo} from '../../../app.info';
import {editorComponents} from '../../../editors/components';
import {OCTRAEditor} from '../../../editors/octra-editor';
import {InactivityModalComponent} from '../../modals/inactivity-modal/inactivity-modal.component';
import {MissingPermissionsModalComponent} from '../../modals/missing-permissions/missing-permissions.component';
import {ModalService} from '../../modals/modal.service';
import {OverviewModalComponent} from '../../modals/overview-modal/overview-modal.component';
import {GeneralShortcut} from '../../modals/shortcuts-modal/shortcuts-modal.component';
import {
  ModalEndAnswer,
  TranscriptionDemoEndModalComponent
} from '../../modals/transcription-demo-end/transcription-demo-end-modal.component';
import {TranscriptionGuidelinesModalComponent} from '../../modals/transcription-guidelines-modal/transcription-guidelines-modal.component';
import {TranscriptionSendingModalComponent} from '../../modals/transcription-sending-modal/transcription-sending-modal.component';
import {TranscriptionStopModalAnswer} from '../../modals/transcription-stop-modal/transcription-stop-modal.component';
import {IDataEntry, parseServerDataEntry} from '../../obj/data-entry';
import {ProjectSettings} from '../../obj/Settings';

import {BrowserInfo} from '../../shared';
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

@Component({
  selector: 'octra-transcription',
  templateUrl: './transcription.component.html',
  styleUrls: ['./transcription.component.css'],
  providers: [AlertService]
})
export class TranscriptionComponent implements OnInit,
  OnDestroy, AfterViewInit, AfterContentInit, OnChanges, AfterViewChecked, AfterContentChecked, AfterContentInit {

  public generalShortcuts: GeneralShortcut[] = [];
  public waitForSend = false;
  // TODO change to ModalComponents!
  @ViewChild('modalShortcuts', {static: true}) modalShortcuts: any;
  @ViewChild('modalOverview', {static: true}) modalOverview: OverviewModalComponent;
  @ViewChild('modalDemoEnd', {static: true}) modalDemoEnd: TranscriptionDemoEndModalComponent;
  @ViewChild(LoadeditorDirective, {static: true}) appLoadeditor: LoadeditorDirective;
  @ViewChild('modal', {static: true}) modal: any;
  @ViewChild('transcrSendingModal', {static: true}) transcrSendingModal: TranscriptionSendingModalComponent;
  @ViewChild('modalGuidelines', {static: true}) modalGuidelines: TranscriptionGuidelinesModalComponent;
  @ViewChild('inactivityModal', {static: false}) inactivityModal: InactivityModalComponent;
  @ViewChild('missingPermissionsModal', {static: false}) missingPermissionsModal: MissingPermissionsModalComponent;
  public sendError = '';
  public saving = '';
  public interface = '';
  public editorloaded = false;
  user: number;
  public platform = BrowserInfo.platform;
  private subscrmanager: SubscriptionManager;
  private sendOk = false;
  private levelSubscriptionID = 0;
  private audioManager: AudioManager;

  public get Interface(): string {
    return this.interface;
  }

  get loaded(): boolean {
    return (this.audio.loaded && !(this.transcrService.guidelines === null || this.transcrService.guidelines === undefined));
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
    return this.transcrService.feedback.comment;
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
              private alertService: AlertService) {
    this.subscrmanager = new SubscriptionManager();
    this.audioManager = this.audio.audiomanagers[0];

    this.navbarServ.transcrService = this.transcrService;
    this.navbarServ.uiService = this.uiService;

    this.subscrmanager.add(this.audioManager.statechange.subscribe(async (state) => {
        if (!appStorage.playonhover && !this.modalOverview.visible) {
          let caretpos = -1;

          if (!isUnset(this.currentEditor) && !isUnset((this.currentEditor.instance as any).editor)) {
            caretpos = (this.currentEditor.instance as any).editor.caretpos;
          }

          // make sure that events from playonhover are not logged
          const currentEditorName = this.appStorage.interface;
          this.uiService.logAudioEvent(currentEditorName, state, this.audioManager.playposition, caretpos, null, null);
        }
      },
      (error) => {
        console.error(error);
      }));

    this.subscrmanager.add(this.keyMap.onkeydown.subscribe(async (event) => {
      if (this.appStorage.useMode === LoginMode.ONLINE || this.appStorage.useMode === LoginMode.DEMO) {
        if (['ALT + SHIFT + 1', 'ALT + SHIFT + 2', 'ALT + SHIFT + 3'].includes(event.comboKey)) {
          this.waitForSend = true;

          this.appStorage.afterSaving().then(() => {
            this.waitForSend = false;
            if (event.comboKey === 'ALT + SHIFT + 1') {
              this.sendTranscriptionForShortAudioFiles('bad');
              this.uiService.addElementFromEvent('shortcut', {
                value: 'send_transcription:1'
              }, Date.now(), this.audio.audiomanagers[0].playposition, -1, null, null, this.interface);
            } else if (event.comboKey === 'ALT + SHIFT + 2') {
              this.sendTranscriptionForShortAudioFiles('middle');
              this.uiService.addElementFromEvent('shortcut', {
                value: 'send_transcription:2'
              }, Date.now(), this.audio.audiomanagers[0].playposition, -1, null, null, this.interface);
            } else if (event.comboKey === 'ALT + SHIFT + 3') {
              this.sendTranscriptionForShortAudioFiles('good');
              this.uiService.addElementFromEvent('shortcut', {
                value: 'send_transcription:3'
              }, Date.now(), this.audio.audiomanagers[0].playposition, -1, null, null, this.interface);
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
            if (!isUnset(this.currentEditor) && !isUnset((this.currentEditor.instance as any).editor)) {
              (this._currentEditor.instance as any).update();
            }
            break;
        }
      },
      (error) => {
      },
      () => {
      }));

    this.subscrmanager.add(this.modService.showmodal.subscribe((event: { type: string, data, emitter: any }) => {
      if (!isUnset(this.currentEditor) && !isUnset((this.currentEditor.instance as any).editor)) {
        const editor = this._currentEditor.instance as OCTRAEditor;
        console.log(`CALL disable all shortcuts!`);
        editor.disableAllShortcuts();
      } else {
        console.log(``);
      }
    }));

    this.subscrmanager.add(this.modService.closemodal.subscribe((event: { type: string }) => {
      if (!isUnset(this.currentEditor) && !isUnset((this.currentEditor.instance as any).editor)) {
        const editor = this._currentEditor.instance as OCTRAEditor;
        console.log(`CALL enable all shortcuts!`);
        editor.enableAllShortcuts();
      }

    }));

    this.subscrmanager.add(this.audio.missingPermission.subscribe(() => {
      this.missingPermissionsModal.open().catch((error) => {
        console.error(error);
      });
    }));
  }

  abortTranscription = () => {
    if ((this.appStorage.useMode === LoginMode.ONLINE || this.appStorage.useMode === LoginMode.DEMO)
      && !isUnset(this.settingsService.projectsettings.octra)
      && !isUnset(this.settingsService.projectsettings.octra.theme)
      && this.settingsService.isTheme('shortAudioFiles')) {
      // clear transcription

      this.transcrService.endTranscription();

      if (this.appStorage.useMode !== LoginMode.DEMO) {
        this.api.setOnlineSessionToFree(this.appStorage).then(() => {
          this.clearDataPermanently();
          this.appStorage.logout();
        }).catch((error) => {
          console.error(error);
        });
      } else {
        // is demo mode
        this.clearDataPermanently();
        this.appStorage.logout();
      }
    } else {
      this.modService.show('transcriptionStop').then((answer: TranscriptionStopModalAnswer) => {
        if (answer === TranscriptionStopModalAnswer.QUIT) {
          this.transcrService.endTranscription();
          this.appStorage.logout();
        }
      }).catch((error) => {
        console.error(error);
      });
    }
  }

  onSendError = (error) => {
    this.sendError = error.message;
    return throwError(error);
  }

  ngOnChanges(changes: SimpleChanges) {
  }

  ngAfterContentChecked() {
  }

  ngOnInit() {
    console.log(`init transcription component`);
    this.navbarServ.interfaces = this.projectsettings.interfaces;

    for (const marker of this.transcrService.guidelines.markers) {
      if (marker.type === 'break') {
        this.transcrService.breakMarker = marker;
        break;
      }
    }

    // this.transcrService.annotation.audiofile.sampleRate = this.audioManager.ressource.info.sampleRate;
    this.navbarServ.showInterfaces = this.settingsService.projectsettings.navigation.interfaces;

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
      console.log(`opened job ${this.appStorage.dataID} in project ${this.appStorage.onlineSession?.loginData?.project}`);
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
          setTimeout(() => {
            this.saving = 'success';
          }, 200);
        }
      }
    ));

    this.navbarServ.showExport = this.settingsService.projectsettings.navigation.export;

    if (!isUnset(this.transcrService.annotation)) {
      this.levelSubscriptionID = this.subscrmanager.add(
        this.transcrService.currentlevel.segments.onsegmentchange.subscribe(this.transcrService.saveSegments)
      );
    } else {
      this.subscrmanager.add(this.transcrService.dataloaded.subscribe(() => {
        this.levelSubscriptionID = this.subscrmanager.add(
          this.transcrService.currentlevel.segments.onsegmentchange.subscribe(this.transcrService.saveSegments)
        );
      }));
    }

    this.subscrmanager.add(this.transcrService.levelchanged.subscribe(
      (level: Level) => {
        (this.currentEditor.instance as any).update();

        // important: subscribe to level changes in order to save proceedings
        this.subscrmanager.removeById(this.levelSubscriptionID);
        this.levelSubscriptionID = this.subscrmanager.add(
          this.transcrService.currentlevel.segments.onsegmentchange.subscribe(this.transcrService.saveSegments)
        );
        this.uiService.addElementFromEvent('level', {value: 'changed'}, Date.now(),
          this.audioManager.createSampleUnit(0),
          -1, null, null, level.name);
      }
    ));

    if (this.appStorage.useMode === LoginMode.ONLINE || this.appStorage.useMode === LoginMode.DEMO) {
      if (!isUnset(this.settingsService.appSettings.octra.inactivityNotice)
        && !isUnset(this.settingsService.appSettings.octra.inactivityNotice.showAfter)
        && this.settingsService.appSettings.octra.inactivityNotice.showAfter > 0) {
        // if waitTime is 0 the inactivity modal isn't shown
        let waitTime = this.settingsService.appSettings.octra.inactivityNotice.showAfter;
        waitTime = waitTime * 60 * 1000;
        this.subscrmanager.add(interval(5000).subscribe(
          () => {
            if (Date.now() - this.uiService.lastAction > waitTime && !this.inactivityModal.visible) {
              this.inactivityModal.open().then((answer) => {
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
              }).catch((error) => {
                console.error(error);
              });
            }
          }
        ));
      }
    }

    // set general shortcuts
    this.generalShortcuts.push({
      label: 'feedback and send 1',
      focusonly: false,
      combination: {
        mac: 'SHIFT + ALT + 1',
        pc: 'SHIFT + ALT + 1'
      }
    });

    this.generalShortcuts.push({
      label: 'feedback and send 2',
      focusonly: false,
      combination: {
        mac: 'SHIFT + ALT + 2',
        pc: 'SHIFT + ALT + 2'
      }
    });

    this.generalShortcuts.push({
      label: 'feedback and send 3',
      focusonly: false,
      combination: {
        mac: 'SHIFT + ALT + 3',
        pc: 'SHIFT + ALT + 3'
      }
    });

    this.cd.markForCheck();
    this.cd.detectChanges();
  }

  ngAfterViewInit() {
  }

  private async checkCurrentEditor() {
    // TODO move this to another place
    const currentEditor = this.appStorage.interface;
    const found = this.projectsettings.interfaces.find((x) => {
      return currentEditor === x;
    });

    if (isUnset(found)) {
      this.appStorage.interface = this.projectsettings.interfaces[0];
    }
  }

  ngAfterContentInit() {
  }

  ngAfterViewChecked() {
  }

  ngOnDestroy() {
    this.subscrmanager.destroy();
  }

  @HostListener('window:keydown', ['$event'])
  onKeyUp($event) {
    if ($event.altKey && $event.which === 56) {
      if (!this.modalShortcuts.visible) {
        this.modalShortcuts.open();
      } else {
        this.modalShortcuts.close();
      }
      $event.preventDefault();
    } else if ($event.altKey && $event.which === 57) {
      if (!this.modalGuidelines.visible) {
        this.modalGuidelines.open().catch((error) => {
          console.error(error);
        });
      } else {
        this.modalGuidelines.close();
      }
      $event.preventDefault();
    }
    if ($event.altKey && $event.which === 48) {
      if (!this.modalOverview.visible) {
        this.transcrService.analyse();
        this.modalOverview.open().catch((error) => {
          console.error(error);
        });
      } else {
        this.modalOverview.close();
      }
      $event.preventDefault();
    }
  }

  changeEditor(name: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.editorloaded = false;
      this.cd.detectChanges();
      let comp: any = null;

      if ((name === null || name === undefined) || name === '') {
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

      if (!(comp === null || comp === undefined)) {
        const id = this.subscrmanager.add(comp.initialized.subscribe(
          () => {
            this.editorloaded = true;
            this.subscrmanager.removeById(id);
            this.cd.detectChanges();

            resolve();
          }
        ));

        if (!(this.appLoadeditor === null || this.appLoadeditor === undefined)) {
          const componentFactory = this._componentFactoryResolver.resolveComponentFactory(comp);

          setTimeout(() => {
            const viewContainerRef = this.appLoadeditor.viewContainerRef;
            viewContainerRef.clear();

            this._currentEditor = viewContainerRef.createComponent(componentFactory);
            let caretpos = -1;

            if (!isUnset(this.currentEditor) && !isUnset((this.currentEditor.instance as any).editor)) {
              caretpos = (this.currentEditor.instance as any).editor.caretpos;
            }

            if ((this.currentEditor.instance as any).hasOwnProperty('openModal')) {
              this.subscrmanager.add((this.currentEditor.instance as any).openModal.subscribe(() => {
                console.log(`overview opened!`);
                (this.currentEditor.instance as any).disableAllShortcuts();
                this.modalOverview.open().then(() => {
                  console.log(`overview closed`);
                  (this.currentEditor.instance as any).enableAllShortcuts();
                }).catch((error) => {
                  console.error(error);
                });
              }));
            }

            this.uiService.addElementFromEvent('editor:changed', {value: name}, Date.now(),
              null, null, null, null, 'editors');
            console.log(`opened ${name}`);

            this.cd.detectChanges();
          }, 20);

        } else {
          reject('ERROR appLoadeditor is null');
          console.error('ERROR appLoadeditor is null');
        }
      } else {
        reject('ERROR appLoadeditor is null');
        console.error('ERROR editor component is null');
      }
    });
  }

  translate(languages: any, lang: string): string {
    if ((languages[lang] === null || languages[lang] === undefined)) {
      for (const attr in languages) {
        // take first
        if (languages.hasOwnProperty(attr)) {
          return languages[attr];
        }
      }
    }
    return languages[lang];
  }

  public onSendNowClick() {
    this.sendOk = true;

    const json: any = this.transcrService.exportDataToJSON();

    if (this.appStorage.useMode === LoginMode.ONLINE) {
      this.transcrSendingModal.open().catch((error) => {
        console.error(error);
      });
      this.api.saveSession(json.transcript, json.project, json.annotator,
        json.jobno, json.id, json.status, json.comment, json.quality, json.log).then((result) => {
        if (result !== null) {
          this.unsubscribeSubscriptionsForThisAnnotation();
          this.appStorage.submitted = true;

          setTimeout(() => {
            this.waitForSend = false;
            this.transcrSendingModal.close();

            // only if opened
            this.modalOverview.close();

            this.nextTranscription(result);
          }, 500);
        } else {
          this.sendError = this.langService.translate('send error');
        }
      }).catch((error) => {
        this.onSendError(error);
      });
    } else if (this.appStorage.useMode === LoginMode.DEMO) {
      // only if opened
      this.modalOverview.close();

      this.modalDemoEnd.open().then((action: ModalEndAnswer) => {
        this.appStorage.savingNeeded = false;
        this.waitForSend = false;
        this.modalDemoEnd.close(action);

        switch (action) {
          case(ModalEndAnswer.CANCEL):
            break;
          case(ModalEndAnswer.QUIT):
            this.abortTranscription();
            break;
          case(ModalEndAnswer.CONTINUE):
            this.transcrSendingModal.open().catch((error) => {
              console.error(error);
            });
            setTimeout(() => {
              // simulate nextTranscription
              this.transcrSendingModal.close();
              this.reloadDemo();
            }, 1000);
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

        if (!isUnset(this.projectsettings.octra) &&
          !isUnset(this.projectsettings.octra.showOverviewIfTranscriptNotValid)) {
          showOverview = this.projectsettings.octra.showOverviewIfTranscriptNotValid;
        }

        if (!isUnset(this.projectsettings.octra)
          && !isUnset(this.projectsettings.octra.sendValidatedTranscriptionOnly)) {
          validTranscriptOnly = this.projectsettings.octra.sendValidatedTranscriptionOnly;
        }

        if ((
          (!validTranscript && showOverview) || !this.modalOverview.feedBackComponent.valid)
          || (validTranscriptOnly && !validTranscript)
        ) {
          this.waitForSend = false;
          this.modalOverview.open().catch((error) => {
            console.error(error);
          });
        } else {
          this.onSendNowClick();
        }
      });
    });
  }

  nextTranscription(json: any) {
    this.transcrService.endTranscription(false);
    this.clearDataPermanently();

    if (!isUnset(json)) {
      const data = json.data as IDataEntry;
      if (data && data.hasOwnProperty('url') && data.hasOwnProperty('id')) {
        // get transcript data that already exists
        const jsonStr = JSON.stringify(json.data);
        this.appStorage.serverDataEntry = parseServerDataEntry(jsonStr);

        if (this.appStorage.serverDataEntry.hasOwnProperty('transcript')) {
          if (!Array.isArray(this.appStorage.serverDataEntry.transcript)) {
            console.log(`server transcript is not array, set []`);
            this.appStorage.serverDataEntry = {
              ...this.appStorage.serverDataEntry,
              transcript: []
            }
          } else {
            console.log(`seervertranscript is array`);
          }
        } else {
          console.log(`no server transcript`);
        }

        if (isUnset(this.appStorage.serverDataEntry.logtext) ||
          !Array.isArray(this.appStorage.serverDataEntry.logtext)) {
          this.appStorage.serverDataEntry = {
            ...this.appStorage.serverDataEntry,
            logtext: []
          };
        }

        let promptText = '';
        if (this.appStorage.useMode === LoginMode.ONLINE && data.hasOwnProperty('prompttext') && data.prompttext !== '') {
          // get transcript data that already exists
          promptText = json.data.prompttext;
        }

        let serverComment = '';
        if (this.appStorage.useMode === LoginMode.ONLINE && data.hasOwnProperty('comment') && data.comment !== '') {
          // get transcript data that already exists
          serverComment = data.comment;
        }

        let jobsLeft = 0;
        if (json.hasOwnProperty('message') && typeof (json.message) === 'number') {
          jobsLeft = Number(json.message);
        }

        this.appStorage.setOnlineSession({
          id: this.appStorage.onlineSession.loginData.id,
          project: this.appStorage.onlineSession.loginData.project,
          password: this.appStorage.onlineSession.loginData.password,
          jobno: this.appStorage.onlineSession.loginData.jobNumber
        }, data.id, data.url, promptText, serverComment, jobsLeft);

        Functions.navigateTo(this.router, ['/user/load'], AppInfo.queryParamsHandling).catch((error) => {
          console.error(error);
        });
      } else {
        console.error(`can't read next segment because audioURL or id is undefined!`);
        console.log(json);
      }
    } else {
      console.error(`json array for transcription next is null`);
    }
  }

  reloadDemo() {
    this.transcrService.endTranscription(false);
    this.clearDataPermanently();
    const audioExample = this.settingsService.getAudioExample(this.langService.getActiveLang());

    if (!isUnset(audioExample)) {
      // transcription available
      this.appStorage.setDemoSession(audioExample.url, audioExample.description, this.appStorage.jobsLeft - 1);

      Functions.navigateTo(this.router, ['/user/load'], AppInfo.queryParamsHandling).catch((error) => {
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
    this.appStorage.submitted = false;
    this.appStorage.clearAnnotationPermanently();
    this.appStorage.feedback = {};
    this.appStorage.comment = '';
    this.appStorage.clearLoggingDataPermanently();
    this.uiService.elements = [];
    this.appStorage.audioLoaded = false;
  }

  public onSaveTranscriptionButtonClicked() {
    const converter = new PartiturConverter();
    const oannotjson = this.transcrService.annotation.getObj(this.transcrService.audioManager.ressource.info.duration);
    const result: IFile = converter.export(oannotjson, this.transcrService.audiofile, 0).file;
    result.name = result.name.replace('-' + oannotjson.levels[0].name, '');

    // upload transcript
    const form: FormData = new FormData();
    let host = 'https://clarin.phonetik.uni-muenchen.de/BASWebServices/services/';

    if (!(this.appStorage.urlParams.host === null || this.appStorage.urlParams.host === undefined)) {
      host = this.appStorage.urlParams.host;
    }

    const url = `${host}uploadFileMulti`;

    form.append('file0', new File([result.content], result.name, {type: 'text/plain'}));

    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);

    xhr.onloadstart = (e) => {
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

}
