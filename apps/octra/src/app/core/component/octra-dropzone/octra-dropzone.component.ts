import { Component, Input, ViewChild } from '@angular/core';
import { AppInfo } from '../../../app.info';
import { DropZoneComponent } from '../drop-zone';
import { OctraModalService } from '../../modals/octra-modal.service';
import { contains, FileSize, getFileSize } from '@octra/utilities';
import { FileProgress } from '../../obj/objects';
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
import { timer } from 'rxjs';
import { SupportedFilesModalComponent } from '../../modals/supportedfiles-modal/supportedfiles-modal.component';
import { DefaultComponent } from '../default.component';
import { AudioManager, fileListToArray, readFile } from '@octra/web-media';
import { OAudiofile } from '@octra/media';
import { ImportOptionsModalComponent } from '../../modals/import-options-modal/import-options-modal.component';

@Component({
  selector: 'octra-dropzone',
  templateUrl: './octra-dropzone.component.html',
  styleUrls: ['./octra-dropzone.component.scss'],
})
export class OctraDropzoneComponent extends DefaultComponent {
  @ViewChild('dropzone', { static: true }) dropzone!: DropZoneComponent;
  @Input() height = '250px';
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

  constructor(private modService: OctraModalService) {
    super();
  }

  public afterDrop = async () => {
    this._oannotation = undefined;
    const files = fileListToArray(this.dropzone.files!);
    for (const file of files) {
      const fileProcess: FileProgress = {
        status: 'progress',
        name: file.name,
        file,
        type: file.type,
        size: file.size,
        checked_converters: 0,
        progress: 0,
        error: '',
      };

      if (AudioManager.isValidAudioFileName(file.name, AppInfo.audioformats)) {
        // the latest dropped file is an audio file
        this.resetFormatFileProgresses();

        // drop previous audio files
        this.dropFiles('audio');
        this._oaudiofile = undefined;

        this._files.push(fileProcess);

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
        break;
      } else {
        const extension = file.name.substring(file.name.lastIndexOf('.'));
        this.dropFiles('transcript');
        this._files.push(fileProcess);

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
        const converter: Converter = AppInfo.converters[i];
        if (
          contains(
            fileProgress.name.toLowerCase(),
            AppInfo.converters[i].extension.toLowerCase()
          )
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

            let options: any = undefined;
            const optionsSchema: any = converter.needsOptionsForImport(
              ofile,
              this._oaudiofile!
            );

            if (optionsSchema) {
              options = await this.openImportOptionsModal(
                optionsSchema,
                converter.defaultImportOptions,
                converter
              );
            }

            const importResult: ImportResult | undefined = converter.import(
              ofile,
              this._oaudiofile!,
              options
            );

            const setAnnotation = () => {
              if (
                this._oaudiofile !== undefined &&
                importResult !== undefined &&
                importResult.annotjson !== undefined &&
                !importResult.error
              ) {
                fileProgress.status = 'valid';
                if (
                  fileProgress.name !==
                    audioName + AppInfo.converters[i].extension &&
                  fileProgress.name !==
                    audioName + AppInfo.converters[i].extension.toLowerCase()
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
              setAnnotation();
            }

            fileProgress.checked_converters++;
          } else {
            fileProgress.checked_converters++;
          }
        } else {
          fileProgress.checked_converters++;
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

  private async openImportOptionsModal(
    needsOptions: any,
    value: any,
    converter: Converter
  ): Promise<any> {
    const result = await this.modService.openModal<
      typeof ImportOptionsModalComponent,
      any
    >(ImportOptionsModalComponent, ImportOptionsModalComponent.options, {
      schema: needsOptions,
      value,
      converter,
    });

    if (result.action === 'apply') {
      return result.result;
    }
    return value;
  }
}
