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

import {
  APIService,
  AppStorageService,
  AudioService,
  Entry,
  KeymappingService,
  MessageService,
  SettingsService,
  TranscriptionService,
  UserInteractionsService
} from '../../shared/service';

import {BrowserInfo, SubscriptionManager} from '../../shared';
import {LangChangeEvent, TranslateService} from '@ngx-translate/core';
import {LoadeditorDirective} from '../../shared/directive/loadeditor.directive';
import {ProjectSettings} from '../../obj/Settings';
import {EditorComponents} from '../../../editors/components';
import {Level} from '../../obj/Annotation';
import {PlayBackState} from '../../../media-components/obj/media';
import {HttpClient} from '@angular/common/http';
import {IFile, PartiturConverter} from '../../obj/Converters';
import {BugReportService} from '../../shared/service/bug-report.service';
import * as X2JS from 'x2js';
import {ModalService} from '../../modals/modal.service';
import {Observable, throwError} from 'rxjs';
import {TranscriptionGuidelinesModalComponent} from '../../modals/transcription-guidelines-modal/transcription-guidelines-modal.component';
import {AudioManager} from '../../../media-components/obj/media/audio/AudioManager';
import {NavbarService} from '../navbar/navbar.service';
import {OverviewModalComponent} from '../../modals/overview-modal/overview-modal.component';
import {AppInfo} from '../../../app.info';
import {TranscriptionStopModalAnswer} from '../../modals/transcription-stop-modal/transcription-stop-modal.component';
import {TranscriptionSendingModalComponent} from '../../modals/transcription-sending-modal/transcription-sending-modal.component';
import {Functions, isNullOrUndefined} from '../../shared/Functions';
import {InactivityModalComponent} from '../../modals/inactivity-modal/inactivity-modal.component';

