import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { LocalStorageService, SessionStorageService } from 'ngx-webstorage';
import { ApplicationActions } from '../application/application.actions';
import { OnlineModeActions } from '../modes/online-mode/online-mode.actions';
import { LocalModeActions } from '../modes/local-mode/local-mode.actions';
import { catchError, forkJoin, map, of, Subject, tap, timer } from 'rxjs';
import { exhaustMap, withLatestFrom } from 'rxjs/operators';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { APIActions } from '../api';
import { getBrowserLang, TranslocoService } from '@ngneat/transloco';
import { uniqueHTTPRequest } from '@octra/ngx-utilities';
import { ConfigurationService } from '../../shared/service/configuration.service';
import { findElements, getAttr } from '@octra/utilities';
import { AppConfigSchema } from '../../schemata/appconfig.schema';
import { AppInfo } from '../../../app.info';
import {
  BugReportService,
  ConsoleType,
} from '../../shared/service/bug-report.service';
import { AppSettings, ASRLanguage } from '../../obj';
import { IDBActions } from '../idb/idb.actions';
import { AppStorageService } from '../../shared/service/appstorage.service';
import { AsrService } from '../../shared/service/asr.service';
import { SettingsService } from '../../shared/service';
import { LoginMode, RootState } from '../index';
import { AuthenticationActions } from '../authentication';
import { RoutingService } from '../../shared/service/routing.service';

