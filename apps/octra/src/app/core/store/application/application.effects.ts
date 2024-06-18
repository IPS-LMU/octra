import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { LocalStorageService, SessionStorageService } from 'ngx-webstorage';
import { ApplicationActions } from '../application/application.actions';
import { LoginModeActions } from '../login-mode';
import {
  catchError,
  exhaustMap,
  forkJoin,
  from,
  map,
  Observable,
  of,
  Subject,
  tap,
  withLatestFrom,
} from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { APIActions } from '../api';
import { getBrowserLang, TranslocoService } from '@jsverse/transloco';
import { uniqueHTTPRequest } from '@octra/ngx-utilities';
import { ConfigurationService } from '../../shared/service/configuration.service';
import { AppConfigSchema } from '../../schemata/appconfig.schema';
import { AppInfo } from '../../../app.info';
import {
  BugReportService,
  ConsoleType,
} from '../../shared/service/bug-report.service';
import { AppSettings, ASRSettings } from '../../obj';
import { IDBActions } from '../idb/idb.actions';
import { AppStorageService } from '../../shared/service/appstorage.service';
import { SettingsService } from '../../shared/service';
import { getModeState, LoginMode, RootState } from '../index';
import { AuthenticationActions } from '../authentication';
import { RoutingService } from '../../shared/service/routing.service';
import { AnnotationActions } from '../login-mode/annotation/annotation.actions';
import { OctraModalService } from '../../modals/octra-modal.service';
import { ErrorModalComponent } from '../../modals/error-modal/error-modal.component';
import { environment } from '../../../../environments/environment';
import { findElements, getAttr } from '@octra/web-media';
import X2JS from 'x2js';
import { isNumber } from '@octra/utilities';
import { ASRActions } from '../asr/asr.actions';
import { UserActions } from '../user/user.actions';

