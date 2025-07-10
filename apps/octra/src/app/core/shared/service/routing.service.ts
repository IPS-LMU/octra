import { inject, Injectable } from '@angular/core';
import { NavigationExtras, QueryParamsHandling, Router } from '@angular/router';
import { removeEmptyProperties } from '@octra/utilities';
import { SessionStorageService } from 'ngx-webstorage';
import { environment } from '../../../../environments/environment';
import { URLParameters } from '../../store/application';
import { NavbarService } from '../../component/navbar/navbar.service';

@Injectable({
  providedIn: 'root',
})
export class RoutingService {
  private router = inject(Router);
  private navbarService = inject(NavbarService);
  private sessionStorage = inject(SessionStorageService);

  get staticQueryParams(): URLParameters {
    return this._staticQueryParams;
  }

  private _staticQueryParams: URLParameters = {};

  clear() {
    this._staticQueryParams = {};
  }

  public removeStaticParam(name: string) {
    if (Object.keys(this._staticQueryParams).includes(name)) {
      this.staticQueryParams[name] = undefined;
    }
  }

  public addStaticParams(
    params: Record<string, string | boolean | number | undefined | null>,
  ) {
    this._staticQueryParams = {
      ...removeEmptyProperties<
        Record<string, string | boolean | number | undefined | null>
      >(params),
      ...params,
    };
  }

  public async navigate(
    label: string,
    commands: any[],
    extras?: NavigationExtras,
    queryParamsHandling: QueryParamsHandling | null | undefined = 'merge',
  ) {
    try {
      this.navbarService.isCollapsed = true;
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
