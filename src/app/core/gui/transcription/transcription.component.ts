import {
  AfterContentChecked, AfterContentInit, AfterViewChecked, AfterViewInit, ChangeDetectorRef, Component,
  ComponentFactoryResolver, ComponentRef, HostListener, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild
} from '@angular/core';
import {Router} from '@angular/router';
import {BsModalComponent} from 'ng2-bs3-modal/ng2-bs3-modal';

import {
  APIService, AppStorageService, AudioService, Entry, KeymappingService, MessageService, ModalService,
  NavbarService, SettingsService, TranscriptionService, UserInteractionsService
} from '../../shared/service';

import {BrowserInfo, SubscriptionManager} from '../../shared';
import {isArray, isNullOrUndefined, isNumber} from 'util';
import {LangChangeEvent, TranslateService} from '@ngx-translate/core';
import {TranscrGuidelinesComponent} from '../transcr-guidelines/transcr-guidelines.component';
import {LoadeditorDirective} from '../../shared/directive/loadeditor.directive';
import {Observable} from 'rxjs/Observable';
import {ProjectSettings} from '../../obj/Settings';
import {NgForm} from '@angular/forms';
import {AudioManager} from '../../../media-components/obj/media/audio';
import {EditorComponents} from '../../../editors/components';
import {Level} from '../../obj/Annotation';
import {getPlayBackString, PlayBackState} from '../../../media-components/obj/media';
import {HttpClient} from '@angular/common/http';
import {IFile, PartiturConverter} from '../../obj/Converters';
import {BugReportService} from '../../shared/service/bug-report.service';
import * as X2JS from 'x2js';

