import { AsyncPipe, NgClass, NgStyle } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgbAccordionModule, NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { AccountProjectRoleDto, ProjectDto, ProjectListDto, TaskDto } from '@octra/api-types';
import { SkeletonDirective } from '@octra/ngx-components';
import { OctraAPIService } from '@octra/ngx-octra-api';
import { wait } from '@octra/utilities';
import { catchError, distinctUntilChanged, forkJoin, of, switchMap, tap, withLatestFrom } from 'rxjs';
import { AppInfo } from '../../../../app.info';
import { DefaultComponent } from '../../../component/default.component';
import { ErrorModalComponent } from '../../../modals/error-modal/error-modal.component';
import { OctraModalService } from '../../../modals/octra-modal.service';
import { LuxonShortDateTimePipe } from '../../../shared';
import { SettingsService } from '../../../shared/service';
import { AppStorageService } from '../../../shared/service/appstorage.service';
import { RootState } from '../../../store';
import { AuthenticationActions, AuthenticationStoreService } from '../../../store/authentication';
import { AnnotationActions } from '../../../store/login-mode/annotation/annotation.actions';
import { AnnotationStoreService } from '../../../store/login-mode/annotation/annotation.store.service';
import { MyTasksComponent } from './my-tasks/my-tasks.component';
import { ProjectRequestModalComponent } from './project-request-modal/project-request-modal.component';

class PreparedProjectDto extends ProjectDto {
  collapsed = true;
  canExpand = false;

  pausedTasks = 0;
  freeTasks = 0;

  loadingStatus: 'loading' | 'finished' | 'empty' = 'loading';

  constructor(partial?: Partial<ProjectDto>) {
    super();
    Object.assign(this, partial);

    if (partial) {
      this.pausedTasks = partial.statistics?.tasks.find((a) => a.type === 'annotation')?.status.paused ?? 0;
      this.freeTasks = partial.statistics?.tasks.find((a) => a.type === 'annotation')?.status.free ?? 0;

      if (this.pausedTasks > 0) {
        this.canExpand = true;
      }
    }
  }
}

@Component({
  selector: 'octra-projects-list',
  templateUrl: './projects-list.component.html',
  styleUrls: ['./projects-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    TranslocoPipe,
    NgbAccordionModule,
    NgbPagination,
    MyTasksComponent,
    NgStyle,
    NgClass,
    LuxonShortDateTimePipe,
    SkeletonDirective,
  ],
})
export class ProjectsListComponent extends DefaultComponent implements OnInit {
  private api = inject(OctraAPIService);
  appStorage = inject(AppStorageService);
  private modalService = inject(OctraModalService);
  authStoreService = inject(AuthenticationStoreService);
  annotationStoreService = inject(AnnotationStoreService);
  private store = inject<Store<RootState>>(Store);
  private actions$ = inject(Actions);
  private settings = inject(SettingsService);
  private cd = inject(ChangeDetectorRef);

  projects?: ProjectListDto;
  shownProjects?: PreparedProjectDto[];

  get email() {
    return this.settings.appSettings.octra.supportEmail;
  }

  projectStarting = false;
  itemsPerPage = 20;
  currentPage?: {
    page: number;
    collectionSize: number;
  };

  projectRoles: AccountProjectRoleDto[] = [];
  istProjectAdmin = false;

  sameUserWithOpenTask?: { projectID: string; taskID: string };
  previousProject?: ProjectDto;

