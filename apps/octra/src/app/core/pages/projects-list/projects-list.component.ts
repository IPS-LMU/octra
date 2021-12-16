import {Component, OnInit} from '@angular/core';
import {OctraAPIService} from '@octra/ngx-octra-api';
import {ProjectResponseDataItem} from '@octra/db';
import {AppStorageService} from '../../shared/service/appstorage.service';
import {navigateTo} from '@octra/utilities';
import {Router} from '@angular/router';
import {HttpClient} from '@angular/common/http';

@Component({
  selector: 'octra-projects-list',
  templateUrl: './projects-list.component.html',
  styleUrls: ['./projects-list.component.scss']
})
export class ProjectsListComponent implements OnInit {
  projects: ProjectResponseDataItem[] = [];
  selectedFile: File;

  constructor(private api: OctraAPIService,
              public appStorage: AppStorageService,
              private router: Router, private http: HttpClient) {
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

  onFileChange(event: any) {
    const test = 'result';
    const res = event.target.files[0];
    this.selectedFile = res;
  }

  testUpload() {
    console.log(`test upload`);
    this.api.uploadMedia(5, this.selectedFile, {test: 234234}).then((result) => {
      console.log(result);
    }).catch((error) => {
      console.error(error);
    });
  }
}