@Component({
  selector: 'app-transcription',
  templateUrl: './transcription.component.html',
  styleUrls: ['./transcription.component.css'],
  providers: [MessageService]
})
export class TranscriptionComponent implements OnInit,
  OnDestroy, AfterViewInit, AfterContentInit, OnChanges, AfterViewChecked, AfterContentChecked, AfterContentInit {
  get currentEditor(): ComponentRef<Component> {
    return this._currentEditor;
  }

  private subscrmanager: SubscriptionManager;

  @ViewChild('modal_shortcuts') modal_shortcuts: BsModalComponent;
  @ViewChild('modal_guidelines') modal_guidelines: TranscrGuidelinesComponent;
  @ViewChild('modal_overview') modal_overview: BsModalComponent;
  @ViewChild(LoadeditorDirective) appLoadeditor: LoadeditorDirective;
  private _currentEditor: ComponentRef<Component>;

  @ViewChild('modal') modal: BsModalComponent;
  @ViewChild('modal2') modal2: BsModalComponent;
  @ViewChild('fo') feedback_form: NgForm;
  public send_error = '';

  public showdetails = false;
  public saving = '';
  public interface = '';
  private send_ok = false;
  public shortcutslist: Entry[] = [];
  public editorloaded = false;
  public feedback_data = {};

  private level_subscription_id = 0;
  public feedback_expanded = false;

  get loaded(): boolean {
    return (this.audio.loaded && !isNullOrUndefined(this.transcrService.guidelines));
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

  user: number;

  public platform = BrowserInfo.platform;

  private audiomanager: AudioManager;

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
    console.log('transcription component called');
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
      if (!this.audiomanager.playonhover) {
        let caretpos = -1;

        if (!isNullOrUndefined((<any> this.currentEditor.instance).editor)) {
          caretpos = (<any> this.currentEditor.instance).editor.caretpos;
        }

        // make sure that events from playonhover are not logged
        if (state !== PlayBackState.PLAYING && state !== PlayBackState.INITIALIZED && state !== PlayBackState.PREPARE) {
          this.uiService.addElementFromEvent('audio',
            {value: getPlayBackString(state).toLowerCase()}, Date.now(),
            this.audiomanager.playposition, caretpos, this.appStorage.Interface);
        }
      }
    }));

    this.interface = this.appStorage.Interface;

  }

  private get app_settings() {
    return this.settingsService.app_settings;
  }

  ngOnChanges(changes: SimpleChanges) {
  }

  ngAfterContentChecked() {
  }

  ngOnInit() {
    this.navbarServ.interfaces = this.projectsettings.interfaces;
    console.log('usemode is in transcr: ' + this.appStorage.usemode);

    // because of the loading data before through the loading component you can be sure the audio was loaded
    // correctly
    this.loadForm();

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
        if (isNullOrUndefined(this.settingsService.projectsettings.languages.find(
            x => {
              return x === lang;
            }
          ))) {
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
    this.changeDetecorRef.detectChanges();

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

    if (!isNullOrUndefined(this.transcrService.annotation)) {
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
        (<any> this.currentEditor.instance).update();

        // important: subscribe to level changes in order to save proceedings
        this.subscrmanager.remove(this.level_subscription_id);
        this.level_subscription_id = this.subscrmanager.add(
          this.transcrService.currentlevel.segments.onsegmentchange.subscribe(this.transcrService.saveSegments)
        );
        this.uiService.addElementFromEvent('level', {value: 'changed'}, Date.now(), 0, -1, level.name);
      }
    ));

    this.bugService.init(this.transcrService);
  }

  ngAfterViewInit() {
    if (isNullOrUndefined(this.projectsettings.interfaces.find((x) => {
        return this.appStorage.Interface === x;
      }))) {
      this.appStorage.Interface = this.projectsettings.interfaces[0];
    }

    jQuery.material.init();
  }

  abortTranscription = () => {
    if (this.appStorage.usemode === 'online') {
      this.saveFeedbackform();
    }
    this.transcrService.endTranscription();
    this.router.navigate(['/logout'], {
      queryParamsHandling: 'preserve'
    });
  };

  ngAfterContentInit() {
  }

  ngAfterViewChecked() {
  }

  submitTranscription() {
    this.router.navigate(['/user/transcr/submit'], {
      queryParamsHandling: 'preserve'
    });
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
        this.modal_shortcuts.dismiss();
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
        this.modal_overview.dismiss();
      }
      $event.preventDefault();
    }
  }

  onSegmentInOverviewClicked(segnumber: number) {
    this.transcrService.requestSegment(segnumber);
    this.modal_overview.close();
  }

  changeEditor(name: string) {
    let comp: any = null;

    if (isNullOrUndefined(name) || name === '') {
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

    if (!isNullOrUndefined(comp)) {
      this.editorloaded = false;
      const id = this.subscrmanager.add(comp.initialized.subscribe(
        () => {
          setTimeout(() => {
            this.editorloaded = true;
            this.subscrmanager.remove(id);
          }, 100);
        }
      ));

      if (!isNullOrUndefined(this.appLoadeditor)) {
        const componentFactory = this._componentFactoryResolver.resolveComponentFactory(comp);

        const viewContainerRef = this.appLoadeditor.viewContainerRef;
        viewContainerRef.clear();

        this._currentEditor = viewContainerRef.createComponent(componentFactory);

        let caretpos = -1;

        if (!isNullOrUndefined((<any> this.currentEditor.instance).editor)) {
          caretpos = (<any> this.currentEditor.instance).editor.caretpos;
        }

        this.uiService.addElementFromEvent('editor', {value: 'changed'}, Date.now(),
          null, null, name);

      } else {
        console.error('ERROR appLoadeditor is null');
      }
    } else {
      console.error('ERROR editor component is null');
    }
  }

  expandFeedback() {
    if (jQuery('#bottom-feedback').css('height') === '30px') {
      jQuery('#bottom-feedback').css({
        'height': '50%',
        'margin-bottom': 50,
        'position': 'absolute'
      });
      jQuery('#bottom-feedback .inner').css({
        'display': 'inherit',
        'overflow-y': 'scroll'
      });

    } else {
      jQuery('#bottom-feedback').css({
        'height': 30,
        'margin-bottom': 0,
        'position': 'relative'
      });

      jQuery('#bottom-feedback .inner').css({
        'display': 'none',
        'overflow-y': 'hidden'
      });
      this.saveFeedbackform();
    }

    this.feedback_expanded = !this.feedback_expanded;
  }

  private saveFeedbackform() {
    if (!isNullOrUndefined(this.transcrService.feedback.comment)
      && this.transcrService.feedback.comment !== '') {
      this.transcrService.feedback.comment = this.transcrService.feedback.comment.replace(/(<)|(\/>)|(>)/g, '\s');
    }
    this.appStorage.comment = this.transcrService.feedback.comment;

    for (const control in this.feedback_data) {
      if (this.feedback_data.hasOwnProperty(control)) {
        this.changeValue(control, this.feedback_data[control]);
      }
    }
    this.appStorage.save('feedback', this.transcrService.feedback.exportData());
  }

  changeValue(control: string, value: any) {
    const result = this.transcrService.feedback.setValueForControl(control, value.toString());
    console.warn(result);
  }

  translate(languages: any, lang: string): string {
    if (isNullOrUndefined(languages[lang])) {
      for (const attr in languages) {
        // take first
        if (languages.hasOwnProperty(attr)) {
          return languages[attr];
        }
      }
    }
    return languages[lang];
  }

  private loadForm() {
    // create emty attribute
    const feedback = this.transcrService.feedback;
    if (!isNullOrUndefined(this.settingsService.projectsettings)
      && !isNullOrUndefined(feedback)
    ) {
      for (const g in feedback.groups) {
        if (!isNullOrUndefined(g)) {
          const group = feedback.groups[g];
          for (const c in group.controls) {
            if (!isNullOrUndefined(c)) {
              const control = group.controls[c];
              if (control.type.type === 'textarea') {
                this.feedback_data[group.name] = control.value;
              } else {
                // radio skip checkboxes
                if (control.type.type !== 'checkbox' && !isNullOrUndefined(control.custom)
                  && !isNullOrUndefined(control.custom.checked)
                  && control.custom.checked) {
                  this.feedback_data[group.name] = control.value;
                }
              }
            }
          }
        }
      }
    }
  }

  public onSendNowClick() {
    this.modal.dismiss();
    this.modal2.open();
    this.send_ok = true;

    const json: any = this.transcrService.exportDataToJSON();

    this.subscrmanager.add(this.api.saveSession(json.transcript, json.project, json.annotator,
      json.jobno, json.id, json.status, json.comment, json.quality, json.log)
      .catch(this.onSendError)
      .subscribe((result) => {
          if (result !== null) {
            this.appStorage.submitted = true;

            setTimeout(() => {
              this.modal2.close();

              setTimeout(() => {
                this.nextTranscription();
              }, 1000);
            }, 2000);
          } else {
            this.send_error = this.langService.instant('send error');
          }
        },
        (error) => {
          console.error(error);
        }
      ));
  }

  onSendError = (error) => {
    this.send_error = error.message;
    return Observable.throw(error);
  };

  onSendButtonClick() {

    if (this.feedback_form.valid) {
      this.saveFeedbackform();
      this.modal.open();
    } else if (!this.feedback_expanded) {
      this.expandFeedback();
    }
  }

  nextTranscription() {
    this.transcrService.endTranscription(false);
    this.clearData();
    this.subscrmanager.add(this.api.beginSession(this.appStorage.user.project, this.appStorage.user.id,
      Number(this.appStorage.user.jobno), '')
      .subscribe((json) => {
        if (json !== null) {
          if (json.data && json.data.hasOwnProperty('url') && json.data.hasOwnProperty('id')) {
            this.appStorage.audio_url = json.data.url;
            this.appStorage.data_id = json.data.id;

            // get transcript data that already exists
            if (json.data.hasOwnProperty('transcript')) {
              const transcript = JSON.parse(json.data.transcript);

              if (isArray(transcript) && transcript.length > 0) {
                this.appStorage.servertranscipt = transcript;
              }
            }

            if (json.hasOwnProperty('message') && isNumber(json.message)) {
              this.appStorage.jobs_left = Number(json.message);
            }

            this.router.navigate(['/user/load'], {
              queryParamsHandling: 'preserve'
            });
          } else {
            this.appStorage.submitted = true;
            this.router.navigate(['/user/transcr/end'], {
              queryParamsHandling: 'preserve'
            });
          }
        }
      }));
  }

  clearData() {
    this.appStorage.submitted = false;
    this.appStorage.clearAnnotationData().catch((err) => {
      console.error(err);
    });
    this.appStorage.idb.save('options', 'feedback', {value: null});
    this.appStorage.comment = '';
    this.appStorage.clearLoggingData().catch((err) => {
      console.error(err);
    });
    this.uiService.elements = [];
    this.settingsService.clearSettings();
  }

  public checkBoxChanged(group: string, checkb: string) {
    for (let i = 0; i < this.transcrService.feedback.groups.length; i++) {
      const group_ = this.transcrService.feedback.groups[i];
      if (group_.name === group) {
        for (let j = 0; j < group_.controls.length; j++) {
          const control = group_.controls[j];
          if (control.value === checkb) {
            control.custom['checked'] = (isNullOrUndefined(control.custom['checked'])) ? true : !control.custom['checked'];
            break;
          }
        }
        break;
      }
    }
  }

  public onSaveTranscriptionButtonClicked() {
    const converter = new PartiturConverter();
    const oannotjson = this.transcrService.annotation.getObj();
    console.log(oannotjson);
    console.log(this.transcrService.audiofile);
    const result: IFile = converter.export(oannotjson, this.transcrService.audiofile, 0).file;
    result.name = result.name.replace('-' + oannotjson.levels[0].name, '');

    // upload transcript
    const form: FormData = new FormData();
    const url = 'https://clarin.phonetik.uni-muenchen.de/BASWebServices/services/uploadFileMulti';

    form.append('file0', new File([result.content], result.name, {type: 'text/plain'}));


    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);

    xhr.upload.addEventListener('progress', (e: ProgressEvent) => {
      if (e.lengthComputable) {
        console.log(e.loaded / e.total);
      }
    }, false);

    xhr.onloadstart = (e) => {
      console.log('start');
    };

    xhr.onerror = (e) => {
      console.error(e);
      // add messages to protocol
      console.error(`${e.message}`);
    };

    xhr.onloadend = (e) => {
      console.log('loadend');
      const result = e.currentTarget['responseText'];

      console.log(result);
      const x2js = new X2JS();
      let json: any = x2js.xml2js(result);
      json = json.UploadFileMultiResponse;
      console.log(json);

      if (json.success === 'true') {
        // TODO set urls to results only
        let resulturl = '';
        if (isArray(json.fileList.entry)) {
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
}