  constructor() {
    super();
    const authStoreService = this.authStoreService;

    this.subscribe(this.actions$.pipe(ofType(AnnotationActions.startAnnotation.fail, AnnotationActions.startAnnotation.success)), {
      next: () => {
        this.projectStarting = false;
        this.cd.markForCheck();
      },
    });
    this.subscribe(authStoreService.me$, {
      next: (me) => {
        this.projectRoles = me?.projectRoles ?? [];
        this.istProjectAdmin = this.projectRoles.find((a) => a.role === 'project_admin') !== undefined;
        this.cd.markForCheck();
      },
    });
    this.subscribe(
      authStoreService.sameUserWithOpenTask$.pipe(
        distinctUntilChanged((a, b) => a?.projectID === b?.projectID && a?.taskID === b?.taskID),
        tap((result) => {
          this.sameUserWithOpenTask = result;
          if (!result?.projectID || !result?.taskID) {
            this.previousProject = undefined;
          }
          this.cd.markForCheck();
        }),
        // switchMap cancels a still-running lookup for a previously open task
        // as soon as the derived project/task changes, instead of piling up
        // an additional, independent request on top of it
        switchMap((result) => {
          if (!result?.projectID || !result?.taskID) {
            return of(undefined);
          }

          return forkJoin({
            project: this.api.getProject(result.projectID),
            task: this.api.getTask(result.projectID, result.taskID),
          }).pipe(
            withLatestFrom(this.authStoreService.me$),
            catchError(() => {
              console.warn(
                `Another user was previously logged in. User is not allowed to continue task ${result.taskID} of project ${result.projectID}`,
              );
              return of(undefined);
            }),
          );
        }),
      ),
      {
        next: (value) => {
          if (!value) {
            return;
          }
          const [{ project, task }, me] = value;
          if (task.worker_username === me.username || task.assigned_worker_username === me.username) {
            this.previousProject = project;
          } else {
            this.previousProject = undefined;
          }

          this.cd.markForCheck();
        },
      },
    );
  }

  async ngOnInit() {
    this.subscribe(this.actions$.pipe(ofType(AuthenticationActions.needReAuthentication.success.type)), {
      next: () => {
        this.loadProjects(1);
        this.cd.markForCheck();
      },
    });
    await this.loadProjects(1);
  }

  async loadProjects(page: number) {
    this.projects = undefined;
    this.shownProjects = Array.from({ length: 20 }, () => new PreparedProjectDto());
    this.cd.markForCheck();

    await wait(5);
    this.subscribe(
      this.api.listProjects({
        manageable: false,
        start: page,
        representation: 'page',
        order: 'asc',
        order_by: 'name',
      }),
      {
        next: async (projects) => {
          await wait(5);
          this.projects = {
            ...projects,
            list: projects.list?.filter((a: any) => {
              const annotationStatistics = a.statistics?.tasks.find((a: any) => a.type === 'annotation');

              if (annotationStatistics) {
                if (annotationStatistics.status.free > 0 || annotationStatistics.status.paused > 0) {
                  return true;
                }
              }

              return false;
            }),
          };
          this.showProjects(page);
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 401) {
            this.store.dispatch(
              AuthenticationActions.needReAuthentication.do({
                actionAfterSuccess: AuthenticationActions.redirectToProjects.do,
                forceLogout: true,
              }),
            );
          } else {
            const ref = this.modalService.openModalRef<ErrorModalComponent>(ErrorModalComponent, ErrorModalComponent.options);
            ref.componentInstance.text = error.message;
          }
          this.cd.markForCheck();
        },
      },
    );
  }

  showProjects(page: number) {
    this.shownProjects = this.projects!.list.slice((page - 1) * this.itemsPerPage, page * this.itemsPerPage).map((a) => {
      const showProject = new PreparedProjectDto(a);
      showProject.loadingStatus = 'finished';
      return showProject;
    });
    this.currentPage = {
      page,
      collectionSize: this.projects!.list.length,
    };
    this.cd.markForCheck();
  }

  onStartNewTaskClick(project: ProjectDto) {
    this.projectStarting = true;
    this.appStorage.startOnlineAnnotation(project);
  }

  getPausedTasks(project: ProjectDto) {
    return project.statistics?.tasks.find((a) => a.type === 'annotation')?.status.paused ?? 0;
  }

  openCreateProjectRequestModal() {
    this.modalService.openModalRef<ProjectRequestModalComponent>(ProjectRequestModalComponent, ProjectRequestModalComponent.options);
  }

  pausedTaskContinueClick($event: { project: ProjectDto; task: TaskDto }) {
    this.annotationStoreService.resumeTaskManually($event.project, $event.task);
  }

  protected readonly AppInfo = AppInfo;
}
