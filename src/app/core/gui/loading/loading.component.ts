import {Component, EventEmitter, OnDestroy, OnInit, Output} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {SubscriptionManager} from '../../obj/SubscriptionManager';
import {AppStorageService, AudioService, SettingsService, TranscriptionService} from '../../shared/service';
import {isNullOrUndefined} from 'util';
import {Router} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {IFile, ImportResult, PartiturConverter} from '../../obj/Converters';
import {OAudiofile} from '../../obj/Annotation';
import {OIDBLevel} from '../../shared/service/appstorage.service';

@Component({
  selector: 'app-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.css']
})
export class LoadingComponent implements OnInit, OnDestroy {
  @Output('loaded') loaded: boolean;
  public text = '';

  subscrmanager: SubscriptionManager = new SubscriptionManager();

  private loadedchanged: EventEmitter<boolean> = new EventEmitter<boolean>();

  private loadedtable: any = {
    projectconfig: false,
    guidelines: false,
    methods: false,
    audio: false
  };

  public progress = 0;
  public state = '';
  public warning = '';

  constructor(private langService: TranslateService,
              public settService: SettingsService,
              private appStorage: AppStorageService,
              public audio: AudioService,
              private router: Router,
              private transcrService: TranscriptionService,
              private http: HttpClient) {
  }

  ngOnInit() {
    console.log('loading component called');

    this.langService.get('general.please wait').subscribe(
      (translation) => {
        this.text = translation + '...';
      }
    );


    this.subscrmanager.add(
      this.settService.projectsettingsloaded.subscribe(
        (projectsettings) => {
          this.loadedtable.projectconfig = true;
          this.progress += 25;
          this.state = 'Project configuration loaded';
          let language = this.langService.currentLang;
          if (isNullOrUndefined(projectsettings.languages.find((x) => {
              return x === language;
            }))) {
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
              if (this.appStorage.usemode === 'url') {
                // load transcript file via URL
                this.http.get(this.appStorage.url_params['transcript'], {
                  responseType: 'text'
                }).subscribe(
                  (res) => {
                    console.log(`transcript fetched`);
                    console.log(res);

                    this.state = 'Import BAF File...';
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
                    oAudioFile.name = audioRessource.name;
                    oAudioFile.samplerate = audioRessource.info.samplerate;
                    oAudioFile.size = audioRessource.size;

                    const importResult: ImportResult = new PartiturConverter().import(file, oAudioFile);
                    if (!isNullOrUndefined(importResult) && !isNullOrUndefined(importResult.annotjson)) {
                      // conversion successfully finished
                      console.log(`Conversion from URL successfully finished`);
                      const new_levels: OIDBLevel[] = [];
                      for (let i = 0; i < importResult.annotjson.levels.length; i++) {
                        new_levels.push(new OIDBLevel(i + 1, importResult.annotjson.levels[i], i));
                      }
                      this.appStorage.overwriteAnnotation(new_levels).then(
                        () => {
                          resolve();
                        }
                      ).catch((error) => {
                        reject(error);
                      });
                    } else {
                      reject('importResult is empty');
                    }
                  },
                  (err) => {
                    reject(err);
                  }
                );
              } else {
                resolve();
              }
            }).then(() => {
              this.loadedtable.audio = true;
              this.progress += 25;
              this.state = 'Audio loaded';

              this.loadedchanged.emit(false);
            }).catch((error) => {
              console.log(error);
            });
          } else {
            console.error('audio not loaded');
            if (this.appStorage.usemode === 'local') {
              this.router.navigate(['/user/transcr/reload-file'], {
                queryParamsHandling: 'preserve'
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
            this.subscrmanager.remove(id);
            setTimeout(() => {
              if ((isNullOrUndefined(this.appStorage.agreement)
                  || isNullOrUndefined(this.appStorage.agreement[this.appStorage.user.project]) ||
                  !this.appStorage.agreement[this.appStorage.user.project]
                )
                && this.settService.projectsettings.agreement.enabled && this.appStorage.usemode === 'online') {
                this.transcrService.load().then(() => {
                  this.router.navigate(['/user/agreement'], {
                    queryParamsHandling: 'preserve'
                  });
                }).catch((err) => {
                  console.error(err);
                });
              } else {
                this.transcrService.load().then(() => {
                  this.router.navigate(['/user/transcr'], {
                    queryParamsHandling: 'preserve'
                  });
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
      console.log(`IN PROMISE`);
      if (!this.appStorage.idbloaded) {
        console.log('db not loaded');
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
      console.log(`PROMISE FINISHED`);

      if (this.appStorage.usemode !== 'url' && !this.appStorage.LoggedIn) {
        // not logged in, go back
        console.log(`NO URL ${this.appStorage.usemode}`);
        this.router.navigate(['/login'], {
          queryParamsHandling: 'preserve'
        });
      }

      this.settService.loadProjectSettings();

      if (this.appStorage.usemode === 'local' && isNullOrUndefined(this.appStorage.file)) {
        this.router.navigate(['/user/transcr/reload-file'], {
          queryParamsHandling: 'preserve'
        });
      } else {
        if (this.appStorage.usemode === 'url') {
          this.state = 'Get transcript from URL...';
          // set audio url from url params
          this.appStorage.audio_url = decodeURI(this.appStorage.url_params['audio']);
          console.log(`load audio from ${this.appStorage.audio_url}`);
          this.settService.loadAudioFile(this.audio);
        }
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
    this.router.navigate(['/login'], {
      queryParamsHandling: 'preserve'
    });
  }
}
