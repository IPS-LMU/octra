import { Component, OnInit } from '@angular/core';
import { OctraAPIService } from '@octra/ngx-octra-api';
import { AppStorageService } from '../../shared/service/appstorage.service';
import { ProjectDto } from '@octra/api-types';
import { DefaultComponent } from '../../component/default.component';
import { OctraModalService } from '../../modals/octra-modal.service';
import { ErrorModalComponent } from '../../modals/error-modal/error-modal.component';
import { RoutingService } from '../../shared/service/routing.service';

@Component({
  selector: 'octra-projects-list',
  templateUrl: './projects-list.component.html',
  styleUrls: ['./projects-list.component.scss'],
})
export class ProjectsListComponent extends DefaultComponent implements OnInit {
  projects: ProjectDto[] = [];
  selectedFile: File;

  constructor(
    private api: OctraAPIService,
    public appStorage: AppStorageService,
    private modalService: OctraModalService,
    private routingService: RoutingService
  ) {
    super();
  }

  async ngOnInit() {
    this.subscrManager.add(
      this.api.listProjects().subscribe({
        next: (projects) => {
          this.projects = projects;
          this.projects.sort((a, b) => {
            if (a.active && !b.active) {
              return 1;
            } else if (a.active && b.active) {
              if (a.statistics.freeTasks > b.statistics.freeTasks) {
                return 1;
              }
              return 0;
            }
            return -1;
          });
        },
        error: (error) => {
          const ref = this.modalService.openModalRef(
            ErrorModalComponent,
            ErrorModalComponent.options
          );
          ref.componentInstance.text = error.message;
        },
      })
    );
  }

  onProjectClick(project: ProjectDto) {
    if (project.statistics.freeTasks > 0) {
      this.appStorage.startOnlineAnnotation(project);
    }
  }

  onFileChange(event: any) {
    const test = 'result';
    const res = event.target.files[0];
    this.selectedFile = res;
  }

  testUpload() {}
}
