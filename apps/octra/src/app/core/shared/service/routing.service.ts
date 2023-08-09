import { Injectable } from '@angular/core';
import { NavigationExtras, QueryParamsHandling, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SubscriptionManager } from '@octra/utilities';
import { SessionStorageService } from 'ngx-webstorage';

@Injectable({
  providedIn: 'root',
})
export class RoutingService {
  get staticQueryParams(): any {
    return this._staticQueryParams;
  }

  private _staticQueryParams: any = {};

  private readonly subscrManager = new SubscriptionManager<Subscription>();
  // Observable exposing the breadcrumb hierarchy
  constructor(
    private router: Router,
    private sessionStorage: SessionStorageService
  ) {}

  public removeStaticParam(name: string) {
    if (Object.keys(this._staticQueryParams).includes(name)) {
      this.staticQueryParams[name] = undefined;
    }
  }

  public addStaticParams(params: Record<string, string>) {
    this._staticQueryParams = {
      ...this._staticQueryParams,
      ...params,
    };
  }

  public async navigate(
    commands: any[],
    extras?: NavigationExtras,
    queryParamsHandling: QueryParamsHandling | null | undefined = 'merge'
  ) {
    console.error(`RS navigate to ${commands.join('/')}`);
    try {
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
        this.sessionStorage.store('last_page_path', joined);
      }
    } catch (e) {
      console.error(e);
    }
  }
}