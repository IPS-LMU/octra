import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { Store } from '@ngrx/store';
import {
  AnnotationLevelType,
  Converter,
  IFile,
  ImportResult,
  OAnnotJSON,
  OLabel,
  OSegment,
  OSegmentLevel,
} from '@octra/annotation';
import { OAudiofile } from '@octra/media';
import { contains, escapeRegex, FileSize, getFileSize } from '@octra/utilities';
import { AudioManager, readFile } from '@octra/web-media';
import { timer } from 'rxjs';
import { AppInfo } from '../../../app.info';
import { ImportOptionsModalComponent } from '../../modals/import-options-modal/import-options-modal.component';
import { OctraModalService } from '../../modals/octra-modal.service';
import { SupportedFilesModalComponent } from '../../modals/supportedfiles-modal/supportedfiles-modal.component';
import { FileProgress } from '../../obj/objects';
import { LoginMode, RootState } from '../../store';
import { LoginModeActions } from '../../store/login-mode';
import { DefaultComponent } from '../default.component';
import { DropZoneComponent } from '../drop-zone';

@Component({
  selector: 'octra-dropzone',
  templateUrl: './octra-dropzone.component.html',
  styleUrls: ['./octra-dropzone.component.scss'],
})
export class OctraDropzoneComponent extends DefaultComponent {
  @ViewChild('dropzone', { static: true }) dropzone!: DropZoneComponent;
  @Input() height = '250px';
  @Output() filesAdded = new EventEmitter<File[]>();

  private _audioManager?: AudioManager;

  get AppInfo(): AppInfo {
    return AppInfo;
  }

  get audioManager(): AudioManager | undefined {
    return this._audioManager;
  }

  public _files: FileProgress[] = [];

  public get files(): FileProgress[] {
    return this._files;
  }

  private _oaudiofile?: OAudiofile;

  get oaudiofile(): OAudiofile | undefined {
    return this._oaudiofile;
  }

  private _oannotation?: OAnnotJSON;

  get oannotation(): OAnnotJSON | undefined {
    return this._oannotation;
  }

  private _status!: string;

  get status(): string {
    return this._status;
  }

  constructor(
    private modService: OctraModalService,
    private store: Store<RootState>
  ) {
    super();
  }

  public afterDrop = async () => {
    this._oannotation = undefined;
    const files = this.dropzone.files!;
    for (const file of files) {
      const fileProcess: FileProgress = {
        status: 'waiting',
        name: file.name,
        file,
        type: file.type,
        size: file.size,
        checked_converters: 0,
        progress: 0,
        error: '',
      };

      const supportedAudioFormats = [
        ...AppInfo.audioformats.map((a) => a.supportedFormats),
      ].flat();

      if (AudioManager.isValidAudioFileName(file.name, AppInfo.audioformats)) {
        // the latest dropped file is an audio file
        this.resetFormatFileProgresses();

        // drop previous audio files
        this.dropFiles('audio');
        this._oaudiofile = undefined;

        const formatLimitation = supportedAudioFormats.find((a) =>
          file.name.includes(a.extension)
        );

        this._files.push(fileProcess);
        fileProcess.status = 'progress';
        if (formatLimitation && file.size <= formatLimitation.maxFileSize) {
          this.subscriptionManager.add(
            readFile<ArrayBuffer>(file, 'arraybuffer').subscribe({
              next: (a) => {
                fileProcess.progress = a.progress;

                if (a.progress === 1) {
                  if (file.size <= AppInfo.maxAudioFileSize * 1024 * 1024) {
                    this.decodeArrayBuffer(a.result!, this._files.length - 1);
                  } else {
                    fileProcess.status = 'invalid';
                    fileProcess.error = `The file size is bigger than ${AppInfo.maxAudioFileSize} MB.`;
                  }
                }
              },
            })
          );
        } else {
          fileProcess.status = 'invalid';
          fileProcess.error = 'File size is invalid.';
        }
        break;
      } else {
        this.dropFiles('transcript');
        this._files.push(fileProcess);
        fileProcess.error = 'progress';
        this.subscribe(readFile<string>(file, 'text', 'utf-8'), {
          next: (a) => {
            fileProcess.progress = a.progress;
            if (a.progress === 1) {
              fileProcess.content = a.result;
            }
            this.checkState();
          },
          complete: () => {
            this.isValidImportData(fileProcess);
          },
        });
      }
    }
  };

