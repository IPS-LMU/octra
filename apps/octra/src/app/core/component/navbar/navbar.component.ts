import {AfterViewInit, Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';
import {TranslocoService} from '@ngneat/transloco';
import {environment} from '../../../../environments/environment';
import {AppInfo} from '../../../app.info';
import {editorComponents} from '../../../editors/components';
import {ExportFilesModalComponent} from '../../modals/export-files-modal/export-files-modal.component';
import {ModalService} from '../../modals/modal.service';
import {SubscriptionManager} from '@octra/utilities';
import {SettingsService, TranscriptionService, UserInteractionsService} from '../../shared/service';
import {AppStorageService} from '../../shared/service/appstorage.service';
import {BugReportService, ConsoleType} from '../../shared/service/bug-report.service';
import {NavbarService} from './navbar.service';
import {AnnotationLevelType, Level, Segments} from '@octra/annotation';

declare let jQuery: any;

@Component({
  selector: 'octra-navigation',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavigationComponent implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild('modalexport', {static: true}) modalexport: ExportFilesModalComponent;
  @Input() version: string;

  public test = 'ok';
  collapsed = true;
  public secondsPerLine = '5';
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
    return editorComponents;
  }

  get annotJSONType() {
    return AnnotationLevelType;
  }

  public get errorsFound(): boolean {
    let beginCheck = false;
    return (this.bugService.console.filter((a) => {
      if (a.type === ConsoleType.ERROR && beginCheck) {
        return true;
      }
      if (typeof a.message === 'string' && a.message.indexOf('AFTER RELOAD') > -1) {
        beginCheck = true;
      }
      return false;
    }).length > 0);
  }

  constructor(public appStorage: AppStorageService,
              public navbarServ: NavbarService,
              public sanitizer: DomSanitizer,
              public langService: TranslocoService,
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
            this.modalexport.open().catch((error) => {
              console.error(error);
            });
            break;
        }
      })
    );
  }

  ngAfterViewInit() {
    jQuery(document).on('click', '.options-menu', (e) => {
      e.stopPropagation();
    });

    (jQuery('body') as any).bootstrapMaterialDesign();
  }

  setInterface(newInterface: string) {
    this.navbarServ.interfacechange.emit(newInterface);
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
    this.langService.setActiveLang(lang);
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
    this.modService.show('bugreport').then(() => {
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
      this.appStorage.changeAnnotationLevel(tiernum, {
        id: level.id,
        name: level.name,
        type: level.type,
        items: level.segments.getObj(level.name, this.transcrServ.audioManager.ressource.info.duration.samples)
      }).catch((error) => {
        console.error(error);
      });
      // update value for annoation object in transcr service
      this.transcrServ.annotation.levels[tiernum].name = event.target.value.replace(' ', '_');
    } else {
      event.target.value = this.transcrServ.annotation.levels[tiernum].name;
    }
  }

  onLevelAddClick() {
    const levelNums = this.transcrServ.annotation.levels.length;
    let levelname = `OCTRA_${levelNums + 1}`;
    let index = levelNums;

    const nameexists = (newname: string) => {
      for (const level of this.transcrServ.annotation.levels) {
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
      new Segments(this.transcrServ.audioManager.ressource.info.sampleRate, levelname, [],
        this.transcrServ.audioManager.ressource.info.duration));
    this.appStorage.addAnnotationLevel(
      newlevel.getObj(this.transcrServ.audioManager.ressource.info.duration))
      .then(() => {
        this.transcrServ.annotation.levels.push(newlevel);
      }).catch((error) => {
      console.error(error);
    });
  }

  onLevelRemoveClick(tiernum: number, id: number) {
    this.modService.show('yesno', {
      text: 'The Tier will be deleted permanently. Are you sure?'
    }).then((answer) => {
      if (answer === 'yes') {
        if (this.transcrServ.annotation.levels.length > 1) {
          this.appStorage.removeAnnotationLevel(id).catch((err) => {
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
      newlevel.getObj(this.transcrServ.audioManager.ressource.info.duration))
      .then(() => {
        this.transcrServ.annotation.levels.push(newlevel);
      }).catch((error) => {
      console.error(error);
    });
  }

  public selectLevel(tiernum: number) {
    this.transcrServ.selectedlevel = tiernum;
  }

  public changeSecondsPerLine(seconds: number) {
    this.secondsPerLine = seconds.toString();
    this.appStorage.secondsPerLine = seconds;
  }
}