@Injectable({
  providedIn: 'root',
})
export class ApplicationEffects {
  initApp$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ApplicationActions.initApplication.do),
      exhaustMap(() => {
        this.appStorage.saveCurrentPageAsLastPage();

        const queryParams = {
          audio_url: this.getParameterByName('audio_url'),
          audio_name: this.getParameterByName('audio_name'),
          host: this.getParameterByName('host'),
          transcript: this.getParameterByName('transcript'),
          readonly: this.getParameterByName('readonly'),
          embedded: this.getParameterByName('embedded'),
        };

        this.routerService.addStaticParams(queryParams);

        this.initConsoleLogging();
        return of(ApplicationActions.loadLanguage.do());
      })
    )
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
                error: `<br/><ul>${validation
                  .map(
                    (v) =>
                      '<li><b>' +
                      v.instancePath +
                      '</b>:<br/>' +
                      v.message +
                      '</li>'
                  )
                  .join('<br/>')}</ul>`,
              });
            }
          }),
          catchError((err: HttpErrorResponse) => {
            return of(
              ApplicationActions.loadSettings.fail({
                error: err.error?.message ?? err.message,
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
          settings.octra.plugins?.asr?.asrInfoURL !== undefined &&
          typeof settings.octra.plugins.asr.asrInfoURL === 'string' &&
          settings.octra.plugins.asr.asrInfoURL
        ) {
          return this.http
            .get(settings.octra.plugins.asr.asrInfoURL, {
              responseType: 'text',
            })
            .pipe(
              map((result) => {
                if (!settings.octra.plugins?.asr?.services) {
                  throw new Error(
                    'Missing asr.services property in application settings.'
                  );
                }

                const doc = new DOMParser().parseFromString(
                  result,
                  'text/html'
                );
                const basTable = doc.getElementById('bas-asr-service-table');
                const basASRInfoContainers = findElements(
                  basTable!,
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
                const asrSettings = JSON.parse(
                  JSON.stringify(settings.octra.plugins.asr)
                );

                for (let i = 0; i < asrSettings.services.length; i++) {
                  const service = asrSettings.services[i];

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

                return asrSettings as ASRSettings;
              }),
              exhaustMap((asrSettings) => {
                return forkJoin([
                  from(this.updateASRQuotaInfo(asrSettings)),
                  this.getMAUSLanguages(asrSettings),
                  this.getActiveASRProviders(asrSettings),
                ]).pipe(
                  exhaustMap(([setttings, mausLanguages, activeProviders]) => {
                    return of(
                      ApplicationActions.loadASRSettings.success({
                        languageSettings: {
                          ...setttings,
                          languages: setttings.languages.map((a) => {
                            return {
                              ...a,
                              state:
                                activeProviders.find(
                                  (b) =>
                                    b.ParameterValue.Value === `call${a.asr}ASR`
                                ) && a.state === 'active'
                                  ? 'active'
                                  : 'inactive',
                            };
                          }),
                        },
                        mausLanguages: mausLanguages
                          ?.filter((a) => a.ParameterValue.Description !== '')
                          .map((a) => ({
                            value: a.ParameterValue.Value,
                            description: a.ParameterValue.Description,
                          })),
                      })
                    );
                  })
                );
              }),
              catchError((error) => {
                console.error(error);
                return of(
                  ApplicationActions.loadASRSettings.fail({
                    error,
                  })
                );
              })
            );
        } else {
          return of(
            ApplicationActions.loadASRSettings.fail({
              error: undefined as any,
            })
          );
        }
      })
    )
  );

  public async updateASRQuotaInfo(
    asrSettings: ASRSettings
  ): Promise<ASRSettings> {
    const results = [];
    if (asrSettings?.services) {
      for (const service of asrSettings.services) {
        if (service.type === 'ASR' && asrSettings.asrQuotaInfoURL) {
          results.push(
            await this.getASRQuotaInfo(
              asrSettings.asrQuotaInfoURL,
              service.provider
            )
          );
        }
      }

      for (const result of results) {
        const serviceIndex = asrSettings.services.findIndex(
          (a) => a.provider === result.asrName
        );

        if (serviceIndex > -1) {
          asrSettings.services[serviceIndex].usedQuota = result.usedQuota;
          asrSettings.services[serviceIndex].quotaPerMonth =
            result.monthlyQuota;
        } else {
          console.error(`could not find ${result.asrName}`);
        }
      }
    }

    return asrSettings;
  }

  getASRQuotaInfo(url: string, asrName: string) {
    return new Promise<{
      asrName: string;
      monthlyQuota?: number;
      usedQuota?: number;
    }>((resolve, reject) => {
      this.http
        .get(`${url}?ASRType=call${asrName}ASR`, { responseType: 'text' })
        .subscribe((result) => {
          const x2js = new X2JS();
          const response: any = x2js.xml2js(result);
          const asrQuotaInfo: {
            asrName: string;
            monthlyQuota?: number;
            usedQuota?: number;
          } = {
            asrName,
          };

          if (response.basQuota) {
            const info = {
              monthlyQuota:
                response.basQuota &&
                response.basQuota.monthlyQuota &&
                isNumber(response.basQuota.monthlyQuota)
                  ? Number(response.basQuota.monthlyQuota)
                  : null,
              secsAvailable:
                response.basQuota &&
                response.basQuota.secsAvailable &&
                isNumber(response.basQuota.secsAvailable)
                  ? Number(response.basQuota.secsAvailable)
                  : null,
            };

            if (info.monthlyQuota && info.monthlyQuota !== 999999) {
              asrQuotaInfo.monthlyQuota = info.monthlyQuota;
            }

            if (
              info.monthlyQuota &&
              info.secsAvailable !== undefined &&
              info.secsAvailable !== null &&
              info.secsAvailable !== 999999
            ) {
              asrQuotaInfo.usedQuota = info.monthlyQuota - info.secsAvailable;
            }
          }

          resolve(asrQuotaInfo);
        });
    });
  }

  public getMAUSLanguages(asrSettings?: ASRSettings): Observable<
    {
      ParameterValue: { Value: string; Description: string };
    }[]
  > {
    if (asrSettings?.basConfigURL) {
      return this.http.get<
        {
          ParameterValue: { Value: string; Description: string };
        }[]
      >(
        `${asrSettings.basConfigURL}?path=CMD/Components/BASWebService/Service/Operations/runPipeline/Input/LANGUAGE/Values/`,
        { responseType: 'json' }
      );
    } else {
      return of([]);
    }
  }

  public getActiveASRProviders(asrSettings?: ASRSettings): Observable<
    {
      ParameterValue: { Value: string; Description: string };
    }[]
  > {
    if (asrSettings?.basConfigURL) {
      return this.http.get<
        {
          ParameterValue: { Value: string; Description: string };
        }[]
      >(
        `${asrSettings.basConfigURL}?path=CMD/Components/BASWebService/Service/Operations/runASR/Input/ASRType/Values/`,
        { responseType: 'json' }
      );
    } else {
      return of([]);
    }
  }

  settingsLoaded$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ApplicationActions.loadSettings.success),
      exhaustMap((a) => {
        // set language
        const language = this.localStorage.retrieve('language');
        this.transloco.setAvailableLangs(a.settings.octra.languages);

        this.transloco.setActiveLang(
          language?.replace(/-.*/g, '') ?? getBrowserLang() ?? 'en'
        );

        this.store.dispatch(
          ApplicationActions.loadASRSettings.do({
            settings: a.settings,
          })
        );

        const webToken = this.sessStr.retrieve('webToken');
        const authType = this.sessStr.retrieve('authType');
        const authenticated = this.sessStr.retrieve('loggedIn');

        this.transloco.setAvailableLangs(a.settings.octra.languages);

        return of(
          APIActions.init.do({
            url: a.settings.api.url,
            appToken: a.settings.api.appToken,
            authType,
            authenticated,
            webToken,
          })
        );
      })
    )
  );

  afterAPIInit$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(APIActions.init.success),
        withLatestFrom(this.store),
        tap(([a, state]) => {
          if (
            state.application.appConfiguration?.octra?.tracking?.active &&
            state.application.appConfiguration.octra.tracking.active !== ''
          ) {
            this.appendTrackingCode(
              state.application.appConfiguration.octra.tracking.active,
              state.application.appConfiguration
            );
          }

          this.store.dispatch(
            ApplicationActions.initApplication.setSessionStorageOptions({
              loggedIn:
                this.sessStr.retrieve('loggedIn') ?? a.authenticated ?? false,
              reloaded: this.sessStr.retrieve('reloaded') ?? false,
            })
          );
        })
      ),
    { dispatch: false }
  );

  afterInitApplication$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          ApplicationActions.initApplication.finish,
          LoginModeActions.loadProjectAndTaskInformation.success
        ),
        withLatestFrom(this.store),
        tap(([a, state]) => {
          if (state.application.initialized) {
            if (!state.application.mode) {
              // no mode active
              if (state.authentication.authenticated) {
                this.store.dispatch(
                  AuthenticationActions.logout.do({
                    message: 'logout due undefined mode',
                    messageType: 'error',
                    mode: undefined,
                    clearSession: false,
                  })
                );
              } else {
                this.store.dispatch(ApplicationActions.redirectToLastPage.do());
              }
              return;
            }

            if (!state.application.loggedIn) {
              this.store.dispatch(ApplicationActions.redirectToLastPage.do());
            } else {
              // logged in
              const modeState = getModeState(state)!;

              if (
                modeState.currentSession.currentProject &&
                modeState.currentSession.task
              ) {
                this.store.dispatch(
                  AnnotationActions.prepareTaskDataForAnnotation.do({
                    currentProject: modeState.currentSession.currentProject,
                    mode: state.application.mode,
                    task: modeState.currentSession.task,
                  })
                );
              } else if (
                this.sessionStorage.retrieve('last_page_path') !== '/help-tools'
              ) {
                this.store.dispatch(
                  AuthenticationActions.redirectToProjects.do()
                );
              } else {
                this.store.dispatch(ApplicationActions.redirectToLastPage.do());
              }
            }
          }
        })
      ),
    { dispatch: false }
  );

  onProjectAndTaskInfoLoaded$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          LoginModeActions.loadProjectAndTaskInformation.fail,
          LoginModeActions.loadProjectAndTaskInformation.success
        ),
        withLatestFrom(this.store),
        tap(([action, state]) => {
          if (!state.application.initialized) {
            // load on startup
            this.store.dispatch(IDBActions.loadAnnotation.do());
          }
        })
      ),
    { dispatch: false }
  );

  redirectToLastPage$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(ApplicationActions.redirectToLastPage.do),
        tap((a) => {
          const lastPagePath = this.sessStr.retrieve('last_page_path');
          if (lastPagePath && !['', '/'].includes(lastPagePath)) {
            this.routerService.navigate('last page', [lastPagePath]);
          } else {
            this.routerService.navigate('no last page', ['/login']);
          }
        })
      ),
    { dispatch: false }
  );

  redirectTo$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(ApplicationActions.redirectTo.success),
        tap((a) => {
          if (a.needsRedirectionTo) {
            this.routerService.navigate('last page', [a.needsRedirectionTo]);
          }
        })
      ),
    { dispatch: false }
  );

  afterIDBLoaded$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(IDBActions.loadConsoleEntries.success),
        withLatestFrom(this.store),
        tap(([a, state]: [Action, RootState]) => {
          this.bugService.addEntriesFromDB(this.appStorage.consoleEntries);

          if (!this.settingsService.responsive.enabled) {
            this.setFixedWidth();
          }

          // define languages
          const languages = state.application.appConfiguration!.octra.languages;
          const browserLang =
            navigator.language || (navigator as any).userLanguage;

          // check if browser language is available in translations
          if (
            this.appStorage.language === undefined ||
            this.appStorage.language === ''
          ) {
            if (
              state.application.appConfiguration!.octra.languages.find(
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
              state.application.appConfiguration!.octra.languages.find(
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

          if (this.routerService.staticQueryParams?.audio_url) {
            this.store.dispatch(
              AuthenticationActions.loginURL.do({
                mode: LoginMode.URL,
              })
            );
          }

          this.store.dispatch(ApplicationActions.initApplication.finish());
        })
      ),
    { dispatch: false }
  );

  loadLanguage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ApplicationActions.loadLanguage.do),
      exhaustMap((a) => {
        this.transloco.setAvailableLangs(['en']);
        this.transloco.setActiveLang('en');
        return of(ApplicationActions.loadLanguage.success());
      })
    )
  );

  loadLanguageSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ApplicationActions.loadLanguage.success),
      exhaustMap((a) => {
        return of(ApplicationActions.loadSettings.do());
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

        subject.next(LoginModeActions.clearSessionStorage.success());
        subject.complete();

        this.routerService
          .navigate(
            'after logout success',
            ['/login'],
            AppInfo.queryParamsHandling
          )
          .catch((error) => {
            console.error(error);
          });

        return subject;
      })
    )
  );

  wait$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(ApplicationActions.waitForEffects.do),
        tap((a) => {
          this.routerService.navigate(
            'wait for effects',
            ['/load'],
            AppInfo.queryParamsHandling
          );
        })
      ),
    { dispatch: false }
  );

  showErrorMessage$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(ApplicationActions.showErrorModal.do),
        tap((a) => {
          const ref = this.modalService.openModalRef<ErrorModalComponent>(
            ErrorModalComponent,
            {
              ...ErrorModalComponent.options,
              backdrop: a.showOKButton ? true : 'static',
            },
            {
              text: a.error,
              showOKButton: a.showOKButton,
            }
          );
        })
      ),
    { dispatch: false }
  );

  logActionsToConsole$ = createEffect(
    () =>
      this.actions$.pipe(
        tap((action) => {
          if (
            environment.debugging.enabled &&
            environment.debugging.logging.actions &&
            action.type.indexOf('Set Console Entries') < 0 &&
            (!environment.production || !this.isIgnoredAction(action.type))
          ) {
            console.groupCollapsed(`ACTION ${action.type} ---`);
            console.log(action);
            console.groupEnd();
          }
        })
      ),
    {
      dispatch: false,
    }
  );

  appLoadingFail$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(ApplicationActions.loadSettings.fail),
        tap((a) => {
          const ref = this.modalService.openModalRef<ErrorModalComponent>(
            ErrorModalComponent,
            {
              ...ErrorModalComponent.options,
              backdrop: 'static',
            },
            {
              text: `Can't load application settings: ${a.error}`,
            }
          );

          ref.componentInstance.showOKButton = false;
        })
      ),
    { dispatch: false }
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
    private settingsService: SettingsService,
    private routerService: RoutingService,
    private modalService: OctraModalService,
    private sessionStorage: SessionStorageService
  ) {}

  private initConsoleLogging() {
    // overwrite console.log
    if (environment.debugging.logging.console) {
      const oldLog = console.log;
      const serv = this.bugService;
      (() => {
        // tslint:disable-next-line:only-arrow-functions
        console.log = function (...args) {
          serv.addEntry(ConsoleType.LOG, args[0]);
          // eslint-disable-next-line prefer-rest-params
          oldLog.apply(console, args);
        };
      })();

      // overwrite console.err
      const oldError = console.error;
      (() => {
        // tslint:disable-next-line:only-arrow-functions
        console.error = function (...args) {
          const error = args[0];
          const context = args[1];

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
          oldError.apply(console, args);
        };
      })();

      // overwrite console.warn
      const oldWarn = console.warn;
      (() => {
        // tslint:disable-next-line:only-arrow-functions
        console.warn = function (...args) {
          serv.addEntry(ConsoleType.WARN, args[0]);
          // eslint-disable-next-line prefer-rest-params
          oldWarn.apply(console, args);
        };
      })();

      // overwrite console.collapsedGroup
      const oldGroupCollapsed = console.groupCollapsed;
      (() => {
        // tslint:disable-next-line:only-arrow-functions
        console.groupCollapsed = function (...args) {
          serv.beginGroup(args[0]);
          // eslint-disable-next-line prefer-rest-params
          oldGroupCollapsed.apply(console, args);
        };
      })();

      // overwrite console.groupEnd
      const oldGroupEnd = console.groupEnd;
      (() => {
        // tslint:disable-next-line:only-arrow-functions
        console.groupEnd = function (...args) {
          serv.endGroup();
          // eslint-disable-next-line prefer-rest-params
          oldGroupEnd.apply(console, args);
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

  private isIgnoredAction(type: string) {
    return (
      [
        AnnotationActions.loadAudio.progress.type,
        AnnotationActions.addLog.do.type,
        IDBActions.loadConsoleEntries.success.type,
        IDBActions.loadOptions.success.type,
        ApplicationActions.loadSettings.success.type,
        APIActions.init.do.type,
        IDBActions.loadLogs.success.type,
        LoginModeActions.changeComment.do.type,
        AnnotationActions.setSavingNeeded.do.type,
        AnnotationActions.overwriteTranscript.do.type,
        ASRActions.processQueueItem.do.type,
        ApplicationActions.loadASRSettings.do.type,
        ApplicationActions.loadASRSettings.success.type,
        IDBActions.saveUserProfile.success.type,
        UserActions.setUserProfile.type,
      ] as string[]
    ).includes(type);
  }
}
