import { Component, OnInit } from '@angular/core';
import { OctraAPIService } from '@octra/ngx-octra-api';
import { AppStorageService } from '../../shared/service/appstorage.service';
import { ProjectDto } from '@octra/api-types';
import { DefaultComponent } from '../../component/default.component';
import { OctraModalService } from '../../modals/octra-modal.service';
import { ErrorModalComponent } from '../../modals/error-modal/error-modal.component';

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
    private modalService: OctraModalService
  ) {
    super();
  }

  async ngOnInit() {
    this.subscrManager.add(
      this.api.listProjects().subscribe({
        next: (projects) => {
          this.projects = projects.filter((a) => a.active === true);
          this.projects.sort((a, b) => {
            if (
              a.statistics.freeTasks <= b.statistics.freeTasks &&
              a.active &&
              b.active
            ) {
              return 1;
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
    /* TODO
    if (project.active && project.transcripts_count_free > 0) {
      this.appStorage.startOnlineAnnotation({
        name: project.name,
        id: project.id,
        description: project.description,
        jobsLeft: project.transcripts_count_free - 1
      }).then(() => {
        navigateTo(this.router, ['user/transcr']);
      }).catch((error) => {
        console.error(error);
      });
    }
     */
  }

  onFileChange(event: any) {
    const test = 'result';
    const res = event.target.files[0];
    this.selectedFile = res;
  }

  testUpload() {}
}
