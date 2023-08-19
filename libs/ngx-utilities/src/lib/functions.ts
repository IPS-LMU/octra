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

export function downloadFile(
  http: HttpClient,
  url: string
): Subject<{
  progress: number;
  result: any;
}> {
  const subj: Subject<any> = new Subject<any>();

  const req = new HttpRequest('GET', url, {
    reportProgress: true,
    responseType: 'arraybuffer',
  });

  http.request(req).subscribe(
    (event: any) => {
      if (event.type === HttpEventType.DownloadProgress) {
        subj.next({
          progress: event.total ? event.loaded / event.total : 0,
          result: undefined,
        });
      } else if (event instanceof HttpResponse) {
        subj.next({
          progress: 1,
          result: event.body,
        });
        subj.complete();
      }
    },
    (error) => {
      subj.error(error);
    }
  );

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
