import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {Action} from '@ngrx/store';
import {ConfigurationService} from '../../shared/service/configuration.service';
import {AppSettings, ProjectSettings} from '../../obj/Settings';
import {findElements, getAttr, uniqueHTTPRequest} from '@octra/utilities';
import {HttpClient} from '@angular/common/http';
import {TranslocoService} from '@ngneat/transloco';
import {ConfigurationActions} from '../configuration/configuration.actions';
import {Subject} from 'rxjs';
import {exhaustMap} from 'rxjs/operators';

declare let validateAnnotation: ((string, any) => any);
declare let tidyUpAnnotation: ((string, any) => any);

@Injectable()
export class ConfigurationEffects {
  loadAppConfig$ = createEffect(() => this.actions$.pipe(
    ofType(ConfigurationActions.loadAppConfiguration),
    exhaustMap(() => {
      const subject = new Subject<Action>();

      this.configurationService.loadSettings(
        {
          loading: 'Load application settings...'
        },
        {
          json: './config/appconfig.json',
          schema: './assets/schemata/appconfig.schema.json'
        },
        {
          json: 'appconfig.json',
          schema: 'appconfig.schema.json'
        },
        (appConfiguration: AppSettings) => {
          // load information from BASWebservices ASR page
          if (appConfiguration.octra.plugins.asr.asrInfoURL !== undefined
            && typeof appConfiguration.octra.plugins.asr.asrInfoURL === 'string'
            && appConfiguration.octra.plugins.asr.asrInfoURL
          ) {
            this.http.get(
              appConfiguration.octra.plugins.asr.asrInfoURL,
              {responseType: 'text'}
            ).subscribe(
              (result) => {
                const document = (new DOMParser()).parseFromString(result, 'text/html');
                const basTable = document.getElementById('#bas-asr-service-table');
                const basASRInfoContainers = findElements(basTable, '.bas-asr-info-container');

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
                    if (el[attr] !== undefined && typeof el[attr] === 'string') {
                      el[attr] = el[attr].replace(/[\n\t\r]+/g, '');
                    } else {
                      el[attr] = undefined;
                    }
                  };

                  const maxSignalDurationSpans = findElements(basASRInfoContainer, '.bas-asr-info-max-signal-duration-seconds');
                  const maxSignalSizeSpans = findElements(basASRInfoContainer, '.bas-asr-info-max-signal-size-megabytes');
                  const quotaPerMonthSpans = findElements(basASRInfoContainer, '.bas-asr-info-quota-per-month-seconds');
                  const termsURLSpans = findElements(basASRInfoContainer, '.bas-asr-info-eula-link');
                  const dataStoragePolicySpans = findElements(basASRInfoContainer, '.bas-asr-info-data-storage-policy');
                  const knownIssuesSpans = findElements(basASRInfoContainer, '.bas-asr-info-known-issues');


                  const newElem: any = {
                    name: getAttr(basASRInfoContainer, 'data-bas-asr-info-provider-name'),
                    maxSignalDuration: (maxSignalDurationSpans.length > 0) ? getAttr(maxSignalDurationSpans[0], "data-value") : undefined,
                    maxSignalSize: (maxSignalSizeSpans.length > 0) ? getAttr(maxSignalSizeSpans[0], "data-value") : undefined,
                    quotaPerMonth: (quotaPerMonthSpans.length > 0) ? getAttr(quotaPerMonthSpans[0], "data-value") : undefined,
                    termsURL: (termsURLSpans.length > 0) ? getAttr(termsURLSpans[0], "href") : undefined,
                    dataStoragePolicy: (dataStoragePolicySpans.length > 0) ? dataStoragePolicySpans[0].innerText : undefined,
                    knownIssues: (knownIssuesSpans.length > 0) ? knownIssuesSpans[0].innerText : undefined
                  };

                  sanitizeNumberValue(newElem, 'maxSignalDuration');
                  sanitizeNumberValue(newElem, 'maxSignalSize');
                  sanitizeNumberValue(newElem, 'quotaPerMonth');
                  sanitizeStringValue(newElem, 'dataStoragePolicy');
                  sanitizeStringValue(newElem, 'knownIssues');
                  newElem.knownIssues = (newElem.knownIssues.trim() === 'none') ? undefined : newElem.knownIssues;

                  asrInfos.push(newElem);
                }

                // overwrite data of config
                for (const service of appConfiguration.octra.plugins.asr.services) {
                  if (service.basName !== undefined) {
                    const basInfo = asrInfos.find(a => a.name === service.basName);
                    if (basInfo !== undefined) {
                      service.dataStoragePolicy = (basInfo.dataStoragePolicy !== undefined)
                        ? basInfo.dataStoragePolicy : service.dataStoragePolicy;

                      service.maxSignalDuration = (basInfo.maxSignalDuration !== undefined)
                        ? basInfo.maxSignalDuration : service.maxSignalDuration;

                      service.maxSignalSize = (basInfo.maxSignalSize !== undefined)
                        ? basInfo.maxSignalSize : service.maxSignalSize;

                      service.knownIssues = (basInfo.knownIssues !== undefined)
                        ? basInfo.knownIssues : service.knownIssues;

                      service.quotaPerMonth = (basInfo.quotaPerMonth !== undefined)
                        ? basInfo.quotaPerMonth : service.quotaPerMonth;

                      service.termsURL = (basInfo.termsURL !== undefined)
                        ? basInfo.termsURL : service.termsURL;
                    }
                  }
                }

                subject.next(ConfigurationActions.appConfigurationLoadSuccess({
                  appConfiguration
                }));
              },
              (e) => {
                console.error(e);
                subject.next(ConfigurationActions.appConfigurationLoadSuccess({
                  appConfiguration
                }));
              });
          } else {
            subject.next(ConfigurationActions.appConfigurationLoadSuccess({
              appConfiguration
            }));
          }
        },
        (error) => {
          subject.next(ConfigurationActions.appConfigurationLoadFailed({
            error
          }));
        }
      );

      return subject;
    })
  ));

  loadProjectConfig$ = createEffect(() => this.actions$.pipe(
    ofType(ConfigurationActions.loadAppConfiguration),
    exhaustMap(() => {
      const subject = new Subject<Action>();

      this.configurationService.loadSettings(
        {
          loading: 'Load project settings...'
        },
        {
          json: './config/localmode/projectconfig.json',
          schema: './assets/schemata/projectconfig.schema.json'
        },
        {
          json: 'projectconfig.json',
          schema: 'projectconfig.schema.json'
        },
        (projectConfig: ProjectSettings) => {
          subject.next(ConfigurationActions.projectConfigurationLoaded({
            projectConfig
          }));
        },
        (error) => {
          subject.next(ConfigurationActions.projectConfigurationLoadedFailed({
            error
          }));
        }
      );

      return subject;
    })
  ));

  loadGuidelines$ = createEffect(() => this.actions$.pipe(
    ofType(ConfigurationActions.projectConfigurationLoaded, ConfigurationActions.loadGuidelines),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      let language = this.languageService.getActiveLang();

      const found = action.projectConfig.languages.find((x) => {
        return x === language;
      });
      if (found === undefined) {
        // fall back to first defined language
        language = action.projectConfig.languages[0];
      }
      const url = './config/localmode/guidelines/guidelines_' + language + '.json';

      this.configurationService.loadSettings(
        {
          loading: 'Load guidelines (' + language + ')...'
        },
        {
          json: url,
          schema: './assets/schemata/guidelines.schema.json'
        },
        {
          json: 'guidelines_' + language + '.json',
          schema: 'guidelines.schema.json'
        },
        (guidelines: any) => {
          subject.next(ConfigurationActions.loadGuidelinesSuccess({
            guidelines
          }));
        },
        (error) => {
          subject.next(ConfigurationActions.loadGuidelinesFailed({
            error
          }));
        }
      );

      return subject;
    })
  ));

  loadValidationMethods$ = createEffect(() => this.actions$.pipe(
    ofType(ConfigurationActions.loadGuidelinesSuccess),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      uniqueHTTPRequest(this.http, false, {
        responseType: 'text'
      }, action.guidelines.meta.validation_url, undefined).subscribe(
        () => {
          const js = document.createElement('script');

          js.type = 'text/javascript';
          js.src = action.guidelines.meta.validation_url;
          js.id = 'validationJS';
          js.onload = () => {
            if (
              (typeof validateAnnotation !== 'undefined') && typeof validateAnnotation === 'function' &&
              (typeof tidyUpAnnotation !== 'undefined') && typeof tidyUpAnnotation === 'function'
            ) {
              subject.next(ConfigurationActions.loadMethodsSuccess({
                validate: validateAnnotation,
                tidyUp: tidyUpAnnotation
              }));
              console.log('Methods loaded.');
            } else {
              subject.next(ConfigurationActions.loadMethodsFailed({
                error: 'Loading functions failed [Error: S02]'
              }));
            }
          };
          document.body.appendChild(js);
        },
        () => {
          subject.next(ConfigurationActions.loadMethodsFailed({
            error: 'Loading functions failed [Error: S01]'
          }));
        }
      );

      return subject;
    })
  ));

  constructor(private actions$: Actions,
              private configurationService: ConfigurationService,
              private http: HttpClient,
              private languageService: TranslocoService) {
  }

}
