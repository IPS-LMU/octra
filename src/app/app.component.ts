import {Component, OnDestroy} from '@angular/core';
import {APIService} from './core/shared/service/api.service';
import {TranslateService} from '@ngx-translate/core';
import {AppStorageService} from './core/shared/service/appstorage.service';
import {SettingsService} from './core/shared/service/settings.service';
import {SubscriptionManager} from './core/obj/SubscriptionManager';
import {isNullOrUndefined, isUndefined} from 'util';
import {BugReportService, ConsoleType} from './core/shared/service/bug-report.service';
import {AppInfo} from './app.info';
import {environment} from '../environments/environment';
import {UpdateManager} from './core/shared/UpdateManager';

@Component({
  selector: 'app-octra',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.css']
})

export class AppComponent implements OnDestroy {

  public get version(): string {
    return AppInfo.version;
  }

  public get environment(): any {
    return environment;
  }

  private subscrmanager: SubscriptionManager;

  constructor(private api: APIService,
              private langService: TranslateService,
              private appStorage: AppStorageService,
              private settingsService: SettingsService,
              private bugService: BugReportService) {
    // overwrite console.log
    const oldLog = console.log;
    const serv = this.bugService;
    (() => {
      console.log = function (message) {
        serv.addEntry(ConsoleType.LOG, message);
        oldLog.apply(console, arguments);
      };
    })();

    // overwrite console.err
    const oldError = console.error;
    (() => {
      console.error = function (message) {
        serv.addEntry(ConsoleType.ERROR, message);
        oldError.apply(console, arguments);
      };
    })();

    // overwrite console.info
    const oldInfo = console.info;
    (() => {
      console.info = function (message) {
        serv.addEntry(ConsoleType.INFO, message);
        oldInfo.apply(console, arguments);
      };
    })();

    // overwrite console.warn
    const oldWarn = console.warn;
    (() => {
      console.warn = function (message) {
        serv.addEntry(ConsoleType.WARN, message);
        oldWarn.apply(console, arguments);
      };
    })();

    this.subscrmanager = new SubscriptionManager();

    // load settings
    this.subscrmanager.add(this.settingsService.settingsloaded.subscribe(
      this.onSettingsLoaded
    ));

    // after project settings loaded
    this.subscrmanager.add(this.settingsService.projectsettingsloaded.subscribe(
      () => {
        if (!this.settingsService.responsive.enabled) {
          this.setFixedWidth();
        }
      }
    ));

    this.settingsService.getApplicationSettings();

    const checkupdates = () => {
      // check for Updates
      const umanager = new UpdateManager(this.appStorage);
      umanager.checkForUpdates(this.settingsService.app_settings.octra.database.name).then((idb) => {
        this.appStorage.load(idb).then(
          () => {
            if (this.settingsService.validated) {
              console.log('loaded');
              this.onSettingsLoaded(true);
            }
            umanager.destroy();
          }
        );
      }).catch((error) => {
        console.error(error.target.error);
      });
    };

    if (isNullOrUndefined(this.settingsService.app_settings)) {
      this.subscrmanager.add(this.settingsService.app_settingsloaded.subscribe(
        () => {
          checkupdates();
        }
      ));
    } else {
      checkupdates();
    }
  }

  onSettingsLoaded = (loaded) => {
    if (loaded) {
      // settings have been loaded
      if (isNullOrUndefined(this.settingsService.app_settings)) {
        throw new Error('config.json does not exist');
      } else {
        if (this.settingsService.validated) {
          console.log('settings valid');
          if (!this.appStorage.uselocalmode) {
          }
          this.api.init(this.settingsService.app_settings.audio_server.url + 'WebTranscribe');
        }

        if (!this.settingsService.responsive.enabled) {
          this.setFixedWidth();
        }
      }

      // define languages
      const languages = this.settingsService.app_settings.octra.languages;
      const browser_lang = this.langService.getBrowserLang();

      this.langService.addLangs(languages);

      // check if browser language is available in translations
      if (isNullOrUndefined(this.appStorage.language) || this.appStorage.language === '') {
        if (!isUndefined(this.langService.getLangs().find((value) => {
            return value === browser_lang;
          }))) {
          this.langService.use(browser_lang);
        } else {
          // use first language defined as default language
          this.langService.use(languages[0]);
        }
      } else {
        this.langService.use(this.appStorage.language);
      }
    }
  };

  ngOnDestroy() {
    this.subscrmanager.destroy();
  }

  private setFixedWidth() {
    // set fixed width
    const head = document.head || document.getElementsByTagName('head')[0];
    const style = document.createElement('style');
    style.type = 'text/css';
    style.innerText = '.container {width:' + this.settingsService.responsive.fixedwidth + 'px}';
    head.appendChild(style);
  }

  test(id: string) {

    this.subscrmanager.add(
      this.api.fetchAnnotation(Number(id)).subscribe(
        (result) => {
          console.log(result);
        }
      )
    );
  }

  reset(id: string) {

    this.subscrmanager.add(
      this.api.closeSession('julian_test', Number(id), '').subscribe(
        (result) => {
          console.log(result);
        }
      )
    );
  }
}
