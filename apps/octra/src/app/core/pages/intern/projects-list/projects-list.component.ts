import { AsyncPipe, NgClass, NgStyle } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgbAccordionModule, NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import {
  AccountProjectRoleDto,
  ProjectDto,
  ProjectListDto,
  TaskDto,
} from '@octra/api-types';
import { OctraAPIService } from '@octra/ngx-octra-api';
import { DefaultComponent } from '../../../component/default.component';
import { ErrorModalComponent } from '../../../modals/error-modal/error-modal.component';
import { OctraModalService } from '../../../modals/octra-modal.service';
import { LuxonShortDateTimePipe } from '../../../shared';
import { AppStorageService } from '../../../shared/service/appstorage.service';
import { RootState } from '../../../store';
import {
  AuthenticationActions,
  AuthenticationStoreService,
} from '../../../store/authentication';
import { AnnotationActions } from '../../../store/login-mode/annotation/annotation.actions';
import { AnnotationStoreService } from '../../../store/login-mode/annotation/annotation.store.service';
import { MyTasksComponent } from './my-tasks/my-tasks.component';
import { ProjectRequestModalComponent } from './project-request-modal/project-request-modal.component';

class PreparedProjectDto extends ProjectDto {
  collapsed = true;
  canExpand = false;

  pausedTasks = 0;
  freeTasks = 0;

  constructor(partial?: Partial<ProjectDto>) {
    super();
    Object.assign(this, partial);

    if (partial) {
      this.pausedTasks = partial.statistics.tasks.find(
        (a) => a.type === 'annotation',
      )?.status.paused;
      this.freeTasks = partial.statistics.tasks.find(
        (a) => a.type === 'annotation',
      )?.status.free;

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
  imports: [
    AsyncPipe,
    TranslocoPipe,
    LuxonShortDateTimePipe,
    NgbPagination,
    NgStyle,
    NgbAccordionModule,
    NgClass,
    MyTasksComponent,
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

  projects?: ProjectListDto;
  shownProjects?: PreparedProjectDto[];

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

    this.subscribe(
      this.actions$.pipe(
        ofType(
          AnnotationActions.startAnnotation.fail,
          AnnotationActions.startAnnotation.success,
        ),
      ),
      {
        next: () => {
          this.projectStarting = false;
        },
      },
    );
    this.subscribe(authStoreService.me$, {
      next: (me) => {
        this.projectRoles = me?.projectRoles ?? [];
        this.istProjectAdmin =
          this.projectRoles.find((a) => a.role === 'project_admin') !==
          undefined;
      },
    });
    this.subscribe(authStoreService.sameUserWithOpenTask$, {
      next: (result) => {
        this.sameUserWithOpenTask = result;
        if (result?.projectID) {
          this.subscribe(this.api.getProject(result.projectID), {
            next: (result) => {
              this.previousProject = result;
            },
          });
        }
      },
    });
  }

  async ngOnInit() {
    this.subscribe(
      this.actions$.pipe(
        ofType(AuthenticationActions.needReAuthentication.success.type),
      ),
      {
        next: () => {
          this.loadProjects(1);
        },
      },
    );
    this.loadProjects(1);
  }

  loadProjects(page: number) {
    this.projects = undefined;

    this.subscribe(
      this.api.listProjects({
        manageable: false,
        start: page,
        representation: 'page',
        order: 'asc',
        order_by: 'name',
      }),
      {
        next: (projects) => {
          this.projects = {
            ...projects,
            list: projects.list?.filter((a: any) => {
              const annotationStatistics = a.statistics?.tasks.find(
                (a: any) => a.type === 'annotation',
              );

              if (annotationStatistics) {
                if (
                  annotationStatistics.status.free > 0 ||
                  annotationStatistics.status.paused > 0
                ) {
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
            const ref = this.modalService.openModalRef<ErrorModalComponent>(
              ErrorModalComponent,
              ErrorModalComponent.options,
            );
            ref.componentInstance.text = error.message;
          }
        },
      },
    );
  }

  showProjects(page: number) {
    this.shownProjects = this.projects.list
      .slice((page - 1) * this.itemsPerPage, page * this.itemsPerPage)
      .map((a) => new PreparedProjectDto(a));
    this.currentPage = {
      page,
      collectionSize: this.projects.list.length,
    };
  }

  onStartNewTaskClick(project: ProjectDto) {
    this.projectStarting = true;
    this.appStorage.startOnlineAnnotation(project);
  }

  getPausedTasks(project: ProjectDto) {
    return (
      project.statistics?.tasks.find((a) => a.type === 'annotation')?.status
        .paused ?? 0
    );
  }

  openCreateProjectRequestModal() {
    this.modalService.openModalRef<ProjectRequestModalComponent>(
      ProjectRequestModalComponent,
      ProjectRequestModalComponent.options,
    );
  }

  pausedTaskContinueClick($event: { project: ProjectDto; task: TaskDto }) {
    this.annotationStoreService.resumeTaskManually($event.project, $event.task);
  }
}
