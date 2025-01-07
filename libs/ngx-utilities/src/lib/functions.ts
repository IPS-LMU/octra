import {
  HttpClient,
  HttpEventType,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { NavigationExtras, Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';

export function uniqueHTTPRequest(
  http: HttpClient,
  post = false,
  requestOptions: any,
  url: string,
  body: any
): Observable<any> {
  if (!post) {
    const options = !(
      requestOptions === undefined || requestOptions === undefined
    )
      ? requestOptions
      : {};

    if (!options['params']) {
      options.params = {};
    }

    const d = Date.now();
    options.params.v = d.toString();
    return http.get(url, options);
  } else {
    return http.post(url, body, requestOptions);
  }
}

/**
 * downloads a File with given response type and type. Reports progress.
 * @param http Angular HTTP client
 * @param url URL for download
 * @param responseType response type
 */
export function downloadFile<T>(
  http: HttpClient,
  url: string,
  responseType: 'arraybuffer' | 'blob' | 'json' | 'text'
): Subject<{
  progress: number;
  result?: T;
}> {
  const subj: Subject<any> = new Subject<any>();

  const req = new HttpRequest('GET', url, {
    reportProgress: true,
    responseType,
  });

  http.request(req).subscribe({
    next: (event: any) => {
      if (event.type === HttpEventType.DownloadProgress) {
        subj.next({
          progress: event.total ? event.loaded / event.total : 0,
        });
      } else if (event instanceof HttpResponse) {
        subj.next({
          progress: 1,
          result: event.body,
        });
        subj.complete();
      }
    },
    error: (error) => {
      subj.error(error);
    },
  });

  return subj;
}

export function navigateTo(
  router: Router,
  commands: any[],
  navigationExtras?: NavigationExtras
): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    setTimeout(() => {
      router.navigate(commands, navigationExtras).then(resolve);
    }, 200);
  });
}
