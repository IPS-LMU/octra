import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {exhaustMap} from 'rxjs/operators';
import {Subject} from 'rxjs';
import {Action} from '@ngrx/store';
import {ConfigurationService} from '../../shared/service/configuration.service';
import {AppSettings, ProjectSettings} from '../../obj/Settings';
import {isUnset, uniqueHTTPRequest} from '@octra/utilities';
import {HttpClient} from '@angular/common/http';
import {TranslocoService} from '@ngneat/transloco';
import {ConfigurationActions} from '../configuration/configuration.actions';

declare var validateAnnotation: ((string, any) => any);
declare var tidyUpAnnotation: ((string, any) => any);

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
          if (!isUnset(appConfiguration.octra.plugins.asr.asrInfoURL)
            && typeof appConfiguration.octra.plugins.asr.asrInfoURL === 'string'
            && appConfiguration.octra.plugins.asr.asrInfoURL
          ) {
            this.http.get(
              appConfiguration.octra.plugins.asr.asrInfoURL,
              {responseType: 'text'}
            ).subscribe(
              (result) => {
                const html = jQuery(result);
                const basTable = html.find('#bas-asr-service-table');
                const basASRInfoContainers = basTable.find('.bas-asr-info-container');

                const asrInfos: {
                  name: string;
                  maxSignalDuration: number;
                  maxSignalSize: number;
                  quotaPerMonth: number;
                  termsURL: string;
                  dataStoragePolicy: string;
                  knownIssues: string;
                }[] = [];

                jQuery.each(basASRInfoContainers, (key, elem) => {
                  const isStringNumber = (str: string) => !isNaN(Number(str));
                  const sanitizeNumberValue = (el: any, attr: string) => {
                    if (!isUnset(el[attr]) && isStringNumber(el[attr])) {
                      el[attr] = Number(el[attr]);
                    } else {
                      el[attr] = undefined;
                    }
                  };
                  const sanitizeStringValue = (el: any, attr: string) => {
                    if (!isUnset(el[attr]) && typeof el[attr] === 'string') {
                      el[attr] = el[attr].replace(/[\n\t\r]+/g, '');
                    } else {
                      el[attr] = undefined;
                    }
                  };

                  const newElem: any = {
                    name: jQuery(elem).attr('data-bas-asr-info-provider-name'),
                    maxSignalDuration: jQuery(elem).find('.bas-asr-info-max-signal-duration-seconds').attr('data-value'),
                    maxSignalSize: jQuery(elem).find('.bas-asr-info-max-signal-size-megabytes').attr('data-value'),
                    quotaPerMonth: jQuery(elem).find('.bas-asr-info-quota-per-month-seconds').attr('data-value'),
                    termsURL: jQuery(elem).find('.bas-asr-info-eula-link').attr('href'),
                    dataStoragePolicy: jQuery(elem).find('.bas-asr-info-data-storage-policy').text(),
                    knownIssues: jQuery(elem).find('.bas-asr-info-known-issues').text()
                  };

                  sanitizeNumberValue(newElem, 'maxSignalDuration');
                  sanitizeNumberValue(newElem, 'maxSignalSize');
                  sanitizeNumberValue(newElem, 'quotaPerMonth');
                  sanitizeStringValue(newElem, 'dataStoragePolicy');
                  sanitizeStringValue(newElem, 'knownIssues');
                  newElem.knownIssues = (newElem.knownIssues.trim() === 'none') ? undefined : newElem.knownIssues;

                  asrInfos.push(newElem);
                });

                // overwrite data of config
                for (const service of appConfiguration.octra.plugins.asr.services) {
                  if (!isUnset(service.basName)) {
                    const basInfo = asrInfos.find(a => a.name === service.basName);
                    if (!isUnset(basInfo)) {
                      service.dataStoragePolicy = (!isUnset(basInfo.dataStoragePolicy))
                        ? basInfo.dataStoragePolicy : service.dataStoragePolicy;

                      service.maxSignalDuration = (!isUnset(basInfo.maxSignalDuration))
                        ? basInfo.maxSignalDuration : service.maxSignalDuration;

                      service.maxSignalSize = (!isUnset(basInfo.maxSignalSize))
                        ? basInfo.maxSignalSize : service.maxSignalSize;

                      service.knownIssues = (!isUnset(basInfo.knownIssues))
                        ? basInfo.knownIssues : service.knownIssues;

                      service.quotaPerMonth = (!isUnset(basInfo.quotaPerMonth))
                        ? basInfo.quotaPerMonth : service.quotaPerMonth;

                      service.termsURL = (!isUnset(basInfo.termsURL))
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
      if (isUnset(found)) {
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
      }, action.guidelines.meta.validation_url, null).subscribe(
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