@Injectable({
  providedIn: 'root',
})
export class ApplicationEffects {
  initApp$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(ApplicationActions.initApplication.do),
        tap(() => {
          this.transloco.setActiveLang('en');
          this.store.dispatch(ApplicationActions.loadLanguage.do());
          this.store.dispatch(ApplicationActions.loadSettings.do());

          this.initConsoleLogging();
        })
      ),
    { dispatch: false }
  );

  loadSettings$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ApplicationActions.loadSettings.do),
      exhaustMap((a) => {
        return forkJoin([
          uniqueHTTPRequest(
            this.http,
            false,
            {
              responseType: 'json',
            },
            'config/appconfig.json',
            undefined
          ),
        ]).pipe(
          map(([appconfig]) => {
            const validation = this.configurationService.validateJSON(
              appconfig,
              AppConfigSchema
            );

            if (validation.length === 0) {
              return ApplicationActions.loadSettings.success({
                settings: appconfig,
              });
            } else {
              return ApplicationActions.loadSettings.fail({
                error: new HttpErrorResponse({
                  error: new Error('Appconfig is invalid.'),
                }),
              });
            }
            return ApplicationActions.changeLanguage.success();
          }),
          catchError((err: HttpErrorResponse) => {
            return of(
              ApplicationActions.loadSettings.fail({
                error: err,
              })
            );
          })
        );
      })
    )
  );

  loadASRSettings$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ApplicationActions.loadASRSettings.do),
      exhaustMap(({ settings }) => {
        // load information from BASWebservices ASR page
        if (
          settings.octra.plugins.asr.asrInfoURL !== undefined &&
          typeof settings.octra.plugins.asr.asrInfoURL === 'string' &&
          settings.octra.plugins.asr.asrInfoURL
        ) {
          return this.http
            .get(settings.octra.plugins.asr.asrInfoURL, {
              responseType: 'text',
            })
            .pipe(
              map((result) => {
                const document = new DOMParser().parseFromString(
                  result,
                  'text/html'
                );
                const basTable = document.getElementById(
                  '#bas-asr-service-table'
                );
                const basASRInfoContainers = findElements(
                  basTable,
                  '.bas-asr-info-container'
                );

                const asrInfos: {
                  name: string;
                  maxSignalDuration: number;
                  maxSignalSize: number;
                  quotaPerMonth: number;
                  termsURL: string;
                  dataStoragePolicy: string;
                  knownIssues: string;
                }[] = [];

                for (const basASRInfoContainer of basASRInfoContainers) {
                  const isStringNumber = (str: string) => !isNaN(Number(str));
                  const sanitizeNumberValue = (el: any, attr: string) => {
                    if (el[attr] !== undefined && isStringNumber(el[attr])) {
                      el[attr] = Number(el[attr]);
                    } else {
                      el[attr] = undefined;
                    }
                  };
                  const sanitizeStringValue = (el: any, attr: string) => {
                    if (
                      el[attr] !== undefined &&
                      typeof el[attr] === 'string'
                    ) {
                      el[attr] = el[attr].replace(/[\n\t\r]+/g, '');
                    } else {
                      el[attr] = undefined;
                    }
                  };

                  const maxSignalDurationSpans = findElements(
                    basASRInfoContainer,
                    '.bas-asr-info-max-signal-duration-seconds'
                  );
                  const maxSignalSizeSpans = findElements(
                    basASRInfoContainer,
                    '.bas-asr-info-max-signal-size-megabytes'
                  );
                  const quotaPerMonthSpans = findElements(
                    basASRInfoContainer,
                    '.bas-asr-info-quota-per-month-seconds'
                  );
                  const termsURLSpans = findElements(
                    basASRInfoContainer,
                    '.bas-asr-info-eula-link'
                  );
                  const dataStoragePolicySpans = findElements(
                    basASRInfoContainer,
                    '.bas-asr-info-data-storage-policy'
                  );
                  const knownIssuesSpans = findElements(
                    basASRInfoContainer,
                    '.bas-asr-info-known-issues'
                  );

                  const newElem: any = {
                    name: getAttr(
                      basASRInfoContainer,
                      'data-bas-asr-info-provider-name'
                    ),
                    maxSignalDuration:
                      maxSignalDurationSpans.length > 0
                        ? getAttr(maxSignalDurationSpans[0], 'data-value')
                        : undefined,
                    maxSignalSize:
                      maxSignalSizeSpans.length > 0
                        ? getAttr(maxSignalSizeSpans[0], 'data-value')
                        : undefined,
                    quotaPerMonth:
                      quotaPerMonthSpans.length > 0
                        ? getAttr(quotaPerMonthSpans[0], 'data-value')
                        : undefined,
                    termsURL:
                      termsURLSpans.length > 0
                        ? getAttr(termsURLSpans[0], 'href')
                        : undefined,
                    dataStoragePolicy:
                      dataStoragePolicySpans.length > 0
                        ? dataStoragePolicySpans[0].innerText
                        : undefined,
                    knownIssues:
                      knownIssuesSpans.length > 0
                        ? knownIssuesSpans[0].innerText
                        : undefined,
                  };

                  sanitizeNumberValue(newElem, 'maxSignalDuration');
                  sanitizeNumberValue(newElem, 'maxSignalSize');
                  sanitizeNumberValue(newElem, 'quotaPerMonth');
                  sanitizeStringValue(newElem, 'dataStoragePolicy');
                  sanitizeStringValue(newElem, 'knownIssues');
                  newElem.knownIssues =
                    newElem.knownIssues.trim() === 'none'
                      ? undefined
                      : newElem.knownIssues;

                  asrInfos.push(newElem);
                }

                // overwrite data of config
                for (const service of settings.octra.plugins.asr.services) {
                  if (service.basName !== undefined) {
                    const basInfo = asrInfos.find(
                      (a) => a.name === service.basName
                    );
                    if (basInfo !== undefined) {
                      service.dataStoragePolicy =
                        basInfo.dataStoragePolicy !== undefined
                          ? basInfo.dataStoragePolicy
                          : service.dataStoragePolicy;

                      service.maxSignalDuration =
                        basInfo.maxSignalDuration !== undefined
                          ? basInfo.maxSignalDuration
                          : service.maxSignalDuration;

                      service.maxSignalSize =
                        basInfo.maxSignalSize !== undefined
                          ? basInfo.maxSignalSize
                          : service.maxSignalSize;

                      service.knownIssues =
                        basInfo.knownIssues !== undefined
                          ? basInfo.knownIssues
                          : service.knownIssues;

                      service.quotaPerMonth =
                        basInfo.quotaPerMonth !== undefined
                          ? basInfo.quotaPerMonth
                          : service.quotaPerMonth;

                      service.termsURL =
                        basInfo.termsURL !== undefined
                          ? basInfo.termsURL
                          : service.termsURL;
                    }
                  }
                }

                return ApplicationActions.loadASRSettings.success({
                  settings,
                });
              })
            );
        } else {
          return of(
            ApplicationActions.loadASRSettings.fail({
              error: undefined,
            })
          );
        }
      })
    )
  );

  settingsLoaded$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ApplicationActions.loadSettings.success),
      exhaustMap((a) => {
        const webToken = this.sessStr.retrieve('webToken');
        const authType = this.sessStr.retrieve('authType');
        const authenticated = this.sessStr.retrieve('authenticated');

        this.store.dispatch(
          APIActions.init.do({
            url: a.settings.api.url,
            appToken: a.settings.api.appToken,
            authType,
            authenticated,
            webToken,
          })
        );

        this.transloco.setAvailableLangs(a.settings.octra.languages);

        if (
          a.settings.octra.tracking !== undefined &&
          a.settings.octra.tracking.active !== undefined &&
          a.settings.octra.tracking.active !== ''
        ) {
          this.appendTrackingCode(a.settings.octra.tracking.active, a.settings);
        }

        const loggedIn = this.sessStr.retrieve('loggedIn');

        return of(
          ApplicationActions.initApplication.success({
            playOnHover: this.sessStr.retrieve('playonhover') ?? false,
            followPlayCursor:
              this.sessStr.retrieve('followplaycursor') ?? false,
            loggedIn: this.sessStr.retrieve('loggedIn') ?? false,
            reloaded: this.sessStr.retrieve('reloaded') ?? false,
          })
        );
      })
    )
  );

  afterIDBLoaded$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(IDBActions.loadAnnotationSuccess),
        withLatestFrom(this.store),
        tap(([a, store]: [Action, RootState]) => {
          if (
            this.appStorage.asrSelectedService !== undefined &&
            this.appStorage.asrSelectedLanguage !== undefined
          ) {
            // set asr settings
            const selectedLanguage = this.appStorage.asrSelectedLanguage;
            const selectedService = this.appStorage.asrSelectedService;
            const lang: ASRLanguage = this.asrService.getLanguageByCode(
              selectedLanguage,
              selectedService
            );

            if (lang !== undefined) {
              this.asrService.selectedLanguage = lang;
            } else {
              console.error('Could not read ASR language from database');
            }

            if (!this.settingsService.responsive.enabled) {
              this.setFixedWidth();
            }
          }
          this.bugService.addEntriesFromDB(this.appStorage.consoleEntries);

          const queryParams = {
            audio: this.getParameterByName('audio'),
            host: this.getParameterByName('host'),
            transcript: this.getParameterByName('transcript'),
            embedded: this.getParameterByName('embedded'),
          };

          console.log(`then!`);
          const transcriptURL =
            queryParams.transcript !== undefined
              ? queryParams.transcript
              : undefined;
          // define languages
          const languages = store.application.appConfiguration.octra.languages;
          const browserLang =
            navigator.language || (navigator as any).userLanguage;

          // check if browser language is available in translations
          if (
            this.appStorage.language === undefined ||
            this.appStorage.language === ''
          ) {
            if (
              store.application.appConfiguration.octra.languages.find(
                (value) => {
                  return value === browserLang;
                }
              ) !== undefined
            ) {
              this.transloco.setActiveLang(browserLang);
            } else {
              // use first language defined as default language
              this.transloco.setActiveLang(languages[0]);
            }
          } else {
            if (
              store.application.appConfiguration.octra.languages.find(
                (value) => {
                  return value === this.appStorage.language;
                }
              ) !== undefined
            ) {
              this.transloco.setActiveLang(this.appStorage.language);
            } else {
              this.transloco.setActiveLang(languages[0]);
            }
          }

          // if url mode, set it in options
          if (SettingsService.queryParamsSet(queryParams)) {
            this.appStorage.setURLSession(
              queryParams.audio,
              transcriptURL,
              queryParams.embedded === '1',
              queryParams.host
            );
          }

          // settings finally loaded

          if (
            !store.application.loggedIn &&
            this.appStorage.useMode !== LoginMode.URL
          ) {
            this.routerService.navigate(
              ['/login'],
              AppInfo.queryParamsHandling
            );
          }
        })
      ),
    { dispatch: false }
  );

  loadLanguage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ApplicationActions.loadLanguage.do),
      exhaustMap((a) => {
        const language = this.localStorage.retrieve('language');
        this.transloco.setActiveLang(
          language?.replace(/-.*/g, '') ?? getBrowserLang() ?? 'en'
        );
        return of(ApplicationActions.loadLanguage.success());
      })
    )
  );

  logoutSession$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthenticationActions.logout.success),
      exhaustMap((action) => {
        this.sessStr.clear();
        // clear undo history
        this.store.dispatch(ApplicationActions.clear());

        const subject = new Subject<Action>();

        timer(10).subscribe(() => {
          if (action.type === AuthenticationActions.logout.success.type) {
            subject.next(OnlineModeActions.clearSessionStorage.success());
          } else {
            subject.next(LocalModeActions.clearSessionStorage.success());
          }
          subject.complete();

          this.routerService
            .navigate(['login'], AppInfo.queryParamsHandling)
            .catch((error) => {
              console.error(error);
            });
        });

        return subject;
      })
    )
  );

  constructor(
    private actions$: Actions,
    private transloco: TranslocoService,
    private sessStr: SessionStorageService,
    private localStorage: LocalStorageService,
    private store: Store<RootState>,
    private http: HttpClient,
    private configurationService: ConfigurationService,
    private bugService: BugReportService,
    private appStorage: AppStorageService,
    private asrService: AsrService,
    private settingsService: SettingsService,
    private routerService: RoutingService
  ) {}

  private initConsoleLogging() {
    // overwrite console.log
    if (!AppInfo.debugging) {
      const oldLog = console.log;
      const serv = this.bugService;
      (() => {
        // tslint:disable-next-line:only-arrow-functions
        console.log = function (message) {
          serv.addEntry(ConsoleType.LOG, message);
          // eslint-disable-next-line prefer-rest-params
          oldLog.apply(console, arguments);
        };
      })();

      // overwrite console.err
      const oldError = console.error;
      (() => {
        // tslint:disable-next-line:only-arrow-functions
        console.error = function (error, context) {
          let debug = '';
          let stack: string | undefined = '';

          if (typeof error === 'string') {
            debug = error;

            if (
              error === 'ERROR' &&
              context !== undefined &&
              context.stack &&
              context.message
            ) {
              debug = context.message;
              stack = context.stack;
            }
          } else {
            if (error instanceof Error) {
              debug = error.message;
              stack = error.stack;
            } else {
              if (typeof error === 'object') {
                // some other type of object
                debug = 'OBJECT';
                stack = JSON.stringify(error);
              } else {
                debug = error;
              }
            }
          }

          if (debug !== '') {
            serv.addEntry(
              ConsoleType.ERROR,
              `${debug}${stack !== '' ? ' ' + stack : ''}`
            );
          }

          // eslint-disable-next-line prefer-rest-params
          oldError.apply(console, arguments);
        };
      })();

      // overwrite console.warn
      const oldWarn = console.warn;
      (() => {
        // tslint:disable-next-line:only-arrow-functions
        console.warn = function (message) {
          serv.addEntry(ConsoleType.WARN, message);
          // eslint-disable-next-line prefer-rest-params
          oldWarn.apply(console, arguments);
        };
      })();
    }
  }

  private appendTrackingCode(type: string, settings: AppSettings) {
    // check if matomo is activated
    if (type === 'matomo') {
      if (
        settings.octra.tracking.matomo !== undefined &&
        settings.octra.tracking.matomo.host !== undefined &&
        settings.octra.tracking.matomo.siteID !== undefined
      ) {
        const matomoSettings = settings.octra.tracking.matomo;

        const trackingCode = document.createElement('script');
        trackingCode.setAttribute('type', 'text/javascript');
        trackingCode.innerHTML = `
<!-- Matomo -->
<script type="text/javascript">
  var _paq = window._paq || [];
  /* tracker methods like "setCustomDimension" should be called before "trackPageView" */
  _paq.push(['trackPageView']);
  _paq.push(['enableLinkTracking']);
  (function() {
    var u="${matomoSettings.host}";
    _paq.push(['setTrackerUrl', u+'piwik.php']);
    _paq.push(['setSiteId', '${matomoSettings.siteID}']);
    var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
    g.type='text/javascript'; g.async=true; g.defer=true; g.src=u+'piwik.js'; s.parentNode.insertBefore(g,s);
  })();
</script>
<!-- End Matomo Code -->`;

        document.body.appendChild(trackingCode);
      } else {
        console.error(
          `attributes for piwik tracking in appconfig.json are invalid.`
        );
      }
    } else {
      console.error(`tracking type ${type} is not supported.`);
    }
  }

  private setFixedWidth() {
    // set fixed width
    const head = document.head || document.getElementsByTagName('head')[0];
    const style = document.createElement('style');
    style.type = 'text/css';
    style.innerText =
      '.container {width:' + this.settingsService.responsive.fixedwidth + 'px}';
    head.appendChild(style);
  }

  private getParameterByName(name: string, url?: string) {
    if (!url) {
      url = document.location.href;
    }
    name = name.replace(/[[]]/g, '\\$&');
    const regExp = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
    const results = regExp.exec(url);
    if (!results) {
      return undefined;
    }
    if (!results[2]) {
      return '';
    }
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
  }
}
