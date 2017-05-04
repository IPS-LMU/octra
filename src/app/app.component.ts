import {Component, OnDestroy} from '@angular/core';
import {APIService} from './service/api.service';
import {TranslateService} from '@ngx-translate/core';
import {SessionService} from './service/session.service';
import {SettingsService} from './service/settings.service';
import {SubscriptionManager} from './shared/SubscriptionManager';
import {isNullOrUndefined, isUndefined} from 'util';
import {BugReportService, ConsoleType} from './service/bug-report.service';
import {AppInfo} from './app.info';

@Component({
  selector: 'app-octra',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.css']
})

export class AppComponent implements OnDestroy {
  public get version(): string {
    return AppInfo.version;
  }

  private subscrmanager: SubscriptionManager;

  constructor(private api: APIService,
              private langService: TranslateService,
              private sessService: SessionService,
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

    if (this.settingsService.validated) {
      this.onSettingsLoaded();
    }
  }

  onSettingsLoaded = () => {
    // settings have been loaded
    if (isNullOrUndefined(this.settingsService.app_settings)) {
      throw new Error('config.json not set correctly');
    } else {
      if (this.settingsService.validated) {
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
    if (isNullOrUndefined(this.sessService.language) || this.sessService.language === '') {
      if (!isUndefined(this.langService.getLangs().find((value) => {
          return value === browser_lang;
        }))) {
        this.langService.use(browser_lang);
      } else {
        // use first language defined as default language
        this.langService.use(languages[0]);
      }
    } else {
      this.langService.use(this.sessService.language);
    }

  }

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
          console.log(result.json());
        }
      )
    );
  }

  reset(id: string) {

    this.subscrmanager.add(
      this.api.closeSession('julian_test', Number(id), '').subscribe(
        (result) => {
          console.log(result.json());
        }
      )
    );
  }

  fetching(id: string) {
    let id_num = Number(id);
    let counter = 0;
    setInterval(() => {
      counter++;
      --id_num;
      if (counter < 10) {
        this.subscrmanager.add(
          this.api.fetchAnnotation(id_num).subscribe(
            (result) => {
              const json = result.json();

              if (json.hasOwnProperty('data') && json.data.hasOwnProperty('annotator')
                && json.data.annotator === 'julian_test') {
                console.log('annotated found');
                console.log(result.json());
              }
            }
          )
        );
      }
    }, 3000);
  }
}
