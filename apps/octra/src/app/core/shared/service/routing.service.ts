import { Injectable } from '@angular/core';
import { NavigationExtras, QueryParamsHandling, Router } from '@angular/router';
import { removeEmptyProperties } from '@octra/utilities';
import { SessionStorageService } from 'ngx-webstorage';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class RoutingService {
  get staticQueryParams(): any {
    return this._staticQueryParams;
  }

  private _staticQueryParams: any = {};

  // Observable exposing the breadcrumb hierarchy
  constructor(
    private router: Router,
    private sessionStorage: SessionStorageService
  ) {}

  clear() {
    this._staticQueryParams = {};
  }

  public removeStaticParam(name: string) {
    if (Object.keys(this._staticQueryParams).includes(name)) {
      this.staticQueryParams[name] = undefined;
    }
  }

  public addStaticParams(params: Record<string, string | undefined | null>) {
    this._staticQueryParams = {
      ...removeEmptyProperties<Record<string, string | undefined | null>>(
        params
      ),
      ...params,
    };
  }

  public async navigate(
    label: string,
    commands: any[],
    extras?: NavigationExtras,
    queryParamsHandling: QueryParamsHandling | null | undefined = 'merge'
  ) {
    try {
      if (
        environment.debugging.enabled &&
        environment.debugging.logging.routes
      ) {
        console.log(`[RS/${label}] navigate to ${commands.join('/')}`);
      }
      await this.router.navigate(commands, {
        ...extras,
        queryParams: {
          ...extras?.queryParams,
          ...this._staticQueryParams,
        },
        queryParamsHandling,
      });
      const joined = commands.join('/');
      if (joined !== '/load') {
        // this.sessionStorage.store('last_page_path', joined);
      }
    } catch (e) {
      console.error(e);
    }
  }
}