  public async isValidImportData(fileProgress: FileProgress) {
    if (this._oaudiofile !== undefined) {
      for (let i = 0; i < AppInfo.converters.length; i++) {
        let converter: Converter = AppInfo.converters[i];
        if (
          new RegExp(
            `${converter.extensions
              .map((a) => `(?:${escapeRegex(a)})`)
              .join('|')}$`
          ).exec(fileProgress.name.toLowerCase()) !== null
        ) {
          if (converter.conversion.import) {
            const ofile: IFile = {
              name: fileProgress.name,
              type: fileProgress.type,
              content: fileProgress.content as string,
              encoding: converter.encoding,
            };

            const audioName = this._oaudiofile!.name.substring(
              0,
              this._oaudiofile!.name.lastIndexOf('.')
            );

            const optionsSchema: any = converter.needsOptionsForImport(
              ofile,
              this._oaudiofile!
            );
            fileProgress.needsOptions = optionsSchema;
            fileProgress.converter = converter;

            if (optionsSchema) {
              await this.openImportOptionsModal(fileProgress);
            }

            const importResult: ImportResult | undefined = converter.import(
              ofile,
              this._oaudiofile!,
              fileProgress.options
            );

            const setAnnotation = async () => {
              if (
                this._oaudiofile !== undefined &&
                importResult !== undefined &&
                importResult.annotjson !== undefined &&
                !importResult.error
              ) {
                fileProgress.status = 'valid';

                if (
                  new RegExp(
                    `${escapeRegex(audioName)}${AppInfo.converters[i].extensions
                      .map((a) => `(?:${escapeRegex(a)})`)
                      .join('|')}$`
                  ).exec(fileProgress.name) === null &&
                  new RegExp(
                    `${escapeRegex(audioName)}${AppInfo.converters[i].extensions
                      .map((a) => `(?:${escapeRegex(a.toLowerCase())})`)
                      .join('|')}$`
                  ).exec(fileProgress.name) === null
                ) {
                  fileProgress.warning = 'File names are not the same.';
                }
                for (const lvl of importResult.annotjson.levels) {
                  if (lvl.type === AnnotationLevelType.SEGMENT) {
                    const level = lvl as OSegmentLevel<OSegment>;

                    if (level.items[0].sampleStart !== 0) {
                      let temp = [];
                      temp.push(
                        new OSegment(0, 0, level.items[0].sampleStart!, [
                          new OLabel(level.name, ''),
                        ])
                      );
                      temp = temp.concat(
                        level.items.map(
                          (a) =>
                            new OSegment(
                              a.id,
                              a.sampleStart!,
                              a.sampleDur!,
                              a.labels
                            )
                        )
                      );
                      level.items = temp;

                      for (let j = 1; j < level.items.length + 1; j++) {
                        level.items[j - 1].id = j;
                      }
                      i++;
                    }

                    const last = level.items[level.items.length - 1];
                    if (
                      last.sampleStart! + last.sampleDur! !==
                      this._oaudiofile.duration
                    ) {
                      level.items.push(
                        new OSegment(
                          last.id + 1,
                          last.sampleStart! + last.sampleDur!,
                          this._oaudiofile.duration! *
                            this._oaudiofile.sampleRate -
                            (last.sampleStart! + last.sampleDur!),
                          [new OLabel(level.name, '')]
                        )
                      );
                    }
                  }
                }
                this._oannotation = importResult.annotjson;
                this.checkState();
              } else {
                if (
                  fileProgress.checked_converters >=
                    AppInfo.converters.length ||
                  converter.name === 'BundleJSON'
                ) {
                  // last converter to check
                  fileProgress.status = 'invalid';
                  fileProgress.error = importResult!.error!;
                  this._oannotation = undefined;
                  this.checkState();
                } else if (fileProgress.error) {
                  fileProgress.status = 'invalid';
                  fileProgress.error = importResult!.error!;
                  this._oannotation = undefined;
                  this.checkState();
                }
              }
            };

            if (
              importResult !== undefined &&
              importResult.audiofile !== undefined
            ) {
              // is bundle file
              this.dropFiles('audio');
              const audioProcess: FileProgress = {
                status: 'progress',
                name: importResult.audiofile.name,
                file: fileProgress.file,
                type: importResult.audiofile.type,
                content: importResult.audiofile.arraybuffer!,
                size: importResult.audiofile.size,
                checked_converters: 0,
                progress: 0,
                error: '',
              };
              this._files.push(audioProcess);
            } else {
              await setAnnotation();
              if (this._oannotation) {
                break;
              }
            }

            fileProgress.checked_converters++;
          } else {
            fileProgress.checked_converters++;
          }
        } else {
          converter = undefined;
          fileProgress.checked_converters++;
        }

        if (converter?.name === 'AnnotJSON') {
          // stop because there is only one file format with ending "_annot.json"
          break;
        }
      }
      if (
        fileProgress.checked_converters === AppInfo.converters.length &&
        fileProgress.status === 'progress'
      ) {
        fileProgress.status = 'invalid';
      }
    }
  }

