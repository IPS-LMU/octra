import {AfterViewInit, Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {AppStorageService} from '../../shared/service/appstorage.service';
import {NavbarService} from './navbar.service';
import {DomSanitizer} from '@angular/platform-browser';
import {TranslateService} from '@ngx-translate/core';
import {AppInfo} from '../../../app.info';
import {TranscriptionService} from '../../shared/service/transcription.service';
import {UserInteractionsService} from '../../shared/service/userInteractions.service';
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
import {ExportFilesModalComponent} from '../../modals/export-files-modal/export-files-modal.component';
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'app-navigation',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  animations: OCTRANIMATIONS
})

export class NavigationComponent implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild('modalexport') modalexport: ExportFilesModalComponent;
  @Input() version: string;

  public test = 'ok';
  collapsed = true;
  private subscrmanager: SubscriptionManager = new SubscriptionManager();

  public get environment(): any {
    return environment;
  }

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

  get AnnotJSONType() {
    return AnnotJSONType;
  }

  public get errorsFound(): boolean {
    return (this.bugService.console.filter((a) => {
      if (a.type === ConsoleType.ERROR) {
        return true;
      }
    }).length > 0);
  }

  constructor(public appStorage: AppStorageService,
              public navbarServ: NavbarService,
              public sanitizer: DomSanitizer,
              public langService: TranslateService,
              public modService: ModalService,
              public settService: SettingsService,
              public bugService: BugReportService,
              private route: ActivatedRoute) {
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

  changeLanguage(lang: string) {
    this.langService.use(lang);
    this.appStorage.language = lang;
  }

  public interfaceActive(name: string) {
    const found = this.navbarServ.interfaces.find((x) => {
      return name === x;
    });
    return !(found === null || found === undefined);
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

  public openBugReport() {
    this.modService.show('bugreport').then((action) => {
      window.location.hash = '';
    }).catch((err) => {
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
      this.appStorage.changeAnnotationLevel(tiernum,
        level.getObj(this.transcrServ.audiomanager.sampleRateFactor, this.transcrServ.audiomanager.originalInfo.duration.samples))
        .catch((err) => {
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
    let levelname = `OCTRA_${level_nums + 1}`;
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
      levelname = `OCTRA_${index + 1}`;
    }

    const newlevel = new Level(this.appStorage.levelcounter + 1, levelname, 'SEGMENT',
      new Segments(this.transcrServ.audiofile.samplerate, [], this.transcrServ.last_sample, this.transcrServ.audiomanager.sampleRateFactor));
    this.appStorage.addAnnotationLevel(
      newlevel.getObj(this.transcrServ.audiomanager.sampleRateFactor, this.transcrServ.audiomanager.originalInfo.duration.samples))
      .then(
        () => {
          // update value for annoation object in transc servcie
          this.transcrServ.annotation.levels.push(newlevel);
        }
      ).catch((err) => {
      console.error(err);
    });
  }

  onLevelRemoveClick(tiernum: number, id: number) {
    this.modService.show('yesno', {
      text: 'The Tier will be deleted permanently. Are you sure?'
    }).then((answer) => {
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
    this.appStorage.addAnnotationLevel(
      newlevel.getObj(this.transcrServ.audiomanager.sampleRateFactor, this.transcrServ.audiomanager.originalInfo.duration.samples))
      .then(
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
}
