import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Data, NavigationExtras, Params, QueryParamsHandling, Router } from '@angular/router';
import { BehaviorSubject, Subscription } from 'rxjs';
import { SubscriptionManager } from '@octra/utilities';
import { filter } from 'rxjs/operators';

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
  constructor(private router: Router) {}

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

  public navigate(commands: any[], extras?: NavigationExtras, queryParamsHandling: QueryParamsHandling | null | undefined = 'merge') {
    console.error(`RS navigate to ${commands.join('/')}`);
    return this.router.navigate(commands, {
      ...extras,
      queryParams: {
        ...extras?.queryParams,
        ...this._staticQueryParams,
      },
      queryParamsHandling,
    });
  }
}
