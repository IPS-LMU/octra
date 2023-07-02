import { HttpClient } from '@angular/common/http';
import { Component, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoService } from '@ngneat/transloco';
import { AppInfo } from '../../../app.info';
import { afterTrue, hasProperty } from '@octra/utilities';
import { navigateTo } from '@octra/ngx-utilities';
import {
  AudioService,
  SettingsService,
  TranscriptionService,
} from '../../shared/service';
import { AppStorageService } from '../../shared/service/appstorage.service';
import {
  IFile,
  ImportResult,
  OAudiofile,
  OIDBLevel,
  OIDBLink,
  OLevel,
} from '@octra/annotation';
import { LoginMode } from '../../store';
import * as fromApplication from '../../store/application';
import * as fromAnnotation from '../../store/annotation';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { AnnotationActions } from '../../store/annotation/annotation.actions';
import { OnlineModeActions } from '../../store/modes/online-mode/online-mode.actions';
import { ApplicationActions } from '../../store/application/application.actions';
import { DefaultComponent } from '../../component/default.component';

@Component({
  selector: 'octra-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.scss'],
})
export class LoadingComponent extends DefaultComponent implements OnInit {
  @Output() loaded: boolean;
  public text = '';
  public audioLoadingProgress = 0;
  public state = '';
  public warning = '';

  constructor(
    private langService: TranslocoService,
    public settService: SettingsService,
    public appStorage: AppStorageService,
    public audio: AudioService,
    private router: Router,
    private transcrService: TranscriptionService,
    private http: HttpClient,
    private store: Store,
    private actions: Actions
  ) {
    super();
  }

