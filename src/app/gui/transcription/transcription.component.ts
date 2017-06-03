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
} from '../../service';

import {BrowserInfo, SubscriptionManager} from '../../shared';
import {isNullOrUndefined} from 'util';
import {LangChangeEvent, TranslateService} from '@ngx-translate/core';
import {TranscrGuidelinesComponent} from '../transcr-guidelines/transcr-guidelines.component';
import {APIService} from '../../service/api.service';
import {LoadeditorDirective} from '../../directive/loadeditor.directive';
import {AudioplayerGUIComponent} from '../audioplayer-gui/audioplayer-gui.component';
import {OverlayGUIComponent} from '../overlay-gui/overlay-gui.component';
import {SignalGUIComponent} from '../signal-gui/signal-gui.component';
import {Entry} from '../../service/keymapping.service';
import {Observable} from 'rxjs/Observable';
import {ProjectConfiguration} from '../../types/Settings/project-configuration';

@Component({
  selector: 'app-transcription',
  templateUrl: './transcription.component.html',
  styleUrls: ['./transcription.component.css'],
  providers: [MessageService]
})
export class TranscriptionComponent implements OnInit,
  OnDestroy, AfterViewInit, AfterContentInit, OnChanges, AfterViewChecked, AfterContentChecked {
  private subscrmanager: SubscriptionManager;

  @ViewChild('modal_shortcuts') modal_shortcuts: ModalComponent;
  @ViewChild('modal_guidelines') modal_guidelines: TranscrGuidelinesComponent;
  @ViewChild('modal_overview') modal_overview: ModalComponent;
  @ViewChild(LoadeditorDirective) appLoadeditor: LoadeditorDirective;

  @ViewChild('modal') modal: ModalComponent;
  @ViewChild('modal2') modal2: ModalComponent;
  public send_error = '';

  public showdetails = false;
  private saving = '';
  public interface = '';
  private send_ok = false;
  public shortcutslist: Entry[] = [];
  public editorloaded = false;
  public feedback_data = {};

  get help_url(): string {
    if (this.sessService.Interface === 'Editor without signal display') {
      return 'http:// www.phonetik.uni-muenchen.de/apps/octra/videos/63sd324g43qt7-interface1/';
    } else if (this.sessService.Interface === 'Linear Editor') {
      return 'http://www.phonetik.uni-muenchen.de/apps/octra/videos/6at766dsf8ui34-interface2/';
    } else if (this.sessService.Interface === '2D-Editor') {
      return 'http://www.phonetik.uni-muenchen.de/apps/octra/videos/6at766dsf8ui34-interface3/';
    }

    return '';
  }

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

  private platform = BrowserInfo.platform;

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

    this.navbarServ.transcrService = this.transcrService;
    this.navbarServ.uiService = this.uiService;
    if (!isNullOrUndefined(this.projectsettings) && !isNullOrUndefined(this.projectsettings.logging)
      && this.projectsettings.logging.forced) {
      this.subscrmanager.add(this.audio.statechange.subscribe((obj) => {
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
    console.log(this.sessService.servertranscipt);
    this.transcrService.load();

    this.loadForm();

    if (isNullOrUndefined(this.sessService.feedback)) {
      console.error('feedback is null!');
    } else {
      console.log('get feedback');
      console.log(this.sessService.feedback);
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

    this.sessService.annotation.sampleRate = this.audio.samplerate;
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

        this.subscrmanager.add(
          this.settingsService.loadGuidelines(event.lang, './project/guidelines/guidelines_' + lang + '.json')
        );
      }
    ));


    this.subscrmanager.add(this.navbarServ.interfacechange.subscribe(
      (editor) => {
        if (this.projectsettings.logging.forced) {
          this.uiService.addElementFromEvent('editor_changed', {value: editor}, Date.now(), '');
        }
        this.changeEditor(editor);
      }
    ));
  }

  ngAfterViewInit() {
    this.changeEditor(this.interface);

    this.sessService.TranscriptionTime.start = Date.now();
    if (isNullOrUndefined(this.projectsettings.interfaces.find((x) => {
        return this.sessService.Interface === x;
      }))) {
      this.sessService.Interface = this.projectsettings.interfaces[0];
    }

    jQuery.material.init();
  }

  abortTranscription = () => {
    this.transcrService.endTranscription();
    this.router.navigate(['/logout']);
  }

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
    let comp: any = null;
    switch (name) {
      case('2D-Editor'):
        comp = OverlayGUIComponent;
        this.interface = name;
        break;
      case('Editor without signal display'):
        comp = AudioplayerGUIComponent;
        this.interface = name;
        break;
      case('Linear Editor'):
        comp = SignalGUIComponent;
        this.interface = name;
        break;
    }

    if (!isNullOrUndefined(comp)) {

      this.editorloaded = false;
      const id = this.subscrmanager.add(comp.initialized.subscribe(
        () => {
          setTimeout(() => {
            console.log('component initialized');
            this.editorloaded = true;
            this.subscrmanager.remove(id);
          }, 100);
        }
      ));
      const componentFactory = this._componentFactoryResolver.resolveComponentFactory(comp);
      const viewContainerRef = this.appLoadeditor.viewContainerRef;
      viewContainerRef.clear();

      const componentRef = viewContainerRef.createComponent(componentFactory);
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
        'display': 'inherit'
      });

    } else {
      jQuery('#bottom-feedback').css({
        'height': 30,
        'margin-bottom': 0,
        'position': 'relative'
      });

      jQuery('#bottom-feedback .inner').css({
        'display': 'none'
      });
      this.saveForm();
    }
  }

  private saveForm() {
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
    console.log('saveForm');
    this.sessService.save('feedback', this.transcrService.feedback.exportData());
    console.log(this.sessService.feedback);
  }

  changeValue(control: string, value: any) {
    const result = this.transcrService.feedback.setValueForControl(control, value.toString());
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
          for (const c in feedback.groups[g].controls) {
            if (!isNullOrUndefined(c)) {
              const control = feedback.groups[g].controls[c];
              if (control.type.type === 'textarea') {
                this.feedback_data[control.name] = control.value;
              } else {
                // radio or checkbox
                if (!isNullOrUndefined(control.custom)
                  && !isNullOrUndefined(control.custom.checked)
                  && control.custom.checked) {
                  this.feedback_data[control.name] = control.value;
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
            this.modal2.close();
            setTimeout(() => {
              this.router.navigate(['/user/transcr/submitted']);
            }, 1000);
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
}
