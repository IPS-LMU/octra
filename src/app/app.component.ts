import {AfterViewInit, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {APIService, AppStorageService, SettingsService} from './core/shared/service';
import {TranslateService} from '@ngx-translate/core';
import {SubscriptionManager} from './core/obj/SubscriptionManager';
import {BugReportService, ConsoleType} from './core/shared/service/bug-report.service';
import {AppInfo} from './app.info';
import {environment} from '../environments/environment';
import {ActivatedRoute, Router} from '@angular/router';
import {NavigationComponent} from './core/gui/navbar';
import {isNullOrUndefined} from './core/shared/Functions';

@Component({
  selector: 'app-octra',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.css']
})

export class AppComponent implements OnDestroy, OnInit, AfterViewInit {

  private subscrmanager: SubscriptionManager = new SubscriptionManager();
  @ViewChild('navigation') navigation: NavigationComponent;

  public get version(): string {
    return AppInfo.version;
  }

  public get environment(): any {
    return environment;
  }

  constructor(private api: APIService,
              private langService: TranslateService,
              public appStorage: AppStorageService,
              private settingsService: SettingsService,
              private bugService: BugReportService,
              private router: Router,
              private route: ActivatedRoute) {

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
        let debug = '';

        if (typeof debug === 'string') {
          debug = message;
        } else {
          debug = (
            arguments.length > 1
            && !(arguments[1].message === null || arguments[1].message === undefined)
          ) ? arguments[1].message : '';
        }

        const stack = (
          arguments.length > 1
          && !(arguments[1].stack === null || arguments[1].stack === undefined)
        ) ? arguments[1].stack : '';

        if (debug !== '') {
          serv.addEntry(ConsoleType.ERROR, `${debug}: ${stack}`);
        }

        oldError.apply(console, arguments);
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
  }

  ngOnInit() {

    // after project settings loaded
    this.subscrmanager.add(this.settingsService.projectsettingsloaded.subscribe(
      () => {
        if (!this.settingsService.responsive.enabled) {
          this.setFixedWidth();
        }
      }
    ));


    this.settingsService.loadApplicationSettings(this.route).then(() => {
      console.log(`Application settings loaded`);

      if (!isNullOrUndefined(this.settingsService.app_settings.octra.tracking)
        && !isNullOrUndefined(this.settingsService.app_settings.octra.tracking.active)
        && this.settingsService.app_settings.octra.tracking.active !== '') {
        this.appendTrackingCode(this.settingsService.app_settings.octra.tracking.active);
      }
    }).catch((error) => {
      console.error(error);
    });

    this.route.fragment.subscribe((fragment) => {
      switch (fragment) {
        case('feedback'):
          this.navigation.openBugReport();
          break;
      }
    });
  }

  ngAfterViewInit() {
  }

  ngOnDestroy() {
    this.subscrmanager.destroy();
  }

  test(id: string) {
    this.api.fetchAnnotation(Number(id)).then((json) => {
      console.log(json);
    }).catch((error) => {
      console.error(error);
    });
  }

  reset(id: string) {
    this.api.closeSession('julian_test', Number(id), '').then((json) => {
      console.log(json);
    }).catch((error) => {
      console.error(error);
    });
  }

  queryParamsSet(route: ActivatedRoute): boolean {
    const params = this.route.snapshot.queryParams;
    return (
      params.hasOwnProperty('audio') &&
      params.hasOwnProperty('embedded')
    );
  }

  private setFixedWidth() {
    // set fixed width
    const head = document.head || document.getElementsByTagName('head')[0];
    const style = document.createElement('style');
    style.type = 'text/css';
    style.innerText = '.container {width:' + this.settingsService.responsive.fixedwidth + 'px}';
    head.appendChild(style);
  }

  private appendTrackingCode(type: string) {

    if (type === 'matomo') {
      if (!isNullOrUndefined(this.settingsService.app_settings.octra.tracking.matomo)
        && !isNullOrUndefined(this.settingsService.app_settings.octra.tracking.matomo.host)
        && !isNullOrUndefined(this.settingsService.app_settings.octra.tracking.matomo.siteID)) {
        const piwikSettings = this.settingsService.app_settings.octra.tracking.matomo;

        const trackingCode = `
<!-- Piwik -->
<script type="text/javascript">
    if(window.location.host.lastIndexOf("localhost")==-1){ //execute if not on debug system
        var _paq = _paq || [];
        _paq.push([ 'trackPageView' ]);
        _paq.push([ 'enableLinkTracking' ]);
        (function() {
            //var u = (("https:" == document.location.protocol) ? "https" : "http")
            var u = "${piwikSettings.host}";
            _paq.push([ 'setTrackerUrl', u + 'piwik.php' ]);
            _paq.push([ 'setSiteId', ${piwikSettings.siteID}]);
            var d = document;
            var g = d.createElement('script');
            var s = d.getElementsByTagName('script')[0];
            g.type = 'text/javascript';
            g.defer = true;
            g.async = true;
            g.src = u + 'piwik.js';
            s.parentNode.insertBefore(g, s);
            console.log("Sent statistics to piwik");
        })();
    }
</script> `;

        jQuery(trackingCode).insertAfter('main');
      } else {
        console.error(`attributes for piwik tracking in appconfig.json are invalid.`);
      }
    } else {
      console.error(`tracking type ${type} is not supported.`);
    }
  }
}
