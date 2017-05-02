import {
  AfterContentInit,
  AfterViewChecked,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  OnChanges,
  OnDestroy,
  OnInit,
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

import {BrowserInfo, StatisticElem, SubscriptionManager} from '../../shared';
import {isNullOrUndefined} from 'util';
import {LangChangeEvent, TranslateService} from '@ngx-translate/core';
import {TranscrGuidelinesComponent} from '../transcr-guidelines/transcr-guidelines.component';
import {APIService} from '../../service/api.service';

@Component({
  selector: 'app-transcription',
  templateUrl: './transcription.component.html',
  styleUrls: ['./transcription.component.css'],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TranscriptionComponent implements OnInit, OnDestroy, AfterViewInit, AfterContentInit, OnChanges, AfterViewChecked {
  private subscrmanager: SubscriptionManager;

  @ViewChild('modal_shortcuts') modal_shortcuts: ModalComponent;
  @ViewChild('modal_guidelines') modal_guidelines: TranscrGuidelinesComponent;
  @ViewChild('modal_overview') modal_overview: ModalComponent;

  public showdetails = false;
  private saving = '';

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

  get projectsettings(): any {
    return this.settingsService.projectsettings;
  }

  get responsive(): boolean {
    return this.settingsService.responsive.enabled;
  }

  user: number;

  private platform = BrowserInfo.platform;

  constructor(public router: Router,
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

    if (!isNullOrUndefined(this.projectsettings) && !isNullOrUndefined(this.projectsettings.logging)
      && this.projectsettings.logging.forced) {
      this.subscrmanager.add(this.audio.statechange.subscribe((state) => {
        this.uiService.addElementFromEvent('audio_' + state, {value: state}, Date.now(), 'audio');
      }));
    }
  }

  get dat(): string {
    return JSON.stringify(this.transcrService.exportDataToJSON(), null, 3);
  }

  get UIElements(): StatisticElem[] {
    return this.uiService.elements;
  }

  private get app_settings() {
    return this.settingsService.app_settings;
  }

  ngOnChanges() {
  }

  ngOnInit() {
    this.navbarServ.interfaces = this.projectsettings.interfaces;
    this.afterAudioLoaded();

    setInterval(() => {
      this.changeDetecorRef.markForCheck();
    }, 2000);

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

    if (!isNullOrUndefined(this.transcrService.segments)) {
      this.subscrmanager.add(this.transcrService.segments.onsegmentchange.subscribe(this.transcrService.saveSegments));
    } else {
      this.subscrmanager.add(this.transcrService.dataloaded.subscribe(() => {
        this.subscrmanager.add(this.transcrService.segments.onsegmentchange.subscribe(this.transcrService.saveSegments));
      }));
    }
  }

  afterAudioLoaded = () => {
    this.transcrService.load();
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

    this.sessService.SampleRate = this.audio.samplerate;
    this.change();
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
  }

  ngAfterViewInit() {
    this.sessService.TranscriptionTime.start = Date.now();
    if (isNullOrUndefined(this.projectsettings.interfaces.find((x) => {
        return this.sessService.Interface === x;
      }))) {
            this.sessService.Interface = this.projectsettings.interfaces[0];
    }

    this.change();

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

  change() {
    this.changeDetecorRef.markForCheck();
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

  getText() {
    return this.transcrService.getTranscriptString('text');
  }

  clearElements() {
    this.uiService.clear();
    this.sessService.save('logs', this.uiService.elementsToAnyArray());
  }

  onSegmentInOverviewClicked(segnumber: number) {
    this.transcrService.requestSegment(segnumber);
    this.modal_overview.close();
  }
}
