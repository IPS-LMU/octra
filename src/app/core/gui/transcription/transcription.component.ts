import {
  AfterContentChecked,
  AfterContentInit,
  AfterViewChecked,
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ComponentFactoryResolver,
  HostListener,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {Router} from '@angular/router';
import {ModalComponent} from 'ng2-bs3-modal/ng2-bs3-modal';

import {
  AudioService,
  KeymappingService,
  MessageService,
  ModalService,
  NavbarService,
  SessionService,
  SettingsService,
  TranscriptionService,
  UserInteractionsService
} from '../../shared/service';

import {BrowserInfo, SubscriptionManager} from '../../shared';
import {isArray, isNullOrUndefined, isNumber} from 'util';
import {LangChangeEvent, TranslateService} from '@ngx-translate/core';
import {TranscrGuidelinesComponent} from '../transcr-guidelines/transcr-guidelines.component';
import {APIService} from '../../shared/service/api.service';
import {LoadeditorDirective} from '../../shared/directive/loadeditor.directive';
import {Entry} from '../../shared/service/keymapping.service';
import {Observable} from 'rxjs/Observable';
import {ProjectConfiguration} from '../../obj/Settings/project-configuration';
import {NgForm} from '@angular/forms';
import {AudioManager} from '../../obj/media/audio/AudioManager';
import {EditorComponents} from '../../../editors/components';

@Component({
  selector: 'app-transcription',
  templateUrl: './transcription.component.html',
  styleUrls: ['./transcription.component.css'],
  providers: [MessageService]
})
export class TranscriptionComponent implements OnInit,
  OnDestroy, AfterViewInit, AfterContentInit, OnChanges, AfterViewChecked, AfterContentChecked, AfterContentInit {
  private subscrmanager: SubscriptionManager;

  @ViewChild('modal_shortcuts') modal_shortcuts: ModalComponent;
  @ViewChild('modal_guidelines') modal_guidelines: TranscrGuidelinesComponent;
  @ViewChild('modal_overview') modal_overview: ModalComponent;
  @ViewChild(LoadeditorDirective) appLoadeditor: LoadeditorDirective;

  @ViewChild('modal') modal: ModalComponent;
  @ViewChild('modal2') modal2: ModalComponent;
  @ViewChild('fo') feedback_form: NgForm;
  public send_error = '';

  public showdetails = false;
  public saving = '';
  public interface = '';
  private send_ok = false;
  public shortcutslist: Entry[] = [];
  public editorloaded = false;
  public feedback_data = {};

  public feedback_expanded = false;

  get loaded(): boolean {
    return (this.audio.loaded && !isNullOrUndefined(this.transcrService.guidelines));
  }

  get appc(): any {
    return this.settingsService.app_settings;
  }

  get projectsettings(): ProjectConfiguration {
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
              public sessService: SessionService,
              public keyMap: KeymappingService,
              public changeDetecorRef: ChangeDetectorRef,
              public navbarServ: NavbarService,
              public settingsService: SettingsService,
              public modService: ModalService,
              public langService: TranslateService,
              private api: APIService) {
    this.subscrmanager = new SubscriptionManager();
    this.audiomanager = this.audio.audiomanagers[0];

    this.navbarServ.transcrService = this.transcrService;
    this.navbarServ.uiService = this.uiService;
    if (!isNullOrUndefined(this.projectsettings) && !isNullOrUndefined(this.projectsettings.logging)
      && this.projectsettings.logging.forced) {
      this.subscrmanager.add(this.audiomanager.statechange.subscribe((obj) => {
        if (!obj.playonhover) {
          // make sure that events from playonhover are not logged
          this.uiService.addElementFromEvent('audio_' + obj.state, {value: obj.state}, Date.now(), 'audio');
        }
      }));
    }
    this.interface = this.sessService.Interface;

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
    this.afterAudioLoaded();

    this.subscrmanager.add(this.sessService.saving.subscribe(
      (saving) => {
        if (saving) {
          this.saving = 'Saving...';
        } else {
          setTimeout(() => {
            this.saving = '';
          }, 1000);
        }
      }
    ));

    this.navbarServ.show_export = this.settingsService.projectsettings.navigation.export;

    if (this.projectsettings.logging.forced === true) {
      this.subscrmanager.add(
        this.uiService.afteradd.subscribe((elem) => {
          this.sessService.save('logs', this.uiService.elementsToAnyArray());
        }));
    }

    if (!isNullOrUndefined(this.transcrService.annotation.levels[0].segments)) {
      this.subscrmanager.add(this.transcrService.annotation.levels[0].segments.onsegmentchange.subscribe(this.transcrService.saveSegments));
    } else {
      this.subscrmanager.add(this.transcrService.dataloaded.subscribe(() => {
        this.subscrmanager.add(
          this.transcrService.annotation.levels[0].segments.onsegmentchange.subscribe(this.transcrService.saveSegments)
        );
      }));
    }
  }

  afterAudioLoaded = () => {
    this.transcrService.load();

    this.loadForm();

    if (isNullOrUndefined(this.sessService.feedback)) {
      console.error('feedback is null!');
    } else {
    }

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

    this.sessService.annotation.sampleRate = this.audiomanager.ressource.info.samplerate;
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

  };

  ngAfterViewInit() {
    this.sessService.TranscriptionTime.start = Date.now();
    if (isNullOrUndefined(this.projectsettings.interfaces.find((x) => {
        return this.sessService.Interface === x;
      }))) {
      this.sessService.Interface = this.projectsettings.interfaces[0];
    }

    jQuery.material.init();

    this.changeEditor(this.interface);
    this.changeDetecorRef.detectChanges();
  }

  abortTranscription = () => {
    if (!this.sessService.offline) {
      this.saveFeedbackform();
    }
    this.transcrService.endTranscription();
    this.router.navigate(['/logout']);
  };

  ngAfterContentInit() {
  }

  ngAfterViewChecked() {
  }

  submitTranscription() {
    this.sessService.TranscriptionTime.end = Date.now();
    this.router.navigate(['/user/transcr/submit']);
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
    if (this.projectsettings.logging.forced) {
      this.uiService.addElementFromEvent('editor_changed', {value: name}, Date.now(), '');
    }

    let comp: any = null;

    for (let i = 0; i < EditorComponents.length; i++) {
      if (name === EditorComponents[i].name) {
        this.sessService.Interface = name;
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

        viewContainerRef.createComponent(componentFactory);
      } else {
        console.error('ERROR appLoadeditor is null');
      }
    } else {
      console.error('ERROR comp is null');
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
    this.sessService.comment = this.transcrService.feedback.comment;

    for (const control in this.feedback_data) {
      if (this.feedback_data.hasOwnProperty(control)) {
        this.changeValue(control, this.feedback_data[control]);
      }
    }
    this.sessService.save('feedback', this.transcrService.feedback.exportData());
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
          if (result !== null && result.hasOwnProperty('statusText') && result.statusText === 'OK') {
            this.sessService.submitted = true;

            setTimeout(() => {
              this.modal2.close();

              setTimeout(() => {
                this.nextTranscription();
              }, 1000);
            }, 2000);
          } else {
            this.send_error = this.langService.instant('send error');
          }
        }
      ));
  }

  onSendError = (error) => {
    this.send_error = error.message;
    return Observable.throw(error);
  }

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
    this.subscrmanager.add(this.api.beginSession(this.sessService.member_project, this.sessService.member_id,
      Number(this.sessService.member_jobno), '')
      .subscribe((result) => {
        if (result !== null) {
          const json = result.json();

          if (json.data && json.data.hasOwnProperty('url') && json.data.hasOwnProperty('id')) {
            this.sessService.audio_url = json.data.url;
            this.sessService.data_id = json.data.id;

            // get transcript data that already exists
            if (json.data.hasOwnProperty('transcript')) {
              const transcript = JSON.parse(json.data.transcript);

              if (isArray(transcript) && transcript.length > 0) {
                this.sessService.servertranscipt = transcript;
              }
            }

            if (json.hasOwnProperty('message') && isNumber(json.message)) {
              this.sessService.jobs_left = Number(json.message);
            }

            this.router.navigate(['/user/load']);
          } else {
            this.sessService.submitted = true;
            this.router.navigate(['/user/transcr/end']);
          }
        }
      }));
  }

  clearData() {
    this.sessService.submitted = false;
    this.sessService.annotation = null;
    this.sessService.feedback = null;
    this.sessService.comment = '';
    this.sessService.logs = [];
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
}
