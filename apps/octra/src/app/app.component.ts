import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../environments/environment';
import { NavigationComponent } from './core/component';
import { MultiThreadingService } from './core/shared/multi-threading/multi-threading.service';
import { AppStorageService } from './core/shared/service/appstorage.service';
import { DefaultComponent } from './core/component/default.component';
import { ApplicationStoreService } from './core/store/application/application-store.service';
import { AnnotationStoreService } from './core/store/login-mode/annotation/annotation.store.service';
import {
  DecisionTree,
  generatePossibleSolutions,
} from '../../../../libs/json-sets/src/lib/decision-tree';

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

    const tree = DecisionTree.json2tree({
      group: 'root',
      description: 'root description',
      combine: {
        type: 'and',
        expressions: [
          {
            select: 1,
            name: 'audiofile',
            description: '',
            with: {
              fileSize: 2000, // - // <- oder Verbindungen          //  |- und Verbindungen
              mimeType: ['audio/wav'], // <- oder Verbindungen  // -
            },
          },
          {
            select: 1,
            name: 'textfile',
            description: '',
            with: {
              fileSize: 2000,
              mimeType: ['application/json'],
              content: ['AnnotJSON'],
            },
          },
          {
            select: 1,
            name: 'image',
            description: '',
            with: {
              mimeType: ['image'],
            },
          },
        ],
      },
    });

    tree.validate([
      {
        name: 'a',
        size: 1000,
        type: 'audio/wav',
      },
      {
        name: 'b',
        size: 1000,
        type: 'audio/wav',
      },
      {
        name: 'c',
        size: 1000,
        type: 'application/json',
        content: 'AnnotJSON',
      },
      {
        name: 'd',
        size: 1000,
        type: 'image',
        content: 'AnnotJSON',
      },
      {
        name: 'e',
        size: 1000,
        type: 'image',
        content: 'AnnotJSON',
      },
    ]);
    console.log(`TREE__________`);
    console.log(tree);
    console.log(`SOLUTION__________`);
    tree.outputTreeWithSolutions();

    console.log('POW TEST');
    let pow2 = generatePossibleSolutions('exact', 2, [
      {
        name: 'a',
        size: 1000,
        type: 'audio/wav',
      },
      {
        name: 'b',
        size: 1000,
        type: 'audio/wav',
      },
      {
        name: 'c',
        size: 1000,
        type: 'application/json',
        content: 'AnnotJSON',
      },
      {
        name: 'd',
        size: 1000,
        type: 'image',
        content: 'AnnotJSON',
      },
      {
        name: 'e',
        size: 1000,
        type: 'image',
        content: 'AnnotJSON',
      },
    ]);

    console.log(pow2.map((a: any[]) => `(${a.map((b) => b.name).join(',')})`));
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