@Component({
  selector: 'app-transcription',
  templateUrl: './transcription.component.html',
  styleUrls: ['./transcription.component.css'],
  providers: [MessageService]
})
export class TranscriptionComponent implements OnInit,
  OnDestroy, AfterViewInit, AfterContentInit, OnChanges, AfterViewChecked, AfterContentChecked, AfterContentInit {

  public get Interface(): string {
    return this.interface;
  }

  get loaded(): boolean {
    return (this.audio.loaded && !(this.transcrService.guidelines === null || this.transcrService.guidelines === undefined));
  }

  get appc(): any {
    return this.settingsService.app_settings;
  }

  get projectsettings(): ProjectSettings {
    return this.settingsService.projectsettings;
  }

  get responsive(): boolean {
    return this.settingsService.responsive.enabled;
  }

  get currentEditor(): ComponentRef<Component> {
    return this._currentEditor;
  }

  private get app_settings() {
    return this.settingsService.app_settings;
  }

  constructor(public router: Router,
              private _componentFactoryResolver: ComponentFactoryResolver,
              public audio: AudioService,
              public uiService: UserInteractionsService,
              public transcrService: TranscriptionService,
              public appStorage: AppStorageService,
              public keyMap: KeymappingService,
              public changeDetecorRef: ChangeDetectorRef,
              public navbarServ: NavbarService,
              public settingsService: SettingsService,
              public modService: ModalService,
              public langService: TranslateService,
              private api: APIService,
              private bugService: BugReportService,
              private http: HttpClient) {
    this.subscrmanager = new SubscriptionManager();
    this.audiomanager = this.audio.audiomanagers[0];

    this.navbarServ.transcrService = this.transcrService;
    this.navbarServ.uiService = this.uiService;

    // overwrite logging option using projectconfig
    if (this.appStorage.usemode === 'online') {
      this.appStorage.logging = this.settingsService.projectsettings.logging.forced;
    }
    this.uiService.enabled = this.appStorage.logging;

    this.subscrmanager.add(this.audiomanager.statechange.subscribe((state) => {
        if (!this.audiomanager.playonhover && !this.modal_overview.visible) {
          let caretpos = -1;

          if (!(((<any>this.currentEditor.instance).editor) === null || ((<any>this.currentEditor.instance).editor) === undefined)) {
            caretpos = (<any>this.currentEditor.instance).editor.caretpos;
          }

          // make sure that events from playonhover are not logged
          if (state !== PlayBackState.PLAYING && state !== PlayBackState.INITIALIZED && state !== PlayBackState.PREPARE) {
            this.uiService.addElementFromEvent('audio',
              {value: state.toLowerCase()}, Date.now(),
              Math.round(this.audiomanager.playposition * this.transcrService.audiomanager.sampleRateFactor),
              caretpos, this.appStorage.Interface);
          }
        }
      },
      (error) => {
        console.error(error);
      }));

    // TODO remove this case for later versions
    this.interface = (this.appStorage.Interface === 'Editor without signal display') ? 'Dictaphone Editor' : this.appStorage.Interface;

  }

  // TODO change to ModalComponents!
  @ViewChild('modal_shortcuts') modal_shortcuts: any;
  @ViewChild('modal_overview') modal_overview: OverviewModalComponent;
  @ViewChild(LoadeditorDirective) appLoadeditor: LoadeditorDirective;
  @ViewChild('modal') modal: any;
  @ViewChild('transcrSendingModal') transcrSendingModal: TranscriptionSendingModalComponent;
  @ViewChild('modal_guidelines') modal_guidelines: TranscriptionGuidelinesModalComponent;
  @ViewChild('inactivityModal') inactivityModal: InactivityModalComponent;

  public send_error = '';
  public showdetails = false;
  public saving = '';
  public interface = '';
  public shortcutslist: Entry[] = [];
  public editorloaded = false;
  public feedback_expanded = false;
  user: number;
  public platform = BrowserInfo.platform;
  private subscrmanager: SubscriptionManager;
  private send_ok = false;
  private level_subscription_id = 0;
  private audiomanager: AudioManager;
  private _currentEditor: ComponentRef<Component>;
  abortTranscription = () => {
    if (this.appStorage.usemode === 'online'
      && !(this.settingsService.projectsettings.octra === null || this.settingsService.projectsettings.octra === undefined)
      && !(this.settingsService.projectsettings.octra.theme === null || this.settingsService.projectsettings.octra.theme === undefined)
      && this.settingsService.isTheme('shortAudioFiles')) {
      // clear transcription

      this.transcrService.endTranscription();

      this.api.setOnlineSessionToFree(this.appStorage).then(() => {
        Functions.navigateTo(this.router, ['/logout'], AppInfo.queryParamsHandling).then(() => {
          this.appStorage.clearSession();

          this.appStorage.clearLocalStorage().then(() => {
            this.appStorage.saveUser();
          }).catch((error) => {
            console.error(error);
          });
        });
      }).catch((error) => {
        console.error(error);
      });
    } else {
      this.modService.show('transcription_stop').then((answer: TranscriptionStopModalAnswer) => {
        if (answer === TranscriptionStopModalAnswer.QUIT) {
          this.transcrService.endTranscription();

          Functions.navigateTo(this.router, ['/logout'], AppInfo.queryParamsHandling);
        }
      }).catch((error) => {
        console.error(error);
      });
    }
  }

  onSendError = (error) => {
    this.send_error = error.message;
    return throwError(error);
  }

  ngOnChanges(changes: SimpleChanges) {
  }

  ngAfterContentChecked() {
  }

  ngOnInit() {
    this.navbarServ.interfaces = this.projectsettings.interfaces;

    // because of the loading data before through the loading component you can be sure the audio was loaded
    // correctly

    this.transcrService.guidelines = this.settingsService.guidelines;

    // reload guidelines
    this.subscrmanager.add(
      this.settingsService.guidelinesloaded.subscribe(
        (guidelines) => {
          this.transcrService.guidelines = guidelines;
        }
      )
    );

    for (let i = 0; i < this.transcrService.guidelines.markers.length; i++) {
      const marker = this.transcrService.guidelines.markers[i];
      if (marker.type === 'break') {
        this.transcrService.break_marker = marker;
        break;
      }
    }

    // this.transcrService.annotation.audiofile.samplerate = this.audiomanager.ressource.info.samplerate;
    this.navbarServ.show_interfaces = this.settingsService.projectsettings.navigation.interfaces;

    // load guidelines on language change
    this.subscrmanager.add(this.langService.onLangChange.subscribe(
      (event: LangChangeEvent) => {
        let lang = event.lang;
        const found = this.settingsService.projectsettings.languages.find(
          x => {
            return x === lang;
          }
        );
        if ((found === null || found === undefined)) {
          // lang not in project config, fall back to first defined
          lang = this.settingsService.projectsettings.languages[0];
        }

        this.settingsService.loadGuidelines(event.lang, './config/localmode/guidelines/guidelines_' + lang + '.json');
      }
    ));


    this.subscrmanager.add(this.navbarServ.interfacechange.subscribe(
      (editor) => {
        this.changeEditor(editor);
      }
    ));

    this.subscrmanager.add(
      this.uiService.afteradd.subscribe((elem) => {
        if (this.appStorage.logging) {
          this.appStorage.saveLogItem(elem.getDataClone());
        }
      }));
    this.changeEditor(this.interface);
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

    this.navbarServ.show_export = this.settingsService.projectsettings.navigation.export;

    if (!(this.transcrService.annotation === null || this.transcrService.annotation === undefined)) {
      this.level_subscription_id = this.subscrmanager.add(
        this.transcrService.currentlevel.segments.onsegmentchange.subscribe(this.transcrService.saveSegments)
      );
    } else {
      this.subscrmanager.add(this.transcrService.dataloaded.subscribe(() => {
        this.level_subscription_id = this.subscrmanager.add(
          this.transcrService.currentlevel.segments.onsegmentchange.subscribe(this.transcrService.saveSegments)
        );
      }));
    }

    this.subscrmanager.add(this.transcrService.levelchanged.subscribe(
      (level: Level) => {
        (<any>this.currentEditor.instance).update();

        // important: subscribe to level changes in order to save proceedings
        this.subscrmanager.remove(this.level_subscription_id);
        this.level_subscription_id = this.subscrmanager.add(
          this.transcrService.currentlevel.segments.onsegmentchange.subscribe(this.transcrService.saveSegments)
        );
        this.uiService.addElementFromEvent('level', {value: 'changed'}, Date.now(), 0, -1, level.name);
      }
    ));

    if (this.appStorage.usemode === 'online') {
      if (!isNullOrUndefined(this.settingsService.app_settings.octra.inactivityNotice)
        && !isNullOrUndefined(this.settingsService.app_settings.octra.inactivityNotice.showAfter)
        && this.settingsService.app_settings.octra.inactivityNotice.showAfter > 0) {
        // if waitTime is 0 the inactivity modal isn't shown
        let waitTime = this.settingsService.app_settings.octra.inactivityNotice.showAfter;
        waitTime = waitTime * 60 * 1000;
        this.subscrmanager.add(Observable.interval(5000).subscribe(
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
                    window.location.reload(true);
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

    this.bugService.init(this.transcrService);
  }

  ngAfterViewInit() {
    const found = this.projectsettings.interfaces.find((x) => {
      return this.appStorage.Interface === x;
    });

    if ((found === null || found === undefined)) {
      this.appStorage.Interface = this.projectsettings.interfaces[0];
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
      if (!this.modal_shortcuts.visible) {
        this.modal_shortcuts.open();
      } else {
        this.modal_shortcuts.close();
      }
      $event.preventDefault();
    } else if ($event.altKey && $event.which === 57) {
      if (!this.modal_guidelines.visible) {
        this.modal_guidelines.open();
      } else {
        this.modal_guidelines.close();
      }
      $event.preventDefault();
    }
    if ($event.altKey && $event.which === 48) {
      if (!this.modal_overview.visible) {
        this.transcrService.analyse();
        this.modal_overview.open();
      } else {
        this.modal_overview.close();
      }
      $event.preventDefault();
    }
  }

  changeEditor(name: string) {
    let comp: any = null;

    if ((name === null || name === undefined) || name === '') {
      // fallback to last editor
      name = EditorComponents[EditorComponents.length - 1].name;
    }
    for (let i = 0; i < EditorComponents.length; i++) {
      if (name === EditorComponents[i].name) {
        this.appStorage.Interface = name;
        this.interface = name;
        comp = EditorComponents[i].editor;
        break;
      }
    }

    if (!(comp === null || comp === undefined)) {
      this.editorloaded = false;
      const id = this.subscrmanager.add(comp.initialized.subscribe(
        () => {
          setTimeout(() => {
            this.editorloaded = true;
            this.subscrmanager.remove(id);
          }, 100);
        }
      ));

      if (!(this.appLoadeditor === null || this.appLoadeditor === undefined)) {
        const componentFactory = this._componentFactoryResolver.resolveComponentFactory(comp);

        const viewContainerRef = this.appLoadeditor.viewContainerRef;
        viewContainerRef.clear();

        this._currentEditor = viewContainerRef.createComponent(componentFactory);

        let caretpos = -1;

        if (!((<any>this.currentEditor.instance).editor === null || (<any>this.currentEditor.instance).editor === undefined)) {
          caretpos = (<any>this.currentEditor.instance).editor.caretpos;
        }

        if ((<any>this.currentEditor.instance).hasOwnProperty('openModal')) {
          this.subscrmanager.add((<any>this.currentEditor.instance).openModal.subscribe(() => {
            this.modal_overview.open();
          }));
        }

        this.uiService.addElementFromEvent('editor:changed', {value: name}, Date.now(),
          null, null, 'editors');

      } else {
        console.error('ERROR appLoadeditor is null');
      }
    } else {
      console.error('ERROR editor component is null');
    }
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
    this.transcrSendingModal.open();
    this.send_ok = true;

    const json: any = this.transcrService.exportDataToJSON();

    if (this.settingsService.isTheme('shortAudioFiles')) {
      if (this.appStorage.feedback === 'SEVERE') {
        // postpone audio file
        json.status = 'POSTPONED';
        // don't overwrite server comment
        json.comment = this.appStorage.servercomment;
      }
    }

    console.log(`log is:`);
    this.api.saveSession(json.transcript, json.project, json.annotator,
      json.jobno, json.id, json.status, json.comment, json.quality, json.log).then((result) => {
      if (result !== null) {
        this.appStorage.submitted = true;

        setTimeout(() => {
          this.transcrSendingModal.close();

          // only if opened
          this.modal_overview.close();

          this.nextTranscription(result);
        }, 500);
      } else {
        this.send_error = this.langService.instant('send error');
      }
    }).catch((error) => {
      this.onSendError(error);
    });
  }

  onSendButtonClick() {
    let validTranscript = true;
    let showOverview = true;
    let validTranscriptOnly = false;

    this.transcrService.validateAll();
    validTranscript = this.transcrService.transcriptValid;

    if (!isNullOrUndefined(this.projectsettings.octra) && !isNullOrUndefined(this.projectsettings.octra.showOverviewIfTranscriptNotValid)) {
      showOverview = this.projectsettings.octra.showOverviewIfTranscriptNotValid;
    }

    if (!isNullOrUndefined(this.projectsettings.octra) && !isNullOrUndefined(this.projectsettings.octra.sendValidatedTranscriptionOnly)) {
      validTranscriptOnly = this.projectsettings.octra.sendValidatedTranscriptionOnly;
    }

    if ((
      (!validTranscript && showOverview) || !this.modal_overview.feedBackComponent.valid)
      || (validTranscriptOnly && !validTranscript)
    ) {
      this.modal_overview.open();
    } else {
      this.onSendNowClick();
    }
  }

  nextTranscription(json: any) {
    this.transcrService.endTranscription(false);
    this.clearData();

    if (!(json === null || json === undefined)) {
      if (json.data && json.data.hasOwnProperty('url') && json.data.hasOwnProperty('id')) {
        // transcription available
        this.appStorage.audio_url = json.data.url;
        this.appStorage.data_id = json.data.id;

        // change number of remaining jobs
        if (json.hasOwnProperty('message')) {
          this.appStorage.jobs_left = Number(json.message);
        }

        // get transcript data that already exists
        if (json.data.hasOwnProperty('transcript')) {
          const transcript = JSON.parse(json.data.transcript);

          if (Array.isArray(transcript) && transcript.length > 0) {
            this.appStorage.servertranscipt = transcript;
          }
        }

        if (this.appStorage.usemode === 'online' && json.data.hasOwnProperty('prompt') || json.data.hasOwnProperty('prompttext')) {
          // get transcript data that already exists
          if (json.data.hasOwnProperty('prompt')) {
            const prompt = json.data.prompt;

            if (prompt) {
              this.appStorage.prompttext = prompt;
            }
          } else if (json.data.hasOwnProperty('prompttext')) {
            const prompt = json.data.prompttext;

            if (prompt) {
              this.appStorage.prompttext = prompt;
            }
          }
        } else {
          this.appStorage.prompttext = '';
        }

        if (this.appStorage.usemode === 'online' && json.data.hasOwnProperty('comment') || json.data.hasOwnProperty('comment')) {
          // get transcript data that already exists
          if (json.data.hasOwnProperty('comment')) {
            const comment = json.data.comment;

            if (comment) {
              this.appStorage.servercomment = comment;
            }
          }
        } else {
          this.appStorage.servercomment = '';
        }

        if (json.hasOwnProperty('message') && typeof (json.message) === 'number') {
          this.appStorage.jobs_left = Number(json.message);
        }

        Functions.navigateTo(this.router, ['/user/load'], AppInfo.queryParamsHandling);
      } else {
        this.appStorage.submitted = true;
        Functions.navigateTo(this.router, ['/user/transcr/end'], AppInfo.queryParamsHandling);
      }
    } else {
      console.error(`json array for transcription next is null`);
    }
  }

  closeTranscriptionAndGetNew() {
    // close current session
    this.api.closeSession(this.appStorage.user.id, this.appStorage.data_id, this.appStorage.servercomment).then(() => {
      // begin new session
      this.api.beginSession(this.appStorage.user.project, this.appStorage.user.id, this.appStorage.user.jobno).then((json) => {
        // new session
        this.nextTranscription(json);
      }).catch((error) => {
        console.error(error);
      });
    }).catch((error) => {
      console.error(error);
    });
  }

  clearData() {
    this.appStorage.submitted = false;
    this.appStorage.clearAnnotationData().catch((err) => {
      console.error(err);
    });
    this.appStorage.feedback = {};
    this.appStorage.comment = '';
    this.appStorage.clearLoggingData().catch((err) => {
      console.error(err);
    });
    this.uiService.elements = [];
    this.settingsService.clearSettings();
  }

  public onSaveTranscriptionButtonClicked() {
    const converter = new PartiturConverter();
    const oannotjson = this.transcrService.annotation.getObj(this.transcrService.audiomanager.sampleRateFactor,
      this.transcrService.audiomanager.originalInfo.duration.samples);
    const result: IFile = converter.export(oannotjson, this.transcrService.audiofile, 0).file;
    result.name = result.name.replace('-' + oannotjson.levels[0].name, '');

    // upload transcript
    const form: FormData = new FormData();
    let host = 'https://clarin.phonetik.uni-muenchen.de/BASWebServices/services/';

    if (!(this.appStorage.url_params['host'] === null || this.appStorage.url_params['host'] === undefined)) {
      host = this.appStorage.url_params['host'];
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
      const result2 = e.currentTarget['responseText'];

      const x2js = new X2JS();
      let json: any = x2js.xml2js(result2);
      json = json.UploadFileMultiResponse;

      if (json.success === 'true') {
        // TODO set urls to results only
        let resulturl = '';
        if (Array.isArray(json.fileList.entry)) {
          for (let i = 0; i < json.fileList.length; i++) {
            resulturl = json.fileList.entry[i].value;
            break;
          }
        } else {
          // json attribute entry is an object
          resulturl = json.fileList.entry['value'];
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
          error: json['message']
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
}
