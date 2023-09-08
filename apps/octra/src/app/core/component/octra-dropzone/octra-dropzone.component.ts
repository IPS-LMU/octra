import { Component, Input, ViewChild } from '@angular/core';
import { AppInfo } from '../../../app.info';
import { DropZoneComponent } from '../drop-zone';
import { OctraModalService } from '../../modals/octra-modal.service';
import { SessionFile } from '../../obj/SessionFile';
import { contains, FileSize, getFileSize } from '@octra/utilities';
import { FileProgress } from '../../obj/objects';
import {
  Converter,
  IFile,
  ImportResult,
  OAnnotJSON,
  OAudiofile,
  OLabel,
  OSegment,
} from '@octra/annotation';
import { timer } from 'rxjs';
import { SupportedFilesModalComponent } from '../../modals/supportedfiles-modal/supportedfiles-modal.component';
import { DefaultComponent } from '../default.component';
import { AudioManager, fileListToArray } from '@octra/web-media';

@Component({
  selector: 'octra-dropzone',
  templateUrl: './octra-dropzone.component.html',
  styleUrls: ['./octra-dropzone.component.scss'],
})
export class OctraDropzoneComponent extends DefaultComponent {
  @ViewChild('dropzone', { static: true }) dropzone!: DropZoneComponent;
  @Input() height = '250px';
  private _audiomanager?: AudioManager;

  get AppInfo(): AppInfo {
    return AppInfo;
  }

