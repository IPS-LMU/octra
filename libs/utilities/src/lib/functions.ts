import {HttpClient, HttpEventType, HttpRequest, HttpResponse} from '@angular/common/http';
import {NavigationExtras, Router} from '@angular/router';
import {Action} from '@ngrx/store';
import {Actions} from '@ngrx/effects';
import {Observable} from 'rxjs/internal/Observable';
import {Subject} from 'rxjs/internal/Subject';

export interface FileSize {
  size: number;
  label: string;
}

export function obj() {
  return (obj === undefined || typeof obj === 'undefined');
}

export function isFunction(value: any) {
  return typeof value === 'function';
}

export function contains(haystack: string, needle: string): boolean {
  return haystack.indexOf(needle) !== -1;
}

export function hasPropertyTree(obj: any, treeString: string): boolean {
  if (obj !== undefined) {
    const properties = treeString.split('.').filter(a => a !== undefined && a.trim() !== '');
    let pointer = obj;

    for (let i = 0; i < properties.length; i++) {
      const property = properties[i];
      if (!hasProperty(pointer, property) || pointer[property] === undefined) {
        return false;
      }
      pointer = pointer[property];
    }

    return true;
  } else {
    return false;
  }
}

export function base64ToArrayBuffer(base64): ArrayBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return (bytes.buffer as ArrayBuffer);
}

export function selectAllTextOfNode(el: any) {
  const range = document.createRange();
  range.selectNodeContents(el);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

export function checkArray(array: any[]) {
  return array.findIndex(a => a === undefined) < 0;
}


export function scrollTo(y: number, target?: string) {
  setTimeout(() => {
    if (target === undefined) {
      // TODO jquery jQuery('html, body').scrollTop(y);
    } else {
      // TODO jquery jQuery(target).scrollTop(y);
    }
  }, 200);
}

export function isNumber(str: string): boolean {
  const res = parseInt(str, 10);
  return !isNaN(res);
}

export function equalProperties(elem: any, elem2: any) {
  let result = false;

  for (const el in elem) {
    if (elem.hasOwnProperty(el)) {
      const propStr = '' + el + '';
      result = true;
      if (!(propStr in elem2)) {
        return false;
      }
    }
  }

  return result;
}

export function escapeRegex(regexStr: string) {
  // escape special chars in regex
  return regexStr.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

export function getFileSize(bytes: number): FileSize {
  const result: FileSize = {
    size: 0,
    label: ''
  };

  if ((bytes / 1000) < 1) {
    // take bytes
    result.size = bytes;
    result.label = 'B';
  } else if (bytes / (1000 * 1000) < 1) {
    // take kilobytes
    result.size = bytes / 1000;
    result.label = 'KB';
  } else if (bytes / (1000 * 1000 * 1000) < 1) {
    // take megabyte
    result.size = bytes / 1000 / 1000;
    result.label = 'MB';
  } else if (bytes / (1000 * 1000 * 1000 * 1000) < 1) {
    // take gigabytes

    result.size = bytes / 1000 / 1000 / 1000;
    result.label = 'GB';
  }

  result.size = Math.round(result.size * 1000) / 1000;

  return result;
}

export function escapeHtml(text: string): string {
  // TODO improve code!

  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function unEscapeHtml(text: string): string {
  // TODO improve code!

  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, '\'');
}

export function insertString(input: string, pos: number, insertion: string): string {
  let result = input;

  if (pos <= input.length) {
    result = result.substring(0, pos) + insertion + result.substring(pos);
  } else {
    throw new Error('String cannot be inserted at position ' + pos);
  }

  return result;
}

export function uniqueHTTPRequest(http: HttpClient, post = false, requestOptions: any,
                                  url: string, body: any): Observable<any> {
  if (!post) {
    const options = (!(requestOptions === undefined || requestOptions === undefined)) ? requestOptions : {};

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

export function downloadFile(http: HttpClient, url: string): Subject<{
  progress: number,
  result: any
}> {
  const subj: Subject<any> = new Subject<any>();

  const req = new HttpRequest('GET', url, {
    reportProgress: true,
    responseType: 'arraybuffer'
  });

  http.request(req).subscribe(event => {
      if (event.type === HttpEventType.DownloadProgress) {
        subj.next({
          progress: event.loaded / event.total,
          result: undefined
        });
      } else if (event instanceof HttpResponse) {
        subj.next({
          progress: 1,
          result: event.body
        });
        subj.complete();
      }
    },
    error => {
      subj.error(error);
    });

  return subj;
}

export function setCursor(node, pos) {

  node = (typeof node === 'string' || node instanceof String) ? document.getElementById('' + node + '') : node;

  if (!node) {
    return false;
  } else if (node.createTextRange) {
    const textRange = node.createTextRange();
    textRange.collapse(true);
    textRange.moveEnd(pos);
    textRange.moveStart(pos);
    textRange.select();
    return true;
  } else if (node.setSelectionRange) {
    node.setSelectionRange(pos, pos);
    return true;
  }

  return false;
}

export function navigateTo(router: Router, commands: any[], navigationExtras?: NavigationExtras): Promise<boolean> {
  console.log(`navigate to ${commands[0]}`);
  return new Promise<boolean>((resolve) => {
    setTimeout(() => {
      router.navigate(commands, navigationExtras).then(resolve);
    }, 200);
  });
}

export function fileListToArray(fileList: FileList): File[] {
  const result = [];

  // tslint:disable-next-line:prefer-for-of
  for (let i = 0; i < fileList.length; i++) {
    result.push(fileList[i]);
  }
  return result;
}

export function afterTrue(observable: Observable<boolean>): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const subscription = observable.subscribe(
      (value) => {
        if (value === true) {
          try {
            subscription.unsubscribe();
          } catch (e) {
            // ignore
          }
          resolve();
        }
      },
      (error) => {
        reject(error);
      },
      () => {
        reject('comnpleted!');
      }
    )
  });
}

export function afterDefined(observable: Observable<any>): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    const subscription = observable.subscribe(
      (value) => {
        if (value !== undefined) {
          console.log(`is defined`);
          try {
            subscription.unsubscribe();
          } catch (e) {
            // ignore
          }
          resolve(value);
        }
      },
      (error) => {
        reject(error);
      }
    )
  });
}

export function waitTillResultRetrieved(actions: Actions, success: Action, failure: Action) {
  return new Promise<void>((resolve, reject) => {
    const subscr = actions.subscribe((action: Action) => {
      if (action.type === success.type) {
        subscr.unsubscribe();
        resolve();
      } else if (action.type === failure.type) {
        subscr.unsubscribe();
        reject(`${(failure as any).error}`);
      }
    });
  });
}

export function hasProperty(obj: unknown, attribute: string) {
  return getProperties(obj).findIndex(([key]) => key === attribute) > -1;
}

export function getProperties(obj: any): [string, any][] {
  if (obj !== undefined && obj !== null) {
    return Object.entries(obj);
  }
  return [];
}

export function findElements(parent: HTMLElement, selector: string) {
  if (parent) {
    const result = parent.querySelectorAll(selector) as any;
    return (result !== undefined) ? (result as HTMLElement[]) : [];
  }
  return [];
}

export function getAttr(elem: HTMLElement, attribute: string) {
  if (elem.getAttribute !== undefined) {
    const result = elem.getAttribute(attribute);
    return result !== null ? result : undefined;
  }
  return undefined;
}

export function setStyle(elem: HTMLElement, styleObj: any) {
  const styles = getProperties(styleObj);
  for (const [name, value] of styles) {
    elem.style[name] = value;
  }
}
