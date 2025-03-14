/**
 * represents a file size definition giving size and label.
 */
export interface FileSize {
  size: number;
  label: string;
}

/**
 * checks if value is a function
 * @param value
 */
export function isFunction(value: any) {
  return typeof value === 'function';
}

/**
 * checks if a given string contains a given substring
 * @param haystack string that should be searched
 * @param needle substring that is searched for
 */
export function contains(haystack: string, needle: string): boolean {
  return haystack.indexOf(needle) !== -1;
}

/**
 * checks if a object has a value at given property path
 * @param obj
 * @param treeString
 */
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

/**
 * converts base64 to ArrayBuffer
 * @param base64
 */
export function base64ToArrayBuffer(base64String: string): any {
  const len = base64String.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = base64String.charCodeAt(i);
  }
  return bytes.buffer as ArrayBuffer;
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
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function unEscapeHtml(text: string): string {
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
  } else if (pos === input.length + 1) {
    result += insertion;
  } else {
    console.error('String cannot be inserted at position ' + pos);
    console.error(`${pos} in ${input.length}`);
  }

  return result;
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
 * this method is like path.join() just for URL
 * @param args
 */
export function joinURL(...args: string[]) {
  return args
    .map((a) => {
      const httpsArr = /(https?:\/\/)/g.exec(a);
      const https = httpsArr ? httpsArr[1] : '';

      const result =
        https + a.replace(/https?:\/\//g, '').replace(/(^\/+)|(\/$)/g, '');
      return result;
    })
    .filter((a) => a !== null && a !== undefined && a !== '')
    .join('/');
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
  },
): T {
  if (Array.isArray(obj)) {
    const filtered = obj.filter(
      (a) =>
        (!options.removeUndefined || a !== undefined) &&
        (!options.removeNull || a !== null) &&
        (!options.removeEmptyStrings ||
          typeof a !== 'string' ||
          a.trim() !== ''),
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
  fn: (key: string, value: any) => any,
) {
  Object.keys(obj).forEach((key: string) => {
    obj[key] = fn(key, obj[key]);
  });
  return obj;
}

export function getTranscriptFromIO(io: any[]): any | undefined {
  return io.find(
    (a) =>
      !a.fileType!.includes('audio') &&
      !a.fileType!.includes('video') &&
      !a.fileType!.includes('image'),
  );
}

export function popupCenter(url: string, title: string, w: number, h: number) {
  const dualScreenLeft =
    window.screenLeft !== undefined ? window.screenLeft : window.screenX;
  const dualScreenTop =
    window.screenTop !== undefined ? window.screenTop : window.screenY;

  const width = window.innerWidth
    ? window.innerWidth
    : document.documentElement.clientWidth
      ? document.documentElement.clientWidth
      : screen.width;
  const height = window.innerHeight
    ? window.innerHeight
    : document.documentElement.clientHeight
      ? document.documentElement.clientHeight
      : screen.height;

  const systemZoom = width / window.screen.availWidth;
  const left = (width - w) / 2 / systemZoom + dualScreenLeft;
  const top = (height - h) / 2 / systemZoom + dualScreenTop;
  const newWindow = window.open(
    url,
    title,
    `
      toolbar=no,
      menubar=no,
      scrollbars=yes,
      width=${w / systemZoom},
      height=${h / systemZoom},
      top=${top},
      left=${left}
      `,
  );

  if ((window as any).focus && newWindow) {
    newWindow.focus();
  }
}

/**
 * returns the base URL path to the application
 */
export function getBaseHrefURL() {
  return (
    location.origin + document.querySelector('head base')?.getAttribute('href')
  );
}

/**
 * converts time declaration from string to unix time (miliseconds).
 *
 * @param duration e.g. 2d, 1h, 5m
 */
export function convertDurationToUnix(duration: string) {
  if (duration) {
    const matches = /([0-9]+)([mhd])/g.exec(duration);
    if (matches && matches.length > 2) {
      if (matches[2] === 'm') {
        return Number(matches[1]) * 60 * 1000;
      }
      if (matches[2] === 'h') {
        return Number(matches[1]) * 60 * 60 * 1000;
      }
      if (matches[2] === 'd') {
        return Number(matches[1]) * 60 * 60 * 24 * 1000;
      }
    }
  }
  return undefined;
}

/**
 * returns the file name and extension part of an URL. Extension contains the dot.
 * @param url
 */
export function extractFileNameFromURL(url: string): {
  name: string;
  extension: string;
} {
  if (url.includes('?')) {
    url = url.split('?')[0];
  }
  let matches = /\/([^/?]*)$/g.exec(url);

  if (matches === null || matches.length < 2) {
    throw new Error("Can't read file from URL 1.");
  }

  matches = /([^.]+)(\.[^.]+)?$/g.exec(matches[1]);

  if (matches === null || matches.length < 2) {
    throw new Error("Can't read file from URL 2.");
  }

  return {
    name: decodeURI(matches[1]),
    extension: matches[2],
  };
}

/**
 * returns a string representing query parameters and their values without empty values.
 * @param params
 */
export function stringifyQueryParams(params: Record<string, any>) {
  if (!params) {
    return '';
  }

  const strArray: string[] = [];

  for (const key of Object.keys(params)) {
    if (params[key] !== undefined) {
      strArray.push(`${key}=${params[key]}`);
    }
  }

  return strArray.length > 0 ? `?${strArray.join('&')}` : '';
}

/**
 * waits a given time asynchronously
 * @param seconds
 */
export async function wait(seconds: number): Promise<void> {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, seconds * 1000);
  });
}

/**
 * appends given query parameters to a given URL
 * @param url
 * @param params
 */
export function appendURLQueryParams(
  url: string,
  params: Record<string, string | number | boolean>,
) {
  let startingLetter = '?';
  if (/[^/]*\?([^/]*)$/g.exec(url)) {
    startingLetter = '&';
  }
  const array: string[] = [];

  for (const attr in params) {
    if (params[attr] !== undefined && params[attr] !== null) {
      array.push(`${attr}=${encodeURI(params[attr].toString())}`);
    }
  }

  const query = array.length > 0 ? `${startingLetter}${array.join('&')}` : '';
  return `${url}${query}`;
}

export function filterUnique<T>(array: T[], isEqual: (a: T, b: T) => boolean) {
  return array.filter(
    (a: T, i: number) => array.findIndex((b: T) => isEqual(a, b)) === i
  );
}