  get audioManager(): AudioManager | undefined {
    return this._audiomanager;
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

  public get fileInput() {
    return this.dropzone.fileinput;
  }

  constructor(private modService: OctraModalService) {
    super();
  }

  public afterDrop = () => {
    this._oannotation = undefined;
    const files = fileListToArray(this.dropzone.files!);
    for (const file of files) {
      const fileProcess: FileProgress = {
        status: 'progress',
        file,
        checked_converters: 0,
        progress: 0,
        error: '',
      };

      // check if an audio and a format file already exists
      let dataFile = undefined;
      let audioFile = undefined;
      for (const fileAny of this.files) {
        if (
          AudioManager.isValidAudioFileName(
            fileAny.file.name,
            AppInfo.audioformats
          )
        ) {
          audioFile = fileAny;
        } else if (fileAny.file.name === fileProcess.file.name) {
          dataFile = fileAny;
        }
      }

      if (
        AudioManager.isValidAudioFileName(
          fileProcess.file.name,
          AppInfo.audioformats
        )
      ) {
        // the latest dropped file is an audio file
        fileProcess.status = 'progress';
        const reader = new FileReader();

        this.resetFormatFileProgresses();

        // drop previous audio files
        for (const audioFormat of AppInfo.audioformats) {
          this.dropFile(audioFormat.extension, true);
        }
        this._oaudiofile = undefined;

        this._files.push(fileProcess);

        reader.onloadend = () => {
          if (fileProcess.file.size <= AppInfo.maxAudioFileSize * 1024 * 1024) {
            this.decodeArrayBuffer(
              reader.result as ArrayBuffer,
              this._files.length - 1
            );
          } else {
            fileProcess.status = 'invalid';
            fileProcess.error = `The file size is bigger than ${AppInfo.maxAudioFileSize} MB.`;
          }
        };
        reader.onprogress = (e) => {
          fileProcess.progress = e.loaded / e.total / 2;
        };

        reader.readAsArrayBuffer(fileProcess.file);
        break;
      } else {
        // the latest dropped file is a format file
        if (!(audioFile === undefined)) {
          const extension = audioFile.file.name.substr(
            audioFile.file.name.lastIndexOf('.')
          );
          this.loadImportFileData(extension);
        } else {
          this.loadImportFileData();
        }
      }
    }
  };

  public isValidImportData(file: FileProgress) {
    if (this._oaudiofile !== undefined) {
      for (let i = 0; i < AppInfo.converters.length; i++) {
        const converter: Converter = AppInfo.converters[i];
        if (
          contains(
            file.file.name.toLowerCase(),
            AppInfo.converters[i].extension.toLowerCase()
          )
        ) {
          if (converter.conversion.import) {
            const reader: FileReader = new FileReader();
            reader.onloadend = () => {
              if (file.status === 'progress') {
                const ofile: IFile = {
                  name: file.file.name,
                  content: reader.result as string,
                  type: file.file.type,
                  encoding: converter.encoding,
                };

                const audioName = this._oaudiofile!.name.substr(
                  0,
                  this._oaudiofile!.name.lastIndexOf('.')
                );
                if (
                  file.file.name ===
                    audioName + AppInfo.converters[i].extension ||
                  file.file.name ===
                    audioName + AppInfo.converters[i].extension.toLowerCase()
                ) {
                  const importResult: ImportResult | undefined =
                    converter.import(ofile, this._oaudiofile!);

                  const setAnnotation = () => {
                    if (
                      this._oaudiofile !== undefined &&
                      importResult !== undefined &&
                      importResult.annotjson !== undefined &&
                      importResult.error === ''
                    ) {
                      file.status = 'valid';
                      for (const level of importResult.annotjson.levels) {
                        if (level.type === 'SEGMENT') {
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
                                this._oaudiofile.duration *
                                  this._oaudiofile.sampleRate -
                                  (last.sampleStart! + last.sampleDur!),
                                [new OLabel(level.name, '')]
                              )
                            );
                          } else {
                            console.error(
                              `Import Error, last sample of result is bigger than the audio file's duration`
                            );
                          }
                        }
                      }
                      this._oannotation = importResult.annotjson;
                      this.checkState();
                    } else {
                      if (
                        file.checked_converters >= AppInfo.converters.length ||
                        converter.name === 'Bundle'
                      ) {
                        // last converter to check
                        file.status = 'invalid';
                        file.error = importResult!.error!;
                        this._oannotation = undefined;
                        this.checkState();
                      }
                    }
                  };

                  if (
                    !(importResult === undefined) &&
                    !(importResult.audiofile === undefined)
                  ) {
                    // is bundle file
                    this.dropFile('_bndl.json', true, true);
                    const audioProcess: FileProgress = {
                      status: 'progress',
                      file: new File(
                        [importResult.audiofile.arraybuffer],
                        importResult.audiofile.name
                      ),
                      checked_converters: 0,
                      progress: 0,
                      error: '',
                    };
                    this._files.push(audioProcess);
                    // TODO bundle file check
                    /* this.decodeArrayBuffer(importResult.audiofile.arraybuffer, audioProcess, false).then(
                      () => {
                        setAnnotation();
                      }
                    ).catch((err) => {
                      console.error(err);
                    }); */
                  } else {
                    setAnnotation();
                  }

                  file.checked_converters++;
                } else {
                  file.status = 'invalid';
                  file.error = `format file must have the same name as the audio file.`;
                  this._oannotation = undefined;
                  this.checkState();
                }
              }
            };

            reader.readAsText(file.file, converter.encoding.toLowerCase());
          } else {
            file.checked_converters++;
          }
        } else {
          file.checked_converters++;
        }
      }
      if (
        file.checked_converters === AppInfo.converters.length &&
        file.status === 'progress'
      ) {
        file.status = 'invalid';
      }
    }
  }

  getDropzoneFileString(file: File | SessionFile) {
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
      this.dropFile(entry);
      if (contains(entry, '.wav') || contains(entry, '.ogg')) {
        this._oaudiofile = undefined;
        AudioManager.stopDecoding();
        this.resetFormatFileProgresses();
      } else {
        this._oannotation = undefined;
      }
      this.dropzone.clicklocked = true;
      // make sure, that event click does not trigger

      this.subscrManager.add(
        timer(300).subscribe(() => {
          this.dropzone.clicklocked = false;
        })
      );
    }
  }

  private loadImportFileData(extension?: string) {
    const files = fileListToArray(this.dropzone.files!);

    for (const importfile of files) {
      if (extension === undefined) {
        extension = importfile.name.substr(importfile.name.lastIndexOf('.'));
      }

      this.dropFile(extension, true, true);

      const newfile: FileProgress = {
        status: 'progress',
        file: importfile,
        checked_converters: 0,
        progress: 0,
        error: '',
      };
      this._files.push(newfile);
      this.isValidImportData(newfile);
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
    const extension = fileProcess.file.name.substr(
      fileProcess.file.name.lastIndexOf('.')
    );

    this.subscrManager.add(
      timer(200).subscribe(() => {
        // check audio
        this.subscrManager.add(
          AudioManager.decodeAudio(
            fileProcess.file.name,
            fileProcess.file.type,
            buffer,
            AppInfo.audioformats
          ).subscribe(
            (result) => {
              fileProcess.progress = result.decodeProgress / 2 + 0.5;
              if (result.audioManager === undefined) {
                // not finished
              } else {
                // finished, get result
                if (!(this._audiomanager === undefined)) {
                  this._audiomanager.destroy();
                  this._audiomanager = undefined;
                }

                this._audiomanager = result.audioManager;
                fileProcess.status = 'valid';
                this._oaudiofile = new OAudiofile();
                this._oaudiofile.name = fileProcess.file.name;
                this._oaudiofile.size = fileProcess.file.size;
                this._oaudiofile.duration =
                  this._audiomanager.resource.info.duration.samples;
                this._oaudiofile.sampleRate = this._audiomanager.sampleRate;
                this._oaudiofile.arraybuffer = buffer;

                this.checkState();

                if (checkimport) {
                  // load import data
                  const files = fileListToArray(this.dropzone.files!);
                  for (const importfile of files) {
                    if (
                      !AudioManager.isValidAudioFileName(
                        importfile.name,
                        AppInfo.audioformats
                      )
                    ) {
                      this.dropFile(importfile.name);

                      const newfile: FileProgress = {
                        status: 'progress',
                        file: importfile,
                        checked_converters: 0,
                        progress: 0,
                        error: '',
                      };
                      this.dropFile(extension, true, true);
                      this._files.push(newfile);
                      this.isValidImportData(newfile);
                    }
                  }

                  // check for data already exist
                  for (const importfile of this.files) {
                    if (
                      !AudioManager.isValidAudioFileName(
                        importfile.file.name,
                        AppInfo.audioformats
                      )
                    ) {
                      importfile.status = 'progress';
                      importfile.checked_converters = 0;
                      this.isValidImportData(importfile);
                      break;
                    }
                  }
                }
              }
            },
            (error) => {
              console.error(error);
            }
          )
        );
      })
    );
  }

  private dropFile(
    filename: string,
    containsTrue: boolean = false,
    containsnot: boolean = false
  ): boolean {
    for (let i = 0; i < this.files.length; i++) {
      const file = this.files[i].file;

      if (!containsTrue && filename === file.name) {
        if (contains(file.name, filename)) {
          this.files.splice(i, 1);
          return true;
        }
      } else if (containsTrue) {
        if (!containsnot) {
          if (contains(file.name, filename)) {
            this.files.splice(i, 1);
            return true;
          }
        } else {
          if (!contains(file.name, filename)) {
            this.files.splice(i, 1);
            return true;
          }
        }
      }
    }
    return false;
  }
}