  getDropzoneFileString(file: { name: string; size: number }) {
    const fsize: FileSize = getFileSize(file.size);
    return `${file.name} (${Math.round(fsize.size * 100) / 100} ${
      fsize.label
    })`;
  }

  showSupported() {
    this.modService
      .openModal(
        SupportedFilesModalComponent,
        SupportedFilesModalComponent.options
      )
      .catch((error) => {
        console.error(error);
      });
  }

  onDeleteEntry(entry: string) {
    if (!(entry === undefined)) {
      this._files = this._files.filter((a) => a.name !== entry);
      if (contains(entry, '.wav') || contains(entry, '.ogg')) {
        this._oaudiofile = undefined;
        this._audioManager?.stopDecoding();
        this.resetFormatFileProgresses();
      } else {
        this._oannotation = undefined;
      }
      this.dropzone.clicklocked = true;
      // make sure, that event click does not trigger

      this.subscribe(timer(300), () => {
        this.dropzone.clicklocked = false;
      });
    }
    this.filesAdded.emit(this.dropzone.files);
  }

  private resetFormatFileProgresses() {
    for (const file of this._files) {
      file.checked_converters = 0;
      file.status = 'progress';
      file.error = '';
    }
  }

  private checkState() {
    if (this._files === undefined) {
      this._status = 'empty';
    } else {
      if (!(this.oaudiofile === undefined)) {
        if (this.files.length > 0) {
          for (const file of this.files) {
            if (file.status === 'progress' || file.status === 'invalid') {
              this._status = file.status;
              break;
            }
            this._status = 'valid';
          }
        } else {
          this._status = 'valid';
        }
      } else {
        this._status = 'invalid';
      }
    }
    this.filesAdded.emit(this.dropzone.files);
  }

  private decodeArrayBuffer(
    buffer: ArrayBuffer,
    fileProcessIndex: number,
    checkimport = true
  ) {
    const fileProcess = this._files[fileProcessIndex];
    fileProcess.progress = 0.5;
    this.checkState();

    this.subscribe(timer(200), () => {
      // check audio
      this.subscribe(
        AudioManager.create(fileProcess.name, fileProcess.type, buffer),
        {
          next: async (result) => {
            fileProcess.progress = 0.5 + 0.5 * result.progress;
            this._audioManager = result.audioManager;

            if (result.audioManager && result.progress === 1) {
              // finished, get result
              if (!(this._audioManager === undefined)) {
                this._audioManager.destroy();
                this._audioManager = undefined;
              }

              this._audioManager = result.audioManager;
              fileProcess.status = 'valid';
              this._oaudiofile = new OAudiofile();
              this._oaudiofile.name = fileProcess.name;
              this._oaudiofile.size = fileProcess.size;
              this._oaudiofile.duration =
                this._audioManager.resource.info.duration.samples;
              this._oaudiofile.sampleRate = this._audioManager.sampleRate;
              this._oaudiofile.arraybuffer = buffer;

              this.checkState();

              if (checkimport) {
                // load import data
                for (const importfile of this._files) {
                  if (
                    !AudioManager.isValidAudioFileName(
                      importfile.name,
                      AppInfo.audioformats
                    )
                  ) {
                    await this.isValidImportData(importfile);
                  }
                }
              }
            }
          },
          error: (error: any) => {
            console.error(error);
          },
        }
      );
    });
  }

  private dropFiles(type: 'audio' | 'transcript') {
    this._files = this._files.filter((a) => {
      if (
        type === 'audio' &&
        AudioManager.isValidAudioFileName(a.name, AppInfo.audioformats)
      ) {
        return false;
      } else if (
        type === 'transcript' &&
        !AudioManager.isValidAudioFileName(a.name, AppInfo.audioformats)
      ) {
        return false;
      }
      return true;
    });
  }

  protected async openImportOptionsModal(
    fileProgress: FileProgress
  ): Promise<void> {
    this.dropzone.clicklocked = true;
    // make sure, that event click does not trigger

    this.subscribe(timer(300), () => {
      this.dropzone.clicklocked = false;
    });
    const result = await this.modService.openModal<
      typeof ImportOptionsModalComponent,
      any
    >(ImportOptionsModalComponent, ImportOptionsModalComponent.options, {
      schema: fileProgress.needsOptions,
      value: fileProgress.options,
      converter: fileProgress.converter,
    });

    if (result.action === 'apply') {
      fileProgress.options = result.result;
    }

    const importOptions = {};
    importOptions[fileProgress.converter.name] = fileProgress.options;

    this.store.dispatch(
      LoginModeActions.setImportConverter.do({
        mode: LoginMode.LOCAL,
        importConverter: fileProgress.converter.name
      })
    );
    this.store.dispatch(
      LoginModeActions.changeImportOptions.do({
        mode: LoginMode.LOCAL,
        importOptions,
      })
    );
  }
}
