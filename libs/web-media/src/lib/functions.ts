import { getProperties } from '@octra/utilities';
import { BehaviorSubject, Observable } from 'rxjs';
import { AudioFormat } from './audio/AudioFormats';
import { AudioInfo } from './audio/audio-info';

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
        reader.readAsArrayBuffer(file);
        break;
      case 'arraybuffer':
        reader.readAsArrayBuffer(file);
        break;
    }
  });
}

export interface ReadFileEvent<T> {
  status: 'initialized' | 'reading' | 'success';
  progress: number;
  result?: T;
}

export function readFile<T>(
  file: File,
  method: 'text' | 'binary' | 'arraybuffer',
  encoding?: string
): Observable<ReadFileEvent<T>> {
  const subj = new BehaviorSubject<ReadFileEvent<T>>({
    status: 'initialized',
    progress: 0,
  });

  const reader = new FileReader();

  reader.addEventListener('loadend', () => {
    subj.next({
      status: 'success',
      progress: 1,
      result: reader.result as T,
    });
    subj.complete();
  });

  reader.onprogress = (e) => {
    subj.next({
      status: 'reading',
      progress: e.loaded / e.total / 2,
      result: reader.result as T,
    });
  };

  reader.addEventListener('error', (e) => {
    subj.error(e);
  });

  switch (method) {
    case 'text':
      reader.readAsText(file, encoding);
      break;
    case 'binary':
      reader.readAsArrayBuffer(file);
      break;
    case 'arraybuffer':
      reader.readAsArrayBuffer(file);
      break;
  }

  return subj;
}

export function renameFile(
  file: File,
  newName: string,
  attributes: any
): Promise<File> {
  return new Promise<File>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (result: any) => {
      resolve(new File([result.target.result], newName, attributes));
    };
    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsArrayBuffer(file);
  });
}

export function getFileContent(file: File, encoding?: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsText(file, encoding);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
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
      `
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

export function getAudioInfo(
  format: AudioFormat,
  filename: string,
  type: string,
  buffer: ArrayBuffer
): AudioInfo {
  if (format.isValid(buffer)) {
    return new AudioInfo(
      filename,
      type,
      buffer.byteLength,
      format.sampleRate,
      format.duration.samples,
      format.channels,
      format.bitsPerSample
    );
  } else {
    throw new Error(`Audio file is not a valid file.`);
  }
}
