import { AsyncPipe, NgClass, NgStyle, UpperCasePipe } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import {
  NgbCollapse,
  NgbDropdown,
  NgbDropdownMenu,
  NgbDropdownToggle,
  NgbModalRef,
  NgbOffcanvas,
  NgbPopover,
} from '@ng-bootstrap/ng-bootstrap';
import {
  AnnotationLevelType,
  OctraAnnotationAnyLevel,
  OctraAnnotationSegment,
} from '@octra/annotation';
import { AccountRole, ProjectDto } from '@octra/api-types';
import { AsrOptionsComponent } from '@octra/ngx-components';
import { OctraAPIService } from '@octra/ngx-octra-api';
import { OctraUtilitiesModule } from '@octra/ngx-utilities';
import { DateTime } from 'luxon';
import { environment } from '../../../../environments/environment';
import { AppInfo } from '../../../app.info';
import { editorComponents } from '../../../editors/components';
import { AboutModalComponent } from '../../modals/about-modal/about-modal.component';
import { ExportFilesModalComponent } from '../../modals/export-files-modal/export-files-modal.component';
import { OctraModalService } from '../../modals/octra-modal.service';
import { StatisticsModalComponent } from '../../modals/statistics-modal/statistics-modal.component';
import { ToolsModalComponent } from '../../modals/tools-modal/tools-modal.component';
import { YesNoModalComponent } from '../../modals/yes-no-modal/yes-no-modal.component';
import {
  AudioService,
  SettingsService,
  UserInteractionsService,
} from '../../shared/service';
import { AppStorageService } from '../../shared/service/appstorage.service';
import {
  BugReportService,
  ConsoleEntry,
  ConsoleGroupEntry,
  ConsoleType,
} from '../../shared/service/bug-report.service';
import { LoginMode } from '../../store';
import { ApplicationStoreService } from '../../store/application/application-store.service';
import { AsrStoreService } from '../../store/asr/asr-store-service.service';
import { AuthenticationStoreService } from '../../store/authentication';
import { AnnotationStoreService } from '../../store/login-mode/annotation/annotation.store.service';
import { DefaultComponent } from '../default.component';
import { NavbarService } from './navbar.service';

@Component({
  selector: 'octra-navigation',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  imports: [
    NgbPopover,
    NgbCollapse,
    RouterLinkActive,
    RouterLink,
    NgClass,
    NgbDropdown,
    NgStyle,
    NgbDropdownToggle,
    NgbDropdownMenu,
    AsrOptionsComponent,
    AsyncPipe,
    UpperCasePipe,
    TranslocoPipe,
    OctraUtilitiesModule,
  ],
})
export class NavigationComponent extends DefaultComponent implements OnInit {
  modalexport?: NgbModalRef;
  modalTools?: NgbModalRef;
  modalStatistics?: NgbModalRef;

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

  @ViewChild('canvasContent') canvasContent?: TemplateRef<any>;

  public get errorsFound(): boolean {
    let beginCheck = false;
    return (
      this.bugService.console.filter((a) => {
        const hasError = (b: ConsoleEntry) => {
          if (b.type === ConsoleType.ERROR && beginCheck) {
            return true;
          }
          if (
            typeof b.message === 'string' &&
            b.message.indexOf('AFTER RELOAD') > -1
          ) {
            beginCheck = true;
          }
          return false;
        };

        if (
          Object.keys(a).includes('label') ||
          Object.keys(a).includes('entries')
        ) {
          for (const entry of (a as ConsoleGroupEntry).entries) {
            if (hasError(entry)) {
              return true;
            }
          }
          return false;
        } else {
          return hasError(a as ConsoleEntry);
        }
      }).length > 0
    );
  }

  constructor(
    public appStorage: AppStorageService,
    private appStoreService: ApplicationStoreService,
    public navbarServ: NavbarService,
    public sanitizer: DomSanitizer,
    public langService: TranslocoService,
    public modalService: OctraModalService,
    public settService: SettingsService,
    public bugService: BugReportService,
    public annotationStoreService: AnnotationStoreService,
    public authStoreService: AuthenticationStoreService,
    public audio: AudioService,
    public api: OctraAPIService,
    private offcanvasService: NgbOffcanvas,
    protected asrStoreService: AsrStoreService
  ) {
    super();
  }

  ngOnInit() {
    this.subscribe(this.navbarServ.onclick, (name) => {
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
    });

    this.subscribe(this.navbarServ.openSettings, {
      next: () => {
        this.openEnd();
      },
    });
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
    this.appStorage.disableUndoRedo();
    this.appStoreService.setShortcutsEnabled(false);
    this.modalService
      .openBugreportModal()
      .then(() => {
        this.appStorage.enableUndoRedo();
        this.appStoreService.setShortcutsEnabled(true);
        window.location.hash = '';
      })
      .catch((err) => {
        this.appStorage.enableUndoRedo();
        this.appStoreService.setShortcutsEnabled(true);
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

  openEnd() {
    this.appStoreService.setShortcutsEnabled(false);
    const ref = this.offcanvasService.open(this.canvasContent, {
      position: 'end',
    });
    this.subscribe(
      ref.dismissed,
      {
        next: () => {
          this.appStoreService.setShortcutsEnabled(true);
          this.subscriptionManager.removeByTag('canvasDismissed');
        },
      },
      'canvasDismissed'
    );
  }
}
