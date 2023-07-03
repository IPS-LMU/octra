import { Component, OnInit } from '@angular/core';
import { OctraAPIService } from '@octra/ngx-octra-api';
import { AppStorageService } from '../../shared/service/appstorage.service';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ProjectDto } from '@octra/api-types';

@Component({
  selector: 'octra-projects-list',
  templateUrl: './projects-list.component.html',
  styleUrls: ['./projects-list.component.scss'],
})
export class ProjectsListComponent implements OnInit {
  projects: ProjectDto[] = [];
  selectedFile: File;

  constructor(
    private api: OctraAPIService,
    public appStorage: AppStorageService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    /* TODO
    this.api.listProjects().then((projects: ProjectResponseDataItem[]) => {
      projects = projects.filter(a => a.active === true);
      projects.sort((a, b) => {
        if (a.transcripts_count_free <= b.transcripts_count_free && a.active && b.active) {
          return 1;
        }
        return -1;
      });
      this.projects = projects;
    }).catch((error) => {
      console.error(error);
    }); */
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
