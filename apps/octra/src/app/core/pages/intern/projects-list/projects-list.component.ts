import { AsyncPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { ProjectDto, ProjectListDto } from '@octra/api-types';
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
import { NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { ProjectRequestModalComponent } from './project-request-modal/project-request-modal.component';

@Component({
  selector: 'octra-projects-list',
  templateUrl: './projects-list.component.html',
  styleUrls: ['./projects-list.component.scss'],
  imports: [AsyncPipe, TranslocoPipe, LuxonShortDateTimePipe, NgbPagination],
})
export class ProjectsListComponent extends DefaultComponent implements OnInit {
  projects?: ProjectListDto;
  shownProjects?: ProjectDto[];

  projectStarting = false;
  itemsPerPage = 20;
  currentPage?: {
    page: number;
    collectionSize: number;
  };

  constructor(
    private api: OctraAPIService,
    public appStorage: AppStorageService,
    private modalService: OctraModalService,
    public authStoreService: AuthenticationStoreService,
    private annotationStoreService: AnnotationStoreService,
    private store: Store<RootState>,
    private actions$: Actions
  ) {
    super();
    this.subscribe(
      this.actions$.pipe(
        ofType(
          AnnotationActions.startAnnotation.fail,
          AnnotationActions.startAnnotation.success
        )
      ),
      {
        next: () => {
          this.projectStarting = false;
        },
      }
    );
  }

  async ngOnInit() {
    this.subscribe(
      this.actions$.pipe(
        ofType(AuthenticationActions.needReAuthentication.success.type)
      ),
      {
        next: () => {
          this.loadProjects(1);
        },
      }
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
        order: "asc",
        order_by: "name"
      }),
      {
        next: (projects) => {
          this.projects = {
            ...projects,
            list: projects.list?.filter((a: any) => {
              const annotationStatistics = a.statistics?.tasks.find(
                (a: any) => a.type === 'annotation'
              );

              if (annotationStatistics) {
                if (annotationStatistics.status.free > 0) {
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
              })
            );
          } else {
            const ref = this.modalService.openModalRef<ErrorModalComponent>(
              ErrorModalComponent,
              ErrorModalComponent.options
            );
            ref.componentInstance.text = error.message;
          }
        },
      }
    );
  }

  showProjects(page: number) {
    this.shownProjects = this.projects.list.slice((page - 1) * this.itemsPerPage, page * this.itemsPerPage);
    this.currentPage = {
      page,
      collectionSize: this.projects.list.length
    };
  }

  onProjectClick(project: ProjectDto) {
    this.projectStarting = true;
    this.appStorage.startOnlineAnnotation(project);
  }

  resumeTaskManually() {
    this.annotationStoreService.resumeTaskManually();
  }

  getFreeAnnotationTasks(project: ProjectDto) {
    return (
      project.statistics?.tasks.find((a) => a.type === 'annotation')?.status
        .free ?? 0
    );
  }

  openCreateProjectRequestModal(){
      this.modalService.openModalRef<ProjectRequestModalComponent>(ProjectRequestModalComponent, ProjectRequestModalComponent.options);
  }
}
