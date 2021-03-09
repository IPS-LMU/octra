import {HttpClient} from '@angular/common/http';
import {Component, OnDestroy, OnInit, Output} from '@angular/core';
import {Router} from '@angular/router';
import {TranslocoService} from '@ngneat/transloco';
import {AppInfo} from '../../../app.info';
import {afterTrue, isUnset, navigateTo, SubscriptionManager} from '@octra/utilities';
import {AudioService, SettingsService, TranscriptionService} from '../../shared/service';
import {AppStorageService} from '../../shared/service/appstorage.service';
import {IFile, ImportResult, Level, OAudiofile, OIDBLevel, OIDBLink, OLevel} from '@octra/annotation';
import {LoginMode} from '../../store';
import * as fromTranscription from '../../store/transcription';
import * as fromApplication from '../../store/application';
import {Store} from '@ngrx/store';
import {Actions} from '@ngrx/effects';
import {TranscriptionActions} from '../../store/transcription/transcription.actions';
import {LoginActions} from '../../store/login/login.actions';

@Component({
  selector: 'octra-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.css']
})
export class LoadingComponent implements OnInit, OnDestroy {
  @Output() loaded: boolean;
  public text = '';
  public audioLoadingProgress = 0;
  public state = '';
  public warning = '';
  private subscrmanager: SubscriptionManager = new SubscriptionManager();

  constructor(private langService: TranslocoService,
              public settService: SettingsService,
              public appStorage: AppStorageService,
              public audio: AudioService,
              private router: Router,
              private transcrService: TranscriptionService,
              private http: HttpClient,
              private store: Store,
              private actions: Actions) {
  }

