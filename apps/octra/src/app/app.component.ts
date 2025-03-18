import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { environment } from '../environments/environment';
import { AlertComponent, NavigationComponent } from './core/component';
import { DefaultComponent } from './core/component/default.component';
import { OctraModalComponent } from './core/modals/octra-modal';
import { MultiThreadingService } from './core/shared/multi-threading/multi-threading.service';
import { AppStorageService } from './core/shared/service/appstorage.service';
import { ApplicationStoreService } from './core/store/application/application-store.service';
import { AnnotationStoreService } from './core/store/login-mode/annotation/annotation.store.service';
import { OctraComponentsModule } from '@octra/ngx-components';

@Component({
  selector: 'octra-app',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [
    AlertComponent,
    OctraModalComponent,
    RouterOutlet,
    OctraComponentsModule,
    NavigationComponent,
  ],
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
    private annotationStoreService: AnnotationStoreService,
  ) {
    super();

    this.appStoreService.initApplication();

    if (environment.debugging.enabled && environment.debugging.logging.routes) {
      this.subscribe(this.router.events, {
        next: (event: any) => {
          if (event.snapshot) {
            console.log(
              `route from ${event.url} to guard: ${event.snapshot.url}, component: ${event.snapshot.component?.name}`,
            );
          }
        },
      });
    }
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
