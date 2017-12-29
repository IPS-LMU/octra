import {Component, EventEmitter, OnDestroy, OnInit, Output} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {SubscriptionManager} from '../../obj/SubscriptionManager';
import {SettingsService} from '../../shared/service/settings.service';
import {AppStorageService} from '../../shared/service/appstorage.service';
import {isNullOrUndefined} from 'util';
import {AudioService} from '../../shared/service/audio.service';
import {ActivatedRoute, Router} from '@angular/router';
import {TranscriptionService} from '../../shared/service/transcription.service';

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
              private route: ActivatedRoute) {
  }

  ngOnInit() {

    const process = () => {
      if (this.appStorage.uselocalmode && isNullOrUndefined(this.appStorage.file)) {
        this.router.navigate(['/user/transcr/reload-file'], {
          queryParamsHandling: 'preserve'
        });
      } else {
        this.settService.loadAudioFile(this.audio);
      }
    };

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
            this.loadedtable.audio = true;
            this.progress += 25;
            this.state = 'Audio loaded';
            this.loadedchanged.emit(false);
          } else {
            console.error('audio not loaded');
            if (this.appStorage.uselocalmode) {
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
                && this.settService.projectsettings.agreement.enabled && !this.appStorage.uselocalmode) {
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

    this.settService.loadProjectSettings();

    if (this.queryParamsSet()) {
      const audio_url = this.route.snapshot.queryParams['audio'];
      const transcript_url = this.route.snapshot.queryParams['transcript'];
      const embedded = this.route.snapshot.queryParams['embedded'];

      setTimeout(() => {
        window.parent.postMessage({
          result: transcript_url
        }, '*');
        console.log('send message');
      }, 3000);

      /*
      if (!this.appStorage.idbloaded) {
        this.settService.app_settings.octra.database.name = 'url';
        console.log('load db ' + this.settService.app_settings.octra.database.name);
        this.subscrmanager.add(this.appStorage.loaded.subscribe(() => {
          },
          (error) => {
            console.error(error);
          },
          () => {
            process();
          }));
      }
      */
    } else {

      if (!this.appStorage.idbloaded) {
        console.log('db not loaded');
        this.subscrmanager.add(this.appStorage.loaded.subscribe(() => {
          },
          (error) => {
            console.error(error);
          },
          () => {
            process();
          }));
      } else {
        process();
      }

      if (!this.appStorage.LoggedIn) {
        this.router.navigate(['/login'], {
          queryParamsHandling: 'preserve'
        });
      }
    }
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

  queryParamsSet(): boolean {
    const params = this.route.snapshot.queryParams;
    return (
      params.hasOwnProperty('audio') &&
      params.hasOwnProperty('transcript') &&
      params.hasOwnProperty('embedded')
    );
  }
}
