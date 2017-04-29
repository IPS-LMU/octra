import {Component, OnDestroy} from '@angular/core';
import {APIService} from './service/api.service';
import {TranslateService} from '@ngx-translate/core';
import {SessionService} from './service/session.service';
import {SettingsService} from './service/settings.service';
import {SubscriptionManager} from './shared/SubscriptionManager';
import {isNullOrUndefined, isUndefined} from 'util';

@Component({
  selector: 'app-octra',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.css']
})

export class AppComponent implements OnDestroy {
  version = '1.1.1';

  private subscrmanager: SubscriptionManager;

  constructor(private api: APIService,
              private langService: TranslateService,
              private sessService: SessionService,
              private settingsService: SettingsService) {
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
    console.log('test: ' + id);

    this.subscrmanager.add(
      this.api.fetchAnnotation(Number(id)).subscribe(
        (result) => {
          console.log(result.json());
        }
      )
    );
  }

  reset(id: string) {
    console.log('reset: ' + id);

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
        console.log('fetch ID ' + id_num);
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
