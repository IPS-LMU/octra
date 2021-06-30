import {Component, OnInit} from '@angular/core';
import {OctraAPIService} from '@octra/ngx-octra-api';
import {ProjectResponseDataItem} from '@octra/octra-db';
import {AppStorageService} from '../../shared/service/appstorage.service';
import {navigateTo} from '@octra/utilities';
import {Router} from '@angular/router';

@Component({
  selector: 'octra-projects-list',
  templateUrl: './projects-list.component.html',
  styleUrls: ['./projects-list.component.scss']
})
export class ProjectsListComponent implements OnInit {
  projects: ProjectResponseDataItem[] = [];

  constructor(private api: OctraAPIService,
              private appStorage: AppStorageService,
              private router: Router) {
  }

  ngOnInit(): void {
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
    });
  }

  onProjectClick(project: ProjectResponseDataItem) {
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
  }
}
