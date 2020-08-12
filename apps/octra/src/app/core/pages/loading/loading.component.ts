import {HttpClient} from '@angular/common/http';
import {Component, EventEmitter, OnDestroy, OnInit, Output} from '@angular/core';
import {Router} from '@angular/router';
import {TranslocoService} from '@ngneat/transloco';
import {AppInfo} from '../../../app.info';
import {Functions, isUnset, SubscriptionManager} from '@octra/utilities';
import {AudioService, SettingsService, TranscriptionService} from '../../shared/service';
import {AppStorageService, OIDBLevel} from '../../shared/service/appstorage.service';
import {IFile, ImportResult, OAudiofile, OLevel} from '@octra/annotation';
import {LoginMode} from '../../store';
import * as fromLoginActions from '../../store/login/login.actions';
import {Store} from '@ngrx/store';

@Component({
  selector: 'octra-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.css']
})
export class LoadingComponent implements OnInit, OnDestroy {
  @Output() loaded: boolean;
  public text = '';
  public progress = 0;
  public audioLoadingProgress = 0;
  public state = '';
  public warning = '';
  private subscrmanager: SubscriptionManager = new SubscriptionManager();
  private loadedchanged: EventEmitter<boolean> = new EventEmitter<boolean>();
  private loadedtable: any = {
    projectconfig: false,
    guidelines: false,
    methods: false,
    audio: false
  };

  constructor(private langService: TranslocoService,
              public settService: SettingsService,
              public appStorage: AppStorageService,
              public audio: AudioService,
              private router: Router,
              private transcrService: TranscriptionService,
              private http: HttpClient,
              private store: Store) {
  }

  ngOnInit() {
    new Promise<void>((resolve, reject) => {
      if (this.settService.isDBLoadded) {
        resolve();
      } else {
        this.subscrmanager.add(this.settService.dbloaded.subscribe(
          () => {
            resolve();
          }));
      }
    }).then(() => {
      this.langService.selectTranslate('general.please wait').subscribe(
        (translation) => {
          this.text = translation + '... ';
        }
      );
    }).catch((error) => {
    });

    this.subscrmanager.add(
      this.settService.projectsettingsloaded.subscribe(
        (projectsettings) => {
          this.loadedtable.projectconfig = true;
          this.progress += 25;
          this.state = 'Project configuration loaded';
          let language = this.langService.getActiveLang();

          const found = projectsettings.languages.find((x) => {
            return x === language;
          });
          if ((found === null || found === undefined)) {
            // fall back to first defined language
            language = projectsettings.languages[0];
          }
          this.settService.loadGuidelines(this.appStorage.language, './config/localmode/guidelines/guidelines_' + language + '.json');

          this.loadedchanged.emit(false);
        }
      )
    );

    this.subscrmanager.add(
      this.settService.guidelinesloaded.subscribe(
        () => {
          this.loadedtable.guidelines = true;
          this.progress += 25;
          this.state = 'Guidelines loaded';
          this.loadedchanged.emit(false);
        }
      )
    );

    this.subscrmanager.add(
      this.settService.validationmethodloaded.subscribe(
        () => {
          this.loadedtable.methods = true;
          this.progress += 25;
          this.state = 'Methods loaded';
          if (!this.loadedtable.audio) {
            this.state = 'Load Audio...';
          }
          this.loadedchanged.emit(false);
        }
      )
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
                      for (let i = 0; i < importResult.annotjson.levels.length; i++) {
                        newLevels.push(new OIDBLevel(i + 1, importResult.annotjson.levels[i], i));
                      }

                      this.appStorage.overwriteAnnotation(newLevels, false).then(
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

                  this.appStorage.overwriteAnnotation(newLevels, false).then(
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
              this.loadedtable.audio = true;
              this.state = 'Audio loaded';

              this.loadedchanged.emit(false);
            }).catch((error) => {
              console.error(error);
            });
          } else {
            console.error('audio not loaded');
            if (this.appStorage.useMode === LoginMode.LOCAL) {
              Functions.navigateTo(this.router, ['/user/transcr/reload-file'], AppInfo.queryParamsHandling).catch((error) => {
                console.error(error);
              });
            }
          }
        }
      )
    );

    const id = this.subscrmanager.add(
      this.loadedchanged.subscribe(
        () => {
          if (
            this.loadedtable.guidelines
            && this.loadedtable.projectconfig
            && this.loadedtable.methods
            && this.loadedtable.audio
          ) {
            this.subscrmanager.removeById(id);

            this.transcrService.load().then(() => {
              Functions.navigateTo(this.router, ['/user/transcr'], AppInfo.queryParamsHandling).catch((error) => {
                console.error(error);
              });
            }).catch((err) => {
              console.error(err);
            });
          }
        }
      )
    );

    new Promise<void>((resolve, reject) => {
      if (!this.appStorage.idbLoaded) {
        this.subscrmanager.add(this.appStorage.loaded.subscribe(() => {
          },
          (error) => {
            reject(error);
          },
          () => {
            resolve();
          }));
      } else {
        resolve();
      }
    }).then(() => {
      if (!isUnset(this.appStorage.urlParams) && this.appStorage.urlParams.hasOwnProperty('audio') && this.appStorage.urlParams.audio !== ''
        && !isUnset(this.appStorage.urlParams.audio)) {
        this.store.dispatch(fromLoginActions.loginURLParameters({
          urlParams: this.appStorage.urlParams
        }));
      } else if (this.appStorage.useMode === LoginMode.URL) {
        // url mode set, but no params => change mode
        console.warn(`use mode is url but no params found. Reset use mode.`);
        if (!isUnset(this.appStorage.onlineSession.id) && this.appStorage.onlineSession.id !== ''
          && (isUnset(this.appStorage.sessionfile))) {
          this.store.dispatch(fromLoginActions.setMode({
            mode: LoginMode.ONLINE
          }));
        } else {
          this.store.dispatch(fromLoginActions.setMode({
            mode: LoginMode.LOCAL
          }));
        }
        this.store.dispatch(fromLoginActions.logout());
      }

      if (this.appStorage.useMode !== LoginMode.URL && !this.appStorage.loggedIn) {
        // not logged in, go back
        Functions.navigateTo(this.router, ['/login'], AppInfo.queryParamsHandling).catch((error) => {
          console.error(error);
        });
      } else if (this.appStorage.loggedIn) {
        this.settService.loadProjectSettings().catch((error) => {
          console.error(error);
        });

        if (this.appStorage.useMode === LoginMode.LOCAL && this.audio.audiomanagers.length === 0) {
          Functions.navigateTo(this.router, ['/user/transcr/reload-file'], AppInfo.queryParamsHandling).catch((error) => {
            console.error(error);
          });
        } else {
          if (this.appStorage.useMode === LoginMode.URL) {
            this.state = 'Get transcript from URL...';
            // set audio url from url params
            this.store.dispatch(fromLoginActions.setAudioURL({
              audioURL: decodeURI(this.appStorage.urlParams.audio)
            }));
          }

          console.log(`mode is ${this.appStorage.useMode} and audioSrc is ${this.appStorage.audioURL}`);

          this.settService.audioloading.subscribe(
            (progress) => {
              this.audioLoadingProgress = progress * 25;
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
  }

  ngOnDestroy() {
    this.subscrmanager.destroy();
  }

  retry() {
    location.reload();
  }

  goBack() {
    this.appStorage.clearSession();
    Functions.navigateTo(this.router, ['/login'], AppInfo.queryParamsHandling).catch((error) => {
      console.error(error);
    });
  }
}
