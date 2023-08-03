import { HttpClient } from '@angular/common/http';
import { Component, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoService } from '@ngneat/transloco';
import { AppInfo } from '../../../app.info';
import { navigateTo } from '@octra/ngx-utilities';
import {
  AudioService,
  SettingsService,
  TranscriptionService,
} from '../../shared/service';
import { AppStorageService } from '../../shared/service/appstorage.service';
import { LoadingStatus } from '../../store';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { DefaultComponent } from '../../component/default.component';
import { ApplicationStoreService } from '../../store/application/application-store.service';
import { RoutingService } from '../../shared/service/routing.service';

@Component({
  selector: 'octra-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.scss'],
})
export class LoadingComponent extends DefaultComponent implements OnInit {
  @Output() loaded = false;
  public text = '';
  public state = '';
  public warning = '';

  loading: {
    status: LoadingStatus;
    progress: number;
    errors: string[];
  } = {
    status: LoadingStatus.INITIALIZE,
    progress: 0,
    errors: [],
  };

  constructor(
    private langService: TranslocoService,
    public settService: SettingsService,
    public appStorage: AppStorageService,
    public audio: AudioService,
    private router: Router,
    private routingService: RoutingService,
    private transcrService: TranscriptionService,
    private http: HttpClient,
    private store: Store,
    private actions: Actions,
    private applicationStore: ApplicationStoreService
  ) {
    super();
  }

  ngOnInit() {
    this.langService
      .selectTranslate('general.please wait')
      .subscribe((translation) => {
        this.text = translation + '... ';
      });

    /* TODO move to Effect
    this.subscrManager.add(
      this.applicationStore.appInitialized.subscribe({
        next: (isInitalized) => {
          if (isInitalized) {
            this.subscrManager.add(
              this.applicationStore.loading$.subscribe({
                next: (a) => {
                  this.loading = a;
                },
              })
            );

            if (
              this.appStorage.urlParams !== undefined &&
              hasProperty(this.appStorage.urlParams, 'audio') &&
              this.appStorage.urlParams.audio !== '' &&
              this.appStorage.urlParams.audio !== undefined
            ) {
              this.store.dispatch(
                OnlineModeActions.loginURLParameters({
                  urlParams: this.appStorage.urlParams,
                })
              );
            } else if (this.appStorage.useMode === LoginMode.URL) {
              // url mode set, but no params => change mode
              console.warn(
                `use mode is url but no params found. Reset use mode.`
              );
              if (
                this.appStorage.snapshot.authentication.me?.username !==
                  undefined &&
                this.appStorage.snapshot.authentication.me.username !== '' &&
                this.appStorage.sessionfile === undefined
              ) {
                this.store.dispatch(
                  ApplicationActions.setMode({
                    mode: LoginMode.ONLINE,
                  })
                );
              } else {
                this.store.dispatch(
                  ApplicationActions.setMode({
                    mode: LoginMode.LOCAL,
                  })
                );
              }
            }

            if (
              this.appStorage.useMode !== LoginMode.URL &&
              !this.appStorage.loggedIn
            ) {
              // not logged in, go back
              console.log("not logged in, go back to login page");
              this.routingService.navigate(["/login"], AppInfo.queryParamsHandling);
            } else if (this.appStorage.loggedIn) {
              console.log("logged in, read...");
              if (
                this.appStorage.useMode === LoginMode.LOCAL &&
                this.audio.audiomanagers.length === 0
              ) {
                navigateTo(
                  this.router,
                  ['/intern/transcr/reload-file'],
                  AppInfo.queryParamsHandling
                ).catch((error) => {
                  console.error(error);
                });
              } else {
                if (this.appStorage.useMode === LoginMode.URL) {
                  this.state = 'Get transcript from URL...';
                  // set audio url from url params
                  this.store.dispatch(
                    OnlineModeActions.setAudioURL.do({
                      audioURL: decodeURI(this.appStorage.urlParams.audio),
                      mode: this.appStorage.useMode,
                    })
                  );
                } else if(this.appStorage.useMode === LoginMode.ONLINE) {
                  console.log("redirect to transcr...");
                  this.routingService.navigate(["/intern/transcr"], AppInfo.queryParamsHandling);
                }

                // this.settService.loadAudioFile(this.audio);
              }
            } else {
              console.warn(
                `special situation: loggedIn is undefined! useMode ${this.appStorage.useMode}`
              );
            }
          } else {
            console.log('waiting for initialization...');
          }
        },
      }),
      'appInit'
    );
     */
  }

  retry() {
    location.reload();
  }

  goBack() {
    this.appStorage.logout();
    navigateTo(this.router, ['/login'], AppInfo.queryParamsHandling).catch(
      (error) => {
        console.error(error);
      }
    );
  }
}
