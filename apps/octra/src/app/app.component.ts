import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../environments/environment';
import { NavigationComponent } from './core/component';
import { MultiThreadingService } from './core/shared/multi-threading/multi-threading.service';
import { AppStorageService } from './core/shared/service/appstorage.service';
import { DefaultComponent } from './core/component/default.component';
import { ApplicationStoreService } from './core/store/application/application-store.service';
import { AnnotationStoreService } from './core/store/login-mode/annotation/annotation.store.service';
import { FileSetValidator } from '@octra/json-sets';

@Component({
  selector: 'octra-app',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent
  extends DefaultComponent
  implements OnInit, OnDestroy
{
  @ViewChild('navigation', { static: true }) navigation:
    | NavigationComponent
    | undefined;

  public get environment(): any {
    return environment;
  }

  constructor(
    public appStorage: AppStorageService,
    private router: Router,
    private route: ActivatedRoute,
    private multiThreading: MultiThreadingService,
    private appStoreService: ApplicationStoreService,
    private annotationStoreService: AnnotationStoreService
  ) {
    super();

    this.appStoreService.initApplication();

    if (environment.debugging.enabled && environment.debugging.logging.routes) {
      this.subscribe(this.router.events, {
        next: (event: any) => {
          if (event.snapshot) {
            console.log(
              `route from ${event.url} to guard: ${event.snapshot.url}, component: ${event.snapshot.component?.name}`
            );
          }
        },
      });
    }

    const validator = new FileSetValidator({
      name: 'one audio file and one text file',
      description: 'root description',
      combine: {
        type: 'and',
        expressions: [
          {
            select: '1',
            name: 'audiofile',
            description: '',
            with: [
              {
                size: '<= 2MB',
                mimeType: ['audio/wav', 'audio/ogg'],
              },
            ],
          },
          {
            select: '1',
            name: 'textfile',
            description: '',
            with: {
              size: '<= 2MB',
              mimeType: ['application/json'],
              content: ['AnnotJSON'],
            },
          },
        ],
      },
    });

    validator.validate([
      {
        name: 'test.wav',
        size: 1000,
        type: 'audio/wav',
      },
      {
        name: 'test.ogg',
        size: 1000,
        type: 'audio/ogg',
      },
      {
        name: 'test.json',
        size: 1000,
        type: 'application/json',
        content: 'AnnotJSON',
      },
    ]);
    console.log(`TREE__________`);
    console.log(validator);
    console.log(`SOLUTION__________`);
    console.log(
      JSON.stringify(
        validator.decisionTree!.possibleSelections.map((a: any) =>
          a.map((b: any) => ({
            path: b.path,
            selection: b.selection,
          }))
        ),
        null,
        2
      )
    );
    console.log('ERRORS');
    console.log(validator.decisionTree!._errors);
  }

  ngOnInit() {
    this.route.fragment.subscribe((fragment) => {
      switch (fragment) {
        case 'feedback':
          this.navigation?.openBugReport();
          break;
      }
    });
  }

  override ngOnDestroy() {
    super.ngOnDestroy();
    this.multiThreading.destroy();
    this.annotationStoreService.destroy();
    this.appStoreService.destroy();
  }

  queryParamsSet(): boolean {
    const params = this.route.snapshot.queryParams;
    return params['audio_url'] && params['embedded'];
  }
}
