import { Observable } from 'rxjs';
import { TaskInputOutputDto } from '@octra/api-types';

export interface FileSize {
  size: number;
  label: string;
}

export function obj() {
  return obj === undefined || typeof obj === 'undefined';
}

export function isFunction(value: any) {
  return typeof value === 'function';
}

export function contains(haystack: string, needle: string): boolean {
  return haystack.indexOf(needle) !== -1;
}

export function hasPropertyTree(obj: any, treeString: string): boolean {
  if (obj !== undefined) {
    const properties = treeString
      .split('.')
      .filter((a) => a !== undefined && a.trim() !== '');
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
  return bytes.buffer as ArrayBuffer;
}

export function selectAllTextOfNode(el: any) {
  const range = document.createRange();
  range.selectNodeContents(el);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}

export function checkArray(array: any[]) {
  return array.findIndex((a) => a === undefined) < 0;
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
    label: '',
  };

  if (bytes / 1000 < 1) {
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
    .replace(/&#039;/g, "'");
}

export function insertString(
  input: string,
  pos: number,
  insertion: string
): string {
  let result = input;

  if (pos <= input.length) {
    result = result.substring(0, pos) + insertion + result.substring(pos);
  } else {
    throw new Error('String cannot be inserted at position ' + pos);
  }

  return result;
}

export function setCursor(node: any, pos: any) {
  node =
    typeof node === 'string' || node instanceof String
      ? document.getElementById('' + node + '')
      : node;

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
    );
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
    );
  });
}

export function waitTillResultRetrieved<
  A1 extends { subscribe: any },
  A2 extends {
    type: string;
  },
  T
>(actions: A1, success: A2, failure: A2) {
  return new Promise<T>((resolve, reject) => {
    const subscr = actions.subscribe((action: A2) => {
      if (action.type === success.type) {
        subscr.unsubscribe();
        let props = {
          ...action,
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
    return result !== undefined ? (result as HTMLElement[]) : [];
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
  return (
    obj === undefined ||
    obj === null ||
    (typeof obj === 'string' && obj.trim() === '') ||
    (Array.isArray(obj) && obj.length === 0)
  );
}

/**
 * returns the last element of an array.
 * @param array
 * @returns undefined if not found
 */
export function last<T>(array: T[] | undefined) {
  if (!Array.isArray(array)) {
    throw new Error(`Not an array.`);
  }

  if (!array || array.length === 0) {
    return undefined;
  }

  return array.slice(-1)[0];
}

/**
 * creates a range with start and end number.
 * @param start
 * @param end
 */
export const range = (start: number, end: number) =>
  Array.from({ length: end - start }, (v, k) => k + start);

/**
 * removes all empty values from an given object.
 * @param obj
 * @param options
 */
export function removeEmptyProperties<T>(
  obj: T,
  options: {
    removeEmptyStrings?: boolean;
    removeNull?: boolean;
    removeUndefined?: boolean;
  } = {
    removeEmptyStrings: true,
    removeNull: true,
    removeUndefined: true,
  }
): T {
  if (Array.isArray(obj)) {
    const filtered = obj.filter(
      (a) =>
        (!options.removeUndefined || a !== undefined) &&
        (!options.removeNull || a !== null) &&
        (!options.removeEmptyStrings ||
          typeof a !== 'string' ||
          a.trim() !== '')
    );
    return filtered.map((a) => removeEmptyProperties<T>(a, options)) as T;
  } else {
    if (typeof obj === 'object') {
      const anyObj = obj as any;
      const keys = Object.keys(anyObj ?? {});

      for (const key of keys) {
        if (
          (options.removeNull && anyObj[key] === null) ||
          (options.removeUndefined && anyObj[key] === undefined) ||
          (anyObj[key] !== undefined &&
            anyObj[key] !== null &&
            anyObj[key].toString() === 'NaN') ||
          (options.removeEmptyStrings &&
            typeof anyObj[key] === 'string' &&
            anyObj[key].toString().trim() === '')
        ) {
          delete anyObj[key];
        } else if (typeof anyObj[key] === 'object') {
          anyObj[key] = removeEmptyProperties(anyObj[key], options);
        }
      }
      return anyObj;
    }
  }
  return obj;
}

/**
 * maps a function fn on all property values.
 * @param obj
 * @param fn
 */
export function mapFnOnObject(
  obj: Record<string, any>,
  fn: (key: string, value: any) => any
) {
  Object.keys(obj).forEach((key: string) => {
    obj[key] = fn(key, obj[key]);
  });
  return obj;
}

export async function downloadFile(
  url: string,
  type: XMLHttpRequestResponseType = 'text'
): Promise<File> {
  return new Promise<File>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.responseType = type;
    xhr.open('get', url, true);
    xhr.addEventListener('load', (result) => {
      resolve(xhr.response);
    });
    xhr.addEventListener('error', (error) => {
      reject(error);
    });
    xhr.send();
  });
}

export async function readFileContents<T>(
  file: File,
  method: 'text' | 'binary' | 'arraybuffer',
  encoding?: string
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('loadend', () => {
      resolve(reader.result as T);
    });
    reader.addEventListener('error', (e) => {
      reject(e);
    });

    switch (method) {
      case 'text':
        reader.readAsText(file, encoding);
        break;
      case 'binary':
        reader.readAsBinaryString(file);
        break;
      case 'arraybuffer':
        reader.readAsArrayBuffer(file);
        break;
    }
  });
}

export function getTranscriptFromIO(
  io: TaskInputOutputDto[]
): TaskInputOutputDto | undefined {
  return io.find(
    (a) =>
      !a.fileType!.includes('audio') &&
      !a.fileType!.includes('video') &&
      !a.fileType!.includes('image')
  )!;
}
