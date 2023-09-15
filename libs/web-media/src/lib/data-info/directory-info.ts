import { DataInfo } from './data-info';
import { FileInfo } from './file-info';

export class DirectoryInfo extends DataInfo {
  private readonly _path: string;

  public constructor(path: string, size?: number) {
    super(DirectoryInfo.extractFolderName(path)!, 'folder', size);
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

  public static async fromFolderObject(
    folder: FileSystemEntry | null
  ): Promise<DirectoryInfo> {
    if (folder) {
      const result = await this.traverseFileTree(folder, '');
      if (result && result[0] instanceof DirectoryInfo) {
        return result[0] as DirectoryInfo;
      } else {
        throw new Error('could not parse directory');
      }
    } else {
      throw new Error('folder not given.');
    }
  }

  public static extractFolderName(path: string): string | undefined {
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
    return undefined;
  }

  private static async traverseFileTree(
    item: FileSystemEntry,
    path?: string
  ): Promise<(FileInfo | DirectoryInfo)[]> {
    const getFile = async (webKitEntry: FileSystemFileEntry) => {
      return new Promise<FileInfo[]>((resolve) => {
        webKitEntry.file((file: File) => {
          if (file.name.indexOf('.') > -1) {
            const fileInfo = new FileInfo(
              file.name,
              file.type,
              file.size,
              file
            );
            resolve([fileInfo]);
          } else {
            resolve([]);
          }
        });
      });
    };

    path = path || '';
    if (item) {
      if (item.isFile) {
        return await getFile(item as FileSystemFileEntry);
      } else {
        // Get folder contents
        const dirEntry = item as FileSystemDirectoryEntry;
        const dirReader = dirEntry.createReader();

        const readEntries = async (dirReader: FileSystemDirectoryReader) => {
          return new Promise<FileSystemEntry[]>((resolve, reject) => {
            dirReader.readEntries(
              (entries: FileSystemEntry[]) => {
                resolve(entries);
              },
              (error: DOMException) => {
                reject(error);
              }
            );
          });
        };

        // there is a possibility that readEntries doesn't return all entries.
        // => read as long as there are no remaining items
        let readItems: FileSystemEntry[] = await readEntries(dirReader);
        let entries: FileSystemEntry[] = [];
        while (readItems.length !== 0) {
          entries = [...entries, ...readItems];
          readItems = await readEntries(dirReader);
        }

        const values: (FileInfo | DirectoryInfo)[][] = [];

        for (const entry of entries) {
          values.push(
            await this.traverseFileTree(entry, path + dirEntry.name + '/')
          );
        }

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

        dir.addEntries(result);
        return [dir];
      }
    } else {
      throw new Error(`item is undefined or undefined`);
    }
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
