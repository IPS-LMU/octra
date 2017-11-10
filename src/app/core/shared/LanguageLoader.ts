import {TranslateLoader} from '@ngx-translate/core';
import 'rxjs/add/operator/map';
import {Functions} from './Functions';
import {HttpClient} from '@angular/common/http';

export class LanguageLoader implements TranslateLoader {
  constructor(private http: HttpClient, private prefix: string = '/assets/i18n/', private suffix: string = '.json') {
  }

  /**
   * Gets the translations from the server
   * @param lang
   * @returns {any}
   */
  public getTranslation(lang: string): any {
    return Functions.uniqueHTTPRequest(this.http, false, null, `${this.prefix}${lang}${this.suffix}`, null);
  }
}
