import { Component, Input, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { TranslocoService } from '@ngneat/transloco';
import { environment } from '../../../../environments/environment';
import { AppInfo } from '../../../app.info';
import { editorComponents } from '../../../editors/components';
import { ExportFilesModalComponent } from '../../modals/export-files-modal/export-files-modal.component';
import { OctraModalService } from '../../modals/octra-modal.service';
import {
  AudioService,
  SettingsService,
  UserInteractionsService,
} from '../../shared/service';
import { AppStorageService } from '../../shared/service/appstorage.service';
import {
  BugReportService,
  ConsoleType,
} from '../../shared/service/bug-report.service';
import { NavbarService } from './navbar.service';
import {
  AnnotationLevelType,
  OctraAnnotationAnyLevel,
  OctraAnnotationSegment,
} from '@octra/annotation';
import { ToolsModalComponent } from '../../modals/tools-modal/tools-modal.component';
import { StatisticsModalComponent } from '../../modals/statistics-modal/statistics-modal.component';
import { BugreportModalComponent } from '../../modals/bugreport-modal/bugreport-modal.component';
import { YesNoModalComponent } from '../../modals/yes-no-modal/yes-no-modal.component';
import { NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { DefaultComponent } from '../default.component';
import { AnnotationStoreService } from '../../store/login-mode/annotation/annotation.store.service';
import { LoginMode } from '../../store';
import { AccountRole, ProjectDto } from '@octra/api-types';
import { AuthenticationStoreService } from '../../store/authentication';
import { OctraAPIService } from '@octra/ngx-octra-api';
import { AboutModalComponent } from '../../modals/about-modal/about-modal.component';

@Component({
  selector: 'octra-navigation',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavigationComponent extends DefaultComponent implements OnInit {
  modalexport?: NgbModalRef;
  modalTools?: NgbModalRef;
  modalStatistics?: NgbModalRef;

  @Input() version?: string;

  public test = 'ok';

  isCollapsed = true;

  public get environment(): any {
    return environment;
  }

  public get converters(): any[] {
    return AppInfo.converters;
  }

  public get isAdministrator() {
    return (
      this.appStorage.snapshot.authentication.me?.systemRole.label ===
      AccountRole.administrator
    );
  }

  public get AppInfo(): any {
    return AppInfo;
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
    return (
      this.bugService.console.filter((a) => {
        if (a.type === ConsoleType.ERROR && beginCheck) {
          return true;
        }
        if (
          typeof a.message === 'string' &&
          a.message.indexOf('AFTER RELOAD') > -1
        ) {
          beginCheck = true;
        }
        return false;
      }).length > 0
    );
  }

  constructor(
    public appStorage: AppStorageService,
    public navbarServ: NavbarService,
    public sanitizer: DomSanitizer,
    public langService: TranslocoService,
    public modalService: OctraModalService,
    public settService: SettingsService,
    public bugService: BugReportService,
    public annotationStoreService: AnnotationStoreService,
    public authStoreService: AuthenticationStoreService,
    public audio: AudioService,
    public api: OctraAPIService
  ) {
    super();
  }

  ngOnInit() {
    this.subscrManager.add(
      this.navbarServ.onclick.subscribe((name) => {
        switch (name) {
          case 'export':
            this.modalexport = this.modalService.openModalRef(
              ExportFilesModalComponent,
              ExportFilesModalComponent.options,
              {
                navbarService: this,
                uiService: this.uiService,
              }
            );
            break;
        }
      })
    );
  }

  setInterface(newInterface: string) {
    this.navbarServ.interfacechange.emit(newInterface);
  }

  changeLanguage(lang: string) {
    this.langService.setActiveLang(lang);
    this.appStorage.language = lang;
  }

  public interfaceActive(name: string) {
    const found = this.navbarServ.interfaces.find((x) => {
      return name === x;
    });
    return !(found === undefined || false);
  }

  toggleSettings(option: string) {
    (this.appStorage as any)[option] = !(this.appStorage as any)[option];
    if (option === 'logging') {
      this.uiService.enabled = this.appStorage[option];
    }
  }

  public openBugReport() {
    this.modalService
      .openModal(BugreportModalComponent, BugreportModalComponent.options)
      .then(() => {
        window.location.hash = '';
      })
      .catch((err) => {
        console.error(err);
      });
  }

  onLevelNameLeave(event: any, tiernum: number) {
    this.annotationStoreService.changeLevelName(tiernum, event.target.value);
  }

  onLevelAddClick() {
    this.annotationStoreService.addAnnotationLevel(AnnotationLevelType.SEGMENT);
  }

  onLevelRemoveClick(level: OctraAnnotationAnyLevel<OctraAnnotationSegment>) {
    this.modalService
      .openModal(YesNoModalComponent, YesNoModalComponent.options, {
        message: this.langService.translate('modal.level remove', {
          name: level.name,
        }),
      })
      .then((answer) => {
        if (answer === 'yes') {
          this.appStorage.removeAnnotationLevel(level.id).catch((err) => {
            console.error(err);
          });
        }
      })
      .catch((error) => {
        console.error(error);
      });
  }

  onLevelDuplicateClick(tiernum: number) {
    this.annotationStoreService.duplicateLevel(tiernum);
  }

  public selectLevel(tiernum: number) {
    this.annotationStoreService.setLevelIndex(tiernum);
  }

  public changeSecondsPerLine(seconds: number) {
    this.appStorage.secondsPerLine = seconds;
  }

  openExportModal() {
    this.modalexport = this.modalService.openModalRef(
      ExportFilesModalComponent,
      ExportFilesModalComponent.options,
      {
        navbarService: this,
        uiService: this.uiService,
      }
    );
  }

  openToolsModal() {
    this.modalTools = this.modalService.openModalRef(
      ToolsModalComponent,
      ToolsModalComponent.options
    );
  }

  openStatisticsModal() {
    this.modalStatistics = this.modalService.openModalRef(
      StatisticsModalComponent,
      StatisticsModalComponent.options
    );
  }

  backToProjectsList() {
    this.logout(true);
  }

  logout(redirectToProjects = false) {
    if (
      this.appStorage.snapshot.application.mode === LoginMode.ONLINE &&
      this.appStorage.snapshot.onlineMode.currentSession.currentProject
    ) {
      this.annotationStoreService.quit(
        true,
        !redirectToProjects,
        redirectToProjects
      );
    } else {
      this.appStorage.logout(true);
    }
  }

  getFreeAnnotationTasks(project: ProjectDto | undefined) {
    return (
      project?.statistics?.tasks.find((a) => a.type === 'annotation')?.status
        .free ?? 0
    );
  }

  openAboutModal() {
    this.modalService.openModalRef(
      AboutModalComponent,
      AboutModalComponent.options
    );
  }
}
