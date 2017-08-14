import {AfterViewInit, Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {AppStorageService} from '../../shared/service/appstorage.service';
import {ModalComponent} from 'ng2-bs3-modal/components/modal';
import {NavbarService} from './navbar.service';
import {DomSanitizer, SafeUrl} from '@angular/platform-browser';
import {TranslateService} from '@ngx-translate/core';
import {isNullOrUndefined} from 'util';
import {ModalService} from '../../shared/service/modal.service';
import {Converter, File} from '../../obj/Converters/Converter';
import {AppInfo} from '../../../app.info';
import {TextConverter} from '../../obj/Converters/TextConverter';
import {TranscriptionService} from '../../shared/service/transcription.service';
import {UserInteractionsService} from '../../shared/service/userInteractions.service';
import {StatisticElem} from '../../obj/StatisticElement';
import {SettingsService} from '../../shared/service/settings.service';
import {SubscriptionManager} from '../../obj/SubscriptionManager';
import {EditorComponents} from '../../../editors/components';
import {Level} from '../../obj/Annotation/Level';
import {Segments} from '../../obj/Annotation/Segments';

@Component({
  selector: 'app-navigation',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})

export class NavigationComponent implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild('modalexport') modalexport: ModalComponent;
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

  constructor(public sessService: AppStorageService,
              public navbarServ: NavbarService,
              public sanitizer: DomSanitizer,
              public langService: TranslateService,
              public modService: ModalService,
              public settService: SettingsService) {
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
  }

  ngAfterViewInit() {
    (($) => {
      $(() => {
        $(document).on('click', '.options-menu', function (e) {
          e.stopPropagation();
        });
      });
    })(jQuery);

    jQuery(document).on('mouseleave', '.navbar-collapse.collapse.in', function (e) {
      jQuery('.navbar-header button').click();
    });
    setTimeout(() => {
      jQuery.material.init();
    }, 200);
  }

  setInterface(new_interface: string) {
    this.sessService.Interface = new_interface;
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

  getURI(file: File): string {
    return 'data:' + file.type + ';charset:' + file.encoding + ',' + encodeURIComponent(file.content);
  }

  sanitize(url: string): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }

  changeLanguage(lang: string) {
    this.langService.use(lang);
    this.sessService.language = lang;
  }

  public interfaceActive(name: string) {
    return !(isNullOrUndefined(
      this.navbarServ.interfaces.find((x) => {
        return name === x;
      })
    ));
  }

  toggleSettings(option: string) {
    this.sessService[option] = !this.sessService[option];
  }

  onOptionsOpened() {
    this.collapsed = true;
  }

  openBugReport() {
    this.modService.show('bugreport');
  }

  updateParentFormat(converter: Converter) {
    const oannotjson = this.navbarServ.transcrService.annotation.getObj();
    const result: File = converter.export(oannotjson, this.navbarServ.transcrService.audiofile);
    this.parentformat.download = result.name;
    this.parentformat.uri = this.sanitize(this.getURI(result));
  }

  getText() {
    if (!isNullOrUndefined(this.transcrServ)) {
      return this.navbarServ.transcrService.getTranscriptString(new TextConverter());
    }

    return '';
  }

  clearElements() {
    this.uiService.clear();
    this.sessService.clearLoggingData().catch((err) => {
      console.error(err);
    });
  }

  onLevelNameClick(event) {
    jQuery(event.target).addClass('selected');
  }

  onLevelNameLeave(event, tiernum: number) {
    jQuery(event.target).removeClass('selected');
    // save level name
    const level = this.transcrServ.annotation.levels[tiernum].getObj();
    level.name = event.target.value;
    console.log(level.name);
    this.sessService.changeAnnotationLevel(tiernum, level).catch((err) => {
      console.error(err);
    }).then(() => {
      console.log('SAVED OK');
      // update value for annoation object in transcr service
      this.transcrServ.annotation.levels[tiernum].name = event.target.value;
    });
  }

  onLevelAddClick() {
    const level_nums = this.transcrServ.annotation.levels.length;
    let levelname = `Tier ${level_nums + 1}`;
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
      levelname = `Tier ${index + 1}`
    }

    const newlevel = new Level(levelname, new Segments(this.transcrServ.audiofile.samplerate, [], this.transcrServ.last_sample));
    this.sessService.addAnnotationLevel(newlevel.getObj());
    // update value for annoation object in transc servcie
    this.transcrServ.annotation.levels.push(newlevel);
  }

  onLevelRemoveClick(tiernum) {
    if (this.transcrServ.annotation.levels.length > 1) {
      this.sessService.removeAnnotationLevel(tiernum, this.transcrServ.annotation.levels[tiernum].name).catch((err) => {
        console.error(err);
      }).then(() => {
        console.log('REMOVED OK');
        // update value for annoation object in transcr service
        this.transcrServ.annotation.levels.splice(tiernum, 1);
      });
    }
  }
}