  ngOnInit() {
    this.langService.selectTranslate('general.please wait').subscribe(
      (translation) => {
        this.text = translation + '... ';
      }
    );

    this.subscrmanager.add(
      this.settService.audioloaded.subscribe(
        (result) => {
          if (result.status === 'success') {
            new Promise<void>((resolve, reject) => {
              if (this.appStorage.useMode === LoginMode.URL && this.appStorage.urlParams.transcript !== null) {
                this.transcrService.defaultFontSize = 16;

                // load transcript file via URL
                this.http.get(this.appStorage.urlParams.transcript, {
                  responseType: 'text'
                }).subscribe(
                  (res) => {

                    this.state = 'Import transcript...';
                    let filename = this.appStorage.urlParams.transcript;
                    filename = filename.substr(filename.lastIndexOf('/') + 1);

                    const file: IFile = {
                      name: filename,
                      content: res,
                      type: 'text',
                      encoding: 'utf-8'
                    };

                    // convert par to annotJSON
                    const audioRessource = this.audio.audiomanagers[0].ressource;
                    const oAudioFile = new OAudiofile();
                    oAudioFile.arraybuffer = audioRessource.arraybuffer;
                    oAudioFile.duration = audioRessource.info.duration.samples;
                    oAudioFile.name = audioRessource.info.fullname;
                    oAudioFile.sampleRate = audioRessource.info.duration.sampleRate;
                    oAudioFile.size = audioRessource.size;

                    let importResult: ImportResult;
                    // find valid converter...
                    for (const converter of AppInfo.converters) {
                      if (filename.indexOf(converter.extension) > -1) {
                        // test converter
                        const tempImportResult = converter.import(file, oAudioFile);

                        if (!isUnset(tempImportResult) && tempImportResult.error === '') {
                          importResult = tempImportResult;
                          break;
                        } else {
                          console.error(tempImportResult.error);
                        }
                      }
                    }

                    if (!(importResult === null || importResult === undefined)
                      && !(importResult.annotjson === null || importResult.annotjson === undefined)) {
                      // conversion successfully finished
                      const newLevels: OIDBLevel[] = [];
                      const newLinks: OIDBLink[] = [];
                      for (let i = 0; i < importResult.annotjson.levels.length; i++) {
                        newLevels.push(new OIDBLevel(i + 1, importResult.annotjson.levels[i], i));
                      }
                      for (let i = 0; i < importResult.annotjson.links.length; i++) {
                        newLinks.push(new OIDBLink(i + 1, importResult.annotjson.links[i]));
                      }

                      this.appStorage.overwriteAnnotation(newLevels, newLinks, false).then(
                        () => {
                          resolve();
                        }
                      ).catch((error) => {
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
                  newLevels.push(new OIDBLevel(1, new OLevel('OCTRA_1', 'SEGMENT'), 1));

                  this.appStorage.overwriteAnnotation(newLevels, [], false).then(
                    () => {
                      resolve();
                    }
                  ).catch((error) => {
                    reject(error);
                  });
                } else {
                  resolve();
                }
              }
            }).then(() => {
              this.state = 'Audio loaded';
              this.store.dispatch(TranscriptionActions.setAudioLoaded({
                loaded: true
              }));
            }).catch((error) => {
              console.error(error);
            });
          } else {
            console.error('audio not loaded');
            if (this.appStorage.useMode === LoginMode.LOCAL) {
              navigateTo(this.router, ['/user/transcr/reload-file'], AppInfo.queryParamsHandling).catch((error) => {
                console.error(error);
              });
            }
          }
        }
      )
    );

    afterTrue(this.store.select(fromApplication.selectIDBLoaded)).then(() => {
      Level.counter = this.appStorage.snapshot.annotation.levelCounter;
      if (!isUnset(this.appStorage.urlParams) && this.appStorage.urlParams.hasOwnProperty('audio') && this.appStorage.urlParams.audio !== ''
        && !isUnset(this.appStorage.urlParams.audio)) {
        this.store.dispatch(LoginActions.loginURLParameters({
          urlParams: this.appStorage.urlParams
        }));
      } else if (this.appStorage.useMode === LoginMode.URL) {
        // url mode set, but no params => change mode
        console.warn(`use mode is url but no params found. Reset use mode.`);
        if (!isUnset(this.appStorage.onlineSession.loginData.id) && this.appStorage.onlineSession.loginData.id !== ''
          && (isUnset(this.appStorage.sessionfile))) {
          this.store.dispatch(LoginActions.setMode({
            mode: LoginMode.ONLINE
          }));
        } else {
          this.store.dispatch(LoginActions.setMode({
            mode: LoginMode.LOCAL
          }));
        }
        this.store.dispatch(LoginActions.logout({clearSession: true}));
      }

      if (this.appStorage.useMode !== LoginMode.URL && !this.appStorage.loggedIn) {
        // not logged in, go back
        navigateTo(this.router, ['/login'], AppInfo.queryParamsHandling).catch((error) => {
          console.error(error);
        });
      } else if (this.appStorage.loggedIn) {
        if (this.appStorage.useMode === LoginMode.LOCAL && this.audio.audiomanagers.length === 0) {
          navigateTo(this.router, ['/user/transcr/reload-file'], AppInfo.queryParamsHandling).catch((error) => {
            console.error(error);
          });
        } else {
          if (this.appStorage.useMode === LoginMode.URL) {
            this.state = 'Get transcript from URL...';
            // set audio url from url params
            this.store.dispatch(LoginActions.setAudioURL({
              audioURL: decodeURI(this.appStorage.urlParams.audio)
            }));
          }

          this.settService.audioloading.subscribe(
            (progress) => {
              this.audioLoadingProgress = progress * 100;
            }
          );

          this.settService.loadAudioFile(this.audio);
        }
      } else {
        console.warn(`special situation: loggedIn is null! useMode ${this.appStorage.useMode} url: ${this.appStorage.audioURL}`);
      }
    }).catch((error) => {
      console.error(error);
    });

    // do navigation after all is loaded
    const promises: Promise<any>[] = [];
    promises.push(afterTrue(this.store.select(fromTranscription.selectAudioLoaded)));

    Promise.all(promises).then(() => {
      this.transcrService.load().then(() => {
        navigateTo(this.router, ['/user/transcr'], AppInfo.queryParamsHandling).catch((error) => {
          console.error(error);
        });
      }).catch((err) => {
        console.error(err);
      });
    }).catch((error) => {
      console.error(error);
    });
  }

  ngOnDestroy() {
    this.subscrmanager.destroy();
  }

  retry() {
    location.reload();
  }

  goBack() {
    this.appStorage.logout();
    navigateTo(this.router, ['/login'], AppInfo.queryParamsHandling).catch((error) => {
      console.error(error);
    });
  }
}
