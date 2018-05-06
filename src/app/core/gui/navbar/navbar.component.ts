import {AfterViewInit, Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {AppStorageService} from '../../shared/service/appstorage.service';
import {BsModalComponent} from 'ng2-bs3-modal';
import {NavbarService} from './navbar.service';
import {DomSanitizer, SafeUrl} from '@angular/platform-browser';
import {TranslateService} from '@ngx-translate/core';
import {isNullOrUndefined} from 'util';
import {Converter, IFile} from '../../obj/Converters/Converter';
import {AppInfo} from '../../../app.info';
import {TextConverter} from '../../obj/Converters/TextConverter';
import {TranscriptionService} from '../../shared/service/transcription.service';
import {UserInteractionsService} from '../../shared/service/userInteractions.service';
import {StatisticElem} from '../../obj/statistics/StatisticElement';
import {SettingsService} from '../../shared/service/settings.service';
import {SubscriptionManager} from '../../obj/SubscriptionManager';
import {EditorComponents} from '../../../editors/components';
import {Level} from '../../obj/Annotation/Level';
import {Segments} from '../../obj/Annotation/Segments';
import {OCTRANIMATIONS} from '../../shared/OCTRAnimations';
import {AnnotJSONType} from '../../obj/Annotation/AnnotJSON';
import {BugReportService, ConsoleType} from '../../shared/service/bug-report.service';
import {environment} from '../../../../environments/environment';
import {ModalService} from '../../modals/modal.service';

@Component({
  selector: 'app-navigation',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  animations: OCTRANIMATIONS
})

export class NavigationComponent implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild('modalexport') modalexport: BsModalComponent;
  @Input('version') version: string;

  public test = 'ok';
  public parentformat: {
    download: string,
    uri: SafeUrl
  } = {
    download: '',
    uri: ''
  };
  collapsed = true;

  public preparing = {
    name: '',
    preparing: false
  };

  public get environment(): any {
    return environment;
  }

  public export_states = [];
  private subscrmanager: SubscriptionManager = new SubscriptionManager();

  public get converters(): any[] {
    return AppInfo.converters;
  }

  public get AppInfo(): any {
    return AppInfo;
  }

  public get transcrServ(): TranscriptionService {
    return this.navbarServ.transcrService;
  }

  public get uiService(): UserInteractionsService {
    return this.navbarServ.uiService;
  }

  public get editors() {
    return EditorComponents;
  }

  get dat(): string {
    return JSON.stringify(this.transcrServ.exportDataToJSON(), null, 3);
  }

  get UIElements(): StatisticElem[] {
    return (!isNullOrUndefined(this.uiService)) ? this.uiService.elements : null;
  }

  get AnnotJSONType() {
    return AnnotJSONType;
  }

  constructor(public appStorage: AppStorageService,
              public navbarServ: NavbarService,
              public sanitizer: DomSanitizer,
              public langService: TranslateService,
              public modService: ModalService,
              public settService: SettingsService,
              public bugService: BugReportService) {
  }

  ngOnDestroy() {
    this.subscrmanager.destroy();
  }

  ngOnInit() {
    this.subscrmanager.add(
      this.navbarServ.onclick.subscribe((name) => {
        switch (name) {
          case('export'):
            this.modalexport.open();
            break;
        }
      })
    );
    for (let i = 0; i < AppInfo.converters.length; i++) {
      this.export_states.push('inactive');
    }
  }

  ngAfterViewInit() {
    jQuery(document).on('click', '.options-menu', function (e) {
      e.stopPropagation();
    });

    jQuery('body').bootstrapMaterialDesign();
  }

  setInterface(new_interface: string) {
    this.appStorage.Interface = new_interface;
    this.navbarServ.interfacechange.emit(new_interface);
  }

  onNavBarLeave($event) {
    $event.target.click();
  }

  getTextFile() {
    const txt = '';
    /*
     let data = this.tranServ.exportDataToJSON();

     let tc:TextConverter = new TextConverter();
     txt = tc.convert(data);

     alert(txt);*/
  }

  onLineClick(converter: Converter, index: number) {
    if (converter.multitiers) {
      this.updateParentFormat(converter);
    }
    this.toggleLine(index);
  }

  sanitize(url: string): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }

  changeLanguage(lang: string) {
    this.langService.use(lang);
    this.appStorage.language = lang;
  }

  public interfaceActive(name: string) {
    return !(isNullOrUndefined(
      this.navbarServ.interfaces.find((x) => {
        return name === x;
      })
    ));
  }

  toggleSettings(option: string) {
    this.appStorage[option] = !this.appStorage[option];
    if (option === 'logging') {
      this.uiService.enabled = this.appStorage[option];
    }
  }

  onOptionsOpened() {
    this.collapsed = true;
  }

  openBugReport() {
    this.modService.show('bugreport').then((action) => {
      console.log(action);
    }).catch((err) => {
      console.error(err);
    });
  }

  onSelectionChange(converter: Converter, value: any) {
    if (value !== '') {
      this.updateParentFormat(converter, value);
    }
  }

  updateParentFormat(converter: Converter, levelnum?: number) {
    if (!this.preparing.preparing) {
      const oannotjson = this.navbarServ.transcrService.annotation.getObj();
      this.preparing = {
        name: converter.name,
        preparing: true
      };
      setTimeout(() => {
        if (converter.name === 'Bundle') {
          // only this converter needs an array buffer
          this.navbarServ.transcrService.audiofile.arraybuffer = this.transcrServ.audiomanager.ressource.arraybuffer;
        }

        const result: IFile = converter.export(oannotjson, this.navbarServ.transcrService.audiofile, levelnum).file;
        this.parentformat.download = result.name;

        window.URL = (((<any> window).URL) ||
          ((<any> window).webkitURL) || false);

        if (this.parentformat.uri !== null) {
          window.URL.revokeObjectURL(this.parentformat.uri.toString());
        }
        const test = new File([result.content], result.name);
        const urlobj = window.URL.createObjectURL(test);
        this.parentformat.uri = this.sanitize(urlobj);
        this.preparing = {
          name: converter.name,
          preparing: false
        };
      }, 300);
    }
  }

  toggleLine(index: number) {
    for (let i = 0; i < this.export_states.length; i++) {
      if (this.export_states[i] === 'active') {
        this.export_states[i] = 'close';
      }
    }

    if (index < this.export_states.length) {
      if (this.export_states[index] === 'active') {
        this.export_states[index] = 'inactive';
      } else {
        this.export_states[index] = 'active';
      }
    }
  }

  getAudioURI() {
    if (!isNullOrUndefined(this.transcrServ) && !isNullOrUndefined(this.transcrServ.audiomanager.ressource.arraybuffer)) {
      this.preparing = {
        name: 'Audio',
        preparing: true
      };
      this.parentformat.download = this.transcrServ.audiomanager.ressource.name + this.transcrServ.audiomanager.ressource.extension;

      window.URL = (((<any> window).URL) ||
        ((<any> window).webkitURL) || false);

      if (this.parentformat.uri !== null) {
        window.URL.revokeObjectURL(this.parentformat.uri.toString());
      }
      const test = new File([this.transcrServ.audiomanager.ressource.arraybuffer], this.parentformat.download);
      const urlobj = window.URL.createObjectURL(test);
      this.parentformat.uri = this.sanitize(urlobj);
      this.preparing = {
        name: 'Audio',
        preparing: false
      };
    } else {
      console.error('can\'t get audio file');
    }
  }

  getProtocol() {
    if (!isNullOrUndefined(this.transcrServ)) {
      this.preparing = {
        name: 'Protocol',
        preparing: true
      };
      this.parentformat.download = this.transcrServ.audiofile.name + '.json';

      window.URL = (((<any> window).URL) ||
        ((<any> window).webkitURL) || false);

      if (this.parentformat.uri !== null) {
        window.URL.revokeObjectURL(this.parentformat.uri.toString());
      }
      const json = new File([JSON.stringify(this.transcrServ.extractUI(this.uiService.elements), null, 2)], this.parentformat.download);
      const urlobj = window.URL.createObjectURL(json);
      this.parentformat.uri = this.sanitize(urlobj);
      this.preparing = {
        name: 'Protocol',
        preparing: false
      };
    } else {
      console.error('can\'t get protocol file');
    }
  }

  public get arraybufferExists(): boolean {
    return (!isNullOrUndefined(this.transcrServ) && !isNullOrUndefined(this.transcrServ.audiomanager.ressource.arraybuffer)
      && this.transcrServ.audiomanager.ressource.arraybuffer.byteLength > 0);
  }

  getText() {
    if (!isNullOrUndefined(this.transcrServ)) {
      return this.navbarServ.transcrService.getTranscriptString(new TextConverter());
    }

    return '';
  }

  clearElements() {
    this.uiService.clear();
    this.appStorage.clearLoggingData().catch((err) => {
      console.error(err);
    });
  }

  onLevelNameClick(event) {
    jQuery(event.target).addClass('selected');
  }

  onLevelNameLeave(event, tiernum: number) {
    jQuery(event.target).removeClass('selected');
    // save level name
    if (event.target.value !== null && event.target.value !== '') {
      const level = this.transcrServ.annotation.levels[tiernum];
      level.name = event.target.value.replace(' ', '_');
      this.appStorage.changeAnnotationLevel(tiernum, level.getObj()).catch((err) => {
        console.error(err);
      }).then(() => {
        // update value for annoation object in transcr service
        this.transcrServ.annotation.levels[tiernum].name = event.target.value.replace(' ', '_');
      });
    } else {
      event.target.value = this.transcrServ.annotation.levels[tiernum].name;
    }
  }

  onLevelAddClick() {
    const level_nums = this.transcrServ.annotation.levels.length;
    let levelname = `Tier_${level_nums + 1}`;
    let index = level_nums;

    const nameexists = (newname: string) => {
      for (let i = 0; i < this.transcrServ.annotation.levels.length; i++) {
        const level = this.transcrServ.annotation.levels[i];
        if (level.name === newname) {
          return true;
        }
      }
      return false;
    };

    while (nameexists(levelname)) {
      index++;
      levelname = `Tier_${index + 1}`;
    }

    const newlevel = new Level(this.appStorage.levelcounter + 1, levelname, 'SEGMENT',
      new Segments(this.transcrServ.audiofile.samplerate, [], this.transcrServ.last_sample));
    this.appStorage.addAnnotationLevel(newlevel.getObj()).then(
      () => {
        // update value for annoation object in transc servcie
        this.transcrServ.annotation.levels.push(newlevel);
      }
    ).catch((err) => {
      console.error(err);
    });
  }

  onLevelRemoveClick(tiernum: number, id: number) {
    this.modService.show('yesno', 'The Tier will be deleted permanently. Are you sure?').then((answer) => {
      if (answer === 'yes') {
        if (this.transcrServ.annotation.levels.length > 1) {
          this.appStorage.removeAnnotationLevel(tiernum, id).catch((err) => {
            console.error(err);
          }).then(() => {
            // update value for annoation object in transcr service
            this.transcrServ.annotation.levels.splice(tiernum, 1);
            if (tiernum <= this.transcrServ.selectedlevel) {
              this.transcrServ.selectedlevel = tiernum - 1;
            }
          });
        }
        this.collapsed = false;
      } else {
        this.collapsed = false;
      }
    }).catch((error) => {
      console.error(error);
    });
  }

  onLevelDuplicateClick(tiernum: number, id: number) {
    const newlevel = this.transcrServ.annotation.levels[tiernum].clone();
    this.appStorage.addAnnotationLevel(newlevel.getObj()).then(
      () => {
        // update value for annoation object in transc servcie
        this.transcrServ.annotation.levels.push(newlevel);
      }
    ).catch((err) => {
      console.error(err);
    });
  }

  public selectLevel(tiernum: number) {
    this.transcrServ.selectedlevel = tiernum;
  }

  public get errorsFound(): boolean {
    return (this.bugService.console.filter((a) => {
      if (a.type === ConsoleType.ERROR) {
        return true;
      }
    }).length > 0);
  }
}
