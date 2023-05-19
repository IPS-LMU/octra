import {Observable, Subject} from 'rxjs';

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

export function base64ToArrayBuffer(base64: any): ArrayBuffer {
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
  sel?.removeAllRanges();
  sel?.addRange(range);
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
    if (Object.keys(elem).includes(el)) {
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
  return regexStr.replace(/[-/\\^$*+?ß%.()|[\]{}]/g, '\\$&');
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

export function setCursor(node: any, pos: any) {

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

export function waitTillResultRetrieved<A1 extends { subscribe: any; }, A2 extends { type: string; }, T>(actions: A1, success: A2, failure: A2) {
  return new Promise<T>((resolve, reject) => {
    const subscr = actions.subscribe((action: A2) => {
      if (action.type === success.type) {
        subscr.unsubscribe();
        let props = {
          ...action
        } as any;
        delete props['type'];
        console.log('props are');
        console.log(props);

        if (Object.keys(props).length === 0) {
          props = undefined;
        }

        resolve(props as T);
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
    (elem.style as any)[name] = value;
  }
}

export function flatten(values: never[]) {
  return values.reduce((acc: never[], val: never[]) => acc.concat(val), []);
}

export function isEmpty(obj: unknown) {
  return ((obj === undefined || obj === null) || (typeof obj === 'string' && obj.trim() === '') || (Array.isArray(obj) && obj.length === 0));
}
