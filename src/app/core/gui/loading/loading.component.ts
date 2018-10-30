import {Component, EventEmitter, OnDestroy, OnInit, Output} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {SubscriptionManager} from '../../obj/SubscriptionManager';
import {AppStorageService, AudioService, SettingsService, TranscriptionService} from '../../shared/service';
import {ActivatedRoute, Router} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {IFile, ImportResult} from '../../obj/Converters';
import {OAudiofile, OLevel} from '../../obj/Annotation';
import {OIDBLevel} from '../../shared/service/appstorage.service';
import {AppInfo} from '../../../app.info';
import {Functions} from '../../shared/Functions';

@Component({
  selector: 'app-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.css']
})
export class LoadingComponent implements OnInit, OnDestroy {
  @Output('loaded') loaded: boolean;
  public text = '';

  subscrmanager: SubscriptionManager = new SubscriptionManager();
  public progress = 0;
  public state = '';
  public warning = '';
  private loadedchanged: EventEmitter<boolean> = new EventEmitter<boolean>();
  private loadedtable: any = {
    projectconfig: false,
    guidelines: false,
    methods: false,
    audio: false
  };

  constructor(private langService: TranslateService,
              public settService: SettingsService,
              private appStorage: AppStorageService,
              public audio: AudioService,
              private router: Router,
              private transcrService: TranscriptionService,
              private http: HttpClient,
              private route: ActivatedRoute) {
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
      this.langService.get('general.please wait').subscribe(
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
          let language = this.langService.currentLang;

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
        (guidelines) => {
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
              if (this.appStorage.usemode === 'url' && this.appStorage.url_params['transcript'] !== null) {
                this.transcrService.defaultFontSize = 16;

                console.log(`LOAD TRANSCRIPT`);
                // load transcript file via URL
                this.http.get(this.appStorage.url_params['transcript'], {
                  responseType: 'text'
                }).subscribe(
                  (res) => {

                    this.state = 'Import transcript...';
                    let filename = this.appStorage.url_params['transcript'];
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
                    oAudioFile.samplerate = audioRessource.info.samplerate;
                    oAudioFile.size = audioRessource.size;

                    let importResult: ImportResult;
                    // find valid converter...
                    for (let i = 0; i < AppInfo.converters.length; i++) {
                      const converter = AppInfo.converters[i];
                      if (filename.indexOf(converter.extension)) {
                        // test converter
                        importResult = converter.import(file, oAudioFile);

                        if (!(importResult === null || importResult === undefined)) {
                          break;
                        }
                      }
                    }

                    if (!(importResult === null || importResult === undefined) && !(importResult.annotjson === null || importResult.annotjson === undefined)) {
                      // conversion successfully finished
                      const new_levels: OIDBLevel[] = [];
                      for (let i = 0; i < importResult.annotjson.levels.length; i++) {
                        new_levels.push(new OIDBLevel(i + 1, importResult.annotjson.levels[i], i));
                      }
                      this.appStorage.overwriteAnnotation(new_levels, false).then(
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
                if (this.appStorage.usemode === 'url') {
                  // overwrite
                  this.transcrService.defaultFontSize = 16;

                  const new_levels: OIDBLevel[] = [];
                  new_levels.push(new OIDBLevel(1, new OLevel('OCTRA_1', 'SEGMENT'), 1));

                  this.appStorage.overwriteAnnotation(new_levels, false).then(
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
              this.progress += 25;
              this.state = 'Audio loaded';

              this.loadedchanged.emit(false);
            }).catch((error) => {
              console.error(error);
            });
          } else {
            console.error('audio not loaded');
            if (this.appStorage.usemode === 'local') {
              Functions.navigateTo(this.router, ['/user/transcr/reload-file'], AppInfo.queryParamsHandling);
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
            this.subscrmanager.remove(id);
            setTimeout(() => {
              if (((this.appStorage.agreement === null || this.appStorage.agreement === undefined)
                  || (this.appStorage.agreement[this.appStorage.user.project] === null || this.appStorage.agreement[this.appStorage.user.project] === undefined) ||
                  !this.appStorage.agreement[this.appStorage.user.project]
                )
                && this.settService.projectsettings.agreement.enabled && this.appStorage.usemode === 'online') {
                this.transcrService.load().then(() => {
                  Functions.navigateTo(this.router, ['/user/agreement'], AppInfo.queryParamsHandling);
                }).catch((err) => {
                  console.error(err);
                });
              } else {
                this.transcrService.load().then(() => {
                  Functions.navigateTo(this.router, ['/user/transcr'], AppInfo.queryParamsHandling);
                }).catch((err) => {
                  console.error(err);
                });
              }
            }, 500);
          }
        }
      )
    );

    new Promise<void>((resolve, reject) => {
      if (!this.appStorage.idbloaded) {
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

      if (this.appStorage.url_params.hasOwnProperty('audio') && this.appStorage.url_params['audio'] !== ''
        && !(this.appStorage.url_params['audio'] === null || this.appStorage.url_params['audio'] === undefined)) {
        this.appStorage.usemode = 'url';
        this.appStorage.LoggedIn = false;
      } else if (this.appStorage.usemode === 'url') {
        // url mode set, but no params => change mode
        console.warn(`use mode is url but no params found. Reset use mode.`);
        this.appStorage.usemode = (!(this.appStorage.user.id === null || this.appStorage.user.id === undefined) && this.appStorage.user.id !== ''
          && ((this.appStorage.sessionfile === null || this.appStorage.sessionfile === undefined)))
          ? 'online' : 'local';
        this.appStorage.LoggedIn = false;
      }

      if (this.appStorage.usemode !== 'url' && !this.appStorage.LoggedIn) {
        // not logged in, go back
        Functions.navigateTo(this.router, ['/login'], AppInfo.queryParamsHandling);
      }

      this.settService.loadProjectSettings();

      if (this.appStorage.usemode === 'local' && (this.appStorage.file === null || this.appStorage.file === undefined)) {
        Functions.navigateTo(this.router, ['/user/transcr/reload-file'], AppInfo.queryParamsHandling);
      } else {
        if (this.appStorage.usemode === 'url') {
          if (this.appStorage.usemode === 'url') {
            this.state = 'Get transcript from URL...';
            // set audio url from url params
            this.appStorage.audio_url = decodeURI(this.appStorage.url_params['audio']);
          }
        }
        this.settService.loadAudioFile(this.audio);
      }
    }).catch((error) => {
      console.error(error);
    });
  }

  ngOnDestroy() {
    this.subscrmanager.destroy();
  }

  retry() {
    alert('retry!');
    location.reload();
  }

  goBack() {
    this.appStorage.clearSession();
    Functions.navigateTo(this.router, ['/login'], AppInfo.queryParamsHandling);
  }
}
