import { DataInfo } from './data-info';
import { FileInfo } from './file-info';

export class DirectoryInfo<
  D extends object = any,
  F extends object = any,
> extends DataInfo<D> {
  private readonly _path: string;

  public constructor(path: string, size?: number) {
    super(DirectoryInfo.extractFolderName(path)!, 'folder', size);
    this._path = path;
  }

  get path(): string {
    return this._path;
  }

  private _entries: (FileInfo<F> | DirectoryInfo<D, F>)[] = [];

  get entries(): (FileInfo<F> | DirectoryInfo<D, F>)[] {
    return this._entries;
  }

  set entries(value: (FileInfo<F> | DirectoryInfo<D, F>)[]) {
    this._entries = value;
  }

  public static async fromFolderObject<D extends object, F extends object>(
    folder: FileSystemEntry | null,
  ): Promise<DirectoryInfo<D, F>> {
    if (folder) {
      const result = await this.traverseFileTree<D, F>(folder, '');
      if (result && result[0] instanceof DirectoryInfo) {
        return result[0] as DirectoryInfo<D, F>;
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
        let foldername = path.substring(0, extensionBegin);

        extensionBegin = foldername.lastIndexOf('/');
        if (extensionBegin > -1) {
          foldername = foldername.substring(extensionBegin + 1);
        }

        return foldername;
      } else {
        throw new Error('invalid folder path.');
      }
    }
    return undefined;
  }

  private static async traverseFileTree<D extends object, F extends object>(
    item: FileSystemEntry,
    path?: string,
  ): Promise<(FileInfo<F> | DirectoryInfo<D, F>)[]> {
    const getFile = async (webKitEntry: FileSystemFileEntry) => {
      return new Promise<FileInfo<F>[]>((resolve) => {
        webKitEntry.file((file: File) => {
          if (file.name.indexOf('.') > -1) {
            const fileInfo = new FileInfo<F>(
              file.name,
              file.type,
              file.size,
              file,
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
              },
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

        const values: (FileInfo<F> | DirectoryInfo<D, F>)[][] = [];

        for (const entry of entries) {
          values.push(
            await this.traverseFileTree(entry, path + dirEntry.name + '/'),
          );
        }

        const dir = new DirectoryInfo<D, F>(path + dirEntry.name + '/');
        let result: (FileInfo<F> | DirectoryInfo<D, F>)[] = [];

        for (const value of values) {
          for (const val of value) {
            result.push(val);
          }
        }

        result = result.sort((a, b) => {
          if (a instanceof FileInfo && b instanceof FileInfo) {
            const a2 = a as FileInfo<F>;
            const b2 = b as FileInfo<F>;

            return a2.name.localeCompare(b2.name);
          } else if (a instanceof DirectoryInfo && b instanceof DirectoryInfo) {
            const a2 = a as DirectoryInfo<D, F>;
            const b2 = b as DirectoryInfo<D, F>;

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

  public addEntries(entries: (FileInfo<F> | DirectoryInfo<D, F>)[]) {
    for (const entry of entries) {
      this._entries.push(entry);
    }
  }

  public override clone(): DirectoryInfo<D, F> {
    const result = new DirectoryInfo<D, F>(this._path, this._size);
    result._entries = this.entries.map((a) => a.clone());
    result._hash = this._hash;
    result._attributes = { ...this._attributes } as D;
    result._type = this._type;

    return result;
  }
}