  ngOnInit() {
    this.langService
      .selectTranslate('general.please wait')
      .subscribe((translation) => {
        this.text = translation + '... ';
      });

    this.subscrManager.add(
      this.settService.audioloaded.subscribe((result) => {
        if (result.status === 'success') {
          new Promise<void>((resolve, reject) => {
            if (
              this.appStorage.useMode === LoginMode.URL &&
              this.appStorage.urlParams.transcript !== undefined
            ) {
              this.transcrService.defaultFontSize = 16;

              // load transcript file via URL
              this.http
                .get(this.appStorage.urlParams.transcript, {
                  responseType: 'text',
                })
                .subscribe(
                  (res) => {
                    this.state = 'Import transcript...';
                    let filename = this.appStorage.urlParams.transcript;
                    filename = filename.substr(filename.lastIndexOf('/') + 1);

                    const file: IFile = {
                      name: filename,
                      content: res,
                      type: 'text',
                      encoding: 'utf-8',
                    };

                    // convert par to annotJSON
                    const audioRessource = this.audio.audiomanagers[0].resource;
                    const oAudioFile = new OAudiofile();
                    oAudioFile.arraybuffer = audioRessource.arraybuffer;
                    oAudioFile.duration = audioRessource.info.duration.samples;
                    oAudioFile.name = audioRessource.info.fullname;
                    oAudioFile.sampleRate =
                      audioRessource.info.duration.sampleRate;
                    oAudioFile.size = audioRessource.size;

                    let importResult: ImportResult;
                    // find valid converter...
                    for (const converter of AppInfo.converters) {
                      if (filename.indexOf(converter.extension) > -1) {
                        // test converter
                        const tempImportResult = converter.import(
                          file,
                          oAudioFile
                        );

                        if (
                          tempImportResult !== undefined &&
                          tempImportResult.error === ''
                        ) {
                          importResult = tempImportResult;
                          break;
                        } else {
                          console.error(tempImportResult.error);
                        }
                      }
                    }

                    if (
                      !(importResult === undefined) &&
                      !(importResult.annotjson === undefined)
                    ) {
                      // conversion successfully finished
                      const newLevels: OIDBLevel[] = [];
                      const newLinks: OIDBLink[] = [];
                      for (
                        let i = 0;
                        i < importResult.annotjson.levels.length;
                        i++
                      ) {
                        newLevels.push(
                          new OIDBLevel(
                            i + 1,
                            importResult.annotjson.levels[i],
                            i
                          )
                        );
                      }
                      for (
                        let i = 0;
                        i < importResult.annotjson.links.length;
                        i++
                      ) {
                        newLinks.push(
                          new OIDBLink(i + 1, importResult.annotjson.links[i])
                        );
                      }

                      this.appStorage
                        .overwriteAnnotation(newLevels, newLinks, false)
                        .then(() => {
                          resolve();
                        })
                        .catch((error) => {
                          reject(error);
                        });
                    } else {
                      this.settService.log = 'Invalid transcript file';
                      reject('importResult is empty');
                    }
                  },
                  (err) => {
                    reject(err);
                  }
                );
            } else {
              if (this.appStorage.useMode === LoginMode.URL) {
                // overwrite
                this.transcrService.defaultFontSize = 16;

                const newLevels: OIDBLevel[] = [];
                newLevels.push(
                  new OIDBLevel(1, new OLevel('OCTRA_1', 'SEGMENT'), 1)
                );

                this.appStorage
                  .overwriteAnnotation(newLevels, [], false)
                  .then(() => {
                    resolve();
                  })
                  .catch((error) => {
                    reject(error);
                  });
              } else {
                resolve();
              }
            }
          })
            .then(() => {
              this.state = 'Audio loaded';
              const audioRessource = this.audio.audiomanagers[0].resource;
              console.log(`dispatch`);
              this.store.dispatch(
                AnnotationActions.setAudioLoaded.do({
                  mode: this.appStorage.useMode,
                  loaded: true,
                  fileName: audioRessource.info.fullname,
                  sampleRate: audioRessource.info.sampleRate,
                })
              );
            })
            .catch((error) => {
              console.error(error);
            });
        } else {
          console.error('audio not loaded');
          if (this.appStorage.useMode === LoginMode.LOCAL) {
            navigateTo(
              this.router,
              ['/user/transcr/reload-file'],
              AppInfo.queryParamsHandling
            ).catch((error) => {
              console.error(error);
            });
          }
        }
      })
    );

    afterTrue(this.store.select(fromApplication.selectIDBLoaded))
      .then(() => {
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
          console.warn(`use mode is url but no params found. Reset use mode.`);
          if (
            this.appStorage.onlineSession.loginData.userName !== undefined &&
            this.appStorage.onlineSession.loginData.userName !== '' &&
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
          navigateTo(
            this.router,
            ['/login'],
            AppInfo.queryParamsHandling
          ).catch((error) => {
            console.error(error);
          });
        } else if (this.appStorage.loggedIn) {
          if (
            this.appStorage.useMode === LoginMode.LOCAL &&
            this.audio.audiomanagers.length === 0
          ) {
            navigateTo(
              this.router,
              ['/user/transcr/reload-file'],
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
            }

            this.settService.audioloading.subscribe((progress) => {
              this.audioLoadingProgress = progress * 100;
            });

            this.settService.loadAudioFile(this.audio);
          }
        } else {
          console.warn(
            `special situation: loggedIn is undefined! useMode ${this.appStorage.useMode} url: ${this.appStorage.audioURL}`
          );
        }
      })
      .catch((error) => {
        console.error(error);
      });

    // do navigation after all is loaded
    const promises: Promise<any>[] = [];
    promises.push(
      afterTrue(this.store.select(fromAnnotation.selectAudioLoaded))
    );

    Promise.all(promises)
      .then(() => {
        this.transcrService
          .load()
          .then(() => {
            navigateTo(
              this.router,
              ['/user/transcr'],
              AppInfo.queryParamsHandling
            ).catch((error) => {
              console.error(error);
            });
          })
          .catch((err) => {
            console.error(err);
          });
      })
      .catch((error) => {
        console.error(error);
      });
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
