import {DataInfo} from './dataInfo';
import {FileInfo} from './fileInfo';

export class DirectoryInfo extends DataInfo {
  private readonly _path: string;

  public constructor(path: string, size?: number) {
    super(DirectoryInfo.extractFolderName(path), 'folder', size);
    this._path = path;
  }

  get path(): string {
    return this._path;
  }

  private _entries: (FileInfo | DirectoryInfo)[] = [];

  get entries(): (FileInfo | DirectoryInfo)[] {
    return this._entries;
  }

  set entries(value: (FileInfo | DirectoryInfo)[]) {
    this._entries = value;
  }

  public static fromFolderObject(folder: DataTransferItem): Promise<DirectoryInfo> {
    return new Promise<DirectoryInfo>((resolve, reject) => {
      if (folder) {
        DirectoryInfo.traverseFileTree(folder, '').then((result) => {
          if (!(result === null || result === undefined) && result[0] instanceof DirectoryInfo) {
            resolve(result[0] as DirectoryInfo);
          } else {
            reject('could not parse directory');
          }
        }).catch(error => {
          reject(error);
        });
      } else {
        reject('folder not given.');
      }
    });
  }

  public static extractFolderName(path: string): string {
    if (path !== '') {
      let extensionBegin = path.lastIndexOf('/');
      if (extensionBegin > -1) {
        // split name and extension
        let foldername = path.substr(0, extensionBegin);

        extensionBegin = foldername.lastIndexOf('/');
        if (extensionBegin > -1) {
          foldername = foldername.substr(extensionBegin + 1);
        }

        return foldername;
      } else {
        throw new Error('invalid folder path.');
      }
    }
    return null;
  }

  private static traverseFileTree(item: (DataTransferItem | any), path): Promise<(FileInfo | DirectoryInfo)[]> {
    // console.log(`search path: ${path}`);
    return new Promise<(FileInfo | DirectoryInfo)[]>((resolve, reject) => {
        path = path || '';
        if (!(item === null || item === undefined)) {
          let webKitEntry: any;

          if (item instanceof DataTransferItem) {
            webKitEntry = item.webkitGetAsEntry();
          } else {
            webKitEntry = item as any;
          }

          if (webKitEntry.isFile) {
            // console.log(`isFile ${item.fullPath}`);
            // Get file

            if (item instanceof DataTransferItem) {
              const file = item.getAsFile();

              if (!(file === null || file === undefined)) {
                if (file.name.indexOf('.') > -1) {
                  const fileInfo = new FileInfo(file.name, file.type, file.size, file);
                  resolve([fileInfo]);
                } else {
                  resolve([]);
                }
              } else {
                reject(`could not read file`);
              }
            } else {
              // item is FileEntry

              (webKitEntry as any).file((file: any) => {
                if (file.name.indexOf('.') > -1) {
                  const fileInfo = new FileInfo(file.name, file.type, file.size, file);
                  resolve([fileInfo]);
                } else {
                  resolve([]);
                }
              });
            }
          } else if (webKitEntry.isDirectory) {
            // Get folder contents
            // console.log(`is dir ${item.fullPath}`);
            const dirEntry: any = webKitEntry as any;
            const dirReader = dirEntry.createReader();
            dirReader.readEntries((entries: any) => {
              const promises: Promise<(FileInfo | DirectoryInfo)[]>[] = [];
              for (const entry of entries) {
                promises.push(this.traverseFileTree(entry, path + dirEntry.name + '/'));
              }
              Promise.all(promises).then((values: (FileInfo | DirectoryInfo)[][]) => {
                const dir = new DirectoryInfo(path + dirEntry.name + '/');
                let result: (FileInfo | DirectoryInfo)[] = [];

                for (const value of values) {
                  for (const val of value) {
                    result.push(val);
                  }
                }

                result = result.sort((a, b) => {
                  if (a instanceof FileInfo && b instanceof FileInfo) {
                    const a2 = a as FileInfo;
                    const b2 = b as FileInfo;

                    return a2.name.localeCompare(b2.name);
                  } else if (a instanceof DirectoryInfo && b instanceof DirectoryInfo) {
                    const a2 = a as DirectoryInfo;
                    const b2 = b as DirectoryInfo;

                    return a2.path.localeCompare(b2.path);
                  } else {
                    return 0;
                  }
                });

                // console.log(result);
                dir.addEntries(result);
                // console.log(`dir with ${result.length} found`);
                resolve([dir]);
              });
            });
          }
        } else {
          reject(`item is null or undefined`);
        }
      }
    );
  }

  public addEntries(entries: (FileInfo | DirectoryInfo)[]) {
    for (const entry of entries) {
      this._entries.push(entry);
    }
  }

  public clone() {
    const result = new DirectoryInfo(this.path, this.size);
    result._entries = this.entries;

    return result;
  }
}
