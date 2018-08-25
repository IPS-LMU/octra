import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {OAnnotJSON, OAudiofile, OLabel, OSegment} from '../../obj/Annotation';
import {FileSize, Functions} from '../../shared';
import {AppInfo} from '../../../app.info';
import {isNullOrUndefined} from 'util';
import {Converter, ImportResult} from '../../obj/Converters';
import {DropZoneComponent} from '../../component/drop-zone';
import {SessionFile} from '../../obj/SessionFile';
import {SubscriptionManager} from '../../obj/SubscriptionManager';
import {ModalService} from '../../modals/modal.service';
import {AudioManager} from '../../../media-components/obj/media/audio/AudioManager';

@Component({
  selector: 'app-octra-dropzone',
  templateUrl: './octra-dropzone.component.html',
  styleUrls: ['./octra-dropzone.component.css']
})
export class OctraDropzoneComponent implements OnInit, OnDestroy {
  get audiomanager(): AudioManager {
    return this._audiomanager;
  }

  get status(): string {
    return this._status;
  }

  get oannotation(): OAnnotJSON {
    return this._oannotation;
  }

  get oaudiofile(): OAudiofile {
    return this._oaudiofile;
  }

  get AppInfo(): AppInfo {
    return AppInfo;
  }

  @ViewChild('dropzone') dropzone: DropZoneComponent;

  public _files: {
    status: string,
    file: File,
    checked_converters: number
  }[] = [];

  private _oaudiofile: OAudiofile;
  private _oannotation: OAnnotJSON;
  private _status: string;
  private subscrmanager: SubscriptionManager = new SubscriptionManager();
  private _audiomanager: AudioManager;

  public get files(): {
    status: string,
    file: File,
    checked_converters: number
  }[] {
    return this._files;
  }

  constructor(private modService: ModalService) {
  }

  ngOnInit() {
  }

  ngOnDestroy() {
    this.subscrmanager.destroy();
  }

  public isValidImportData(file: { status: string, file: File, checked_converters: number }) {
    for (let i = 0; i < AppInfo.converters.length; i++) {
      const converter: Converter = AppInfo.converters[i];
      if (Functions.contains(file.file.name, AppInfo.converters[i].extension)) {
        if (converter.conversion.import) {

          const reader: FileReader = new FileReader();
          reader.onloadend = () => {
            if (file.status === 'progress') {
              const ofile = {
                name: file.file.name,
                content: reader.result,
                type: file.file.type,
                encoding: converter.encoding
              };

              const importresult: ImportResult = converter.import(ofile, this._oaudiofile);

              const set_annotation = () => {
                if (!isNullOrUndefined(importresult) && !isNullOrUndefined(importresult.annotjson)) {
                  file.status = 'valid';
                  if (!isNullOrUndefined(this._oaudiofile)) {
                    for (let k = 0; k < importresult.annotjson.levels.length; k++) {
                      const level = importresult.annotjson.levels[k];
                      if (level.type === 'SEGMENT') {
                        if (level.items[0].sampleStart !== 0) {
                          let temp = [];
                          temp.push(new OSegment(0, 0, level.items[0].sampleStart, [new OLabel(level.name, '')]));
                          temp = temp.concat(level.items);
                          level.items = temp;

                          for (let j = 1; j < level.items.length + 1; j++) {
                            level.items[j - 1].id = j;
                          }
                          i++;
                        }

                        const last = level.items[level.items.length - 1];
                        if (last.sampleStart + last.sampleDur !== this._oaudiofile.duration * this._oaudiofile.samplerate) {
                          level.items.push(new OSegment(last.id + 1, last.sampleStart + last.sampleDur,
                            (this._oaudiofile.duration * this._oaudiofile.samplerate) - (last.sampleStart + last.sampleDur),
                            [new OLabel(level.name, '')]));
                        }
                      }
                    }
                  }
                  this._oannotation = importresult.annotjson;
                  this.checkState();
                } else {
                  if (file.checked_converters === AppInfo.converters.length || converter.name === 'Bundle') {
                    // last converter to check
                    file.status = 'invalid';
                    this._oannotation = null;
                    this.checkState();
                  }
                }
              };

              if (!isNullOrUndefined(importresult) && !isNullOrUndefined(importresult.audiofile)) {
                // is bundle file
                this.dropFile('_bndl.json', true, true);
                const audio_process = {
                  status: 'progress',
                  file: new File([importresult.audiofile.arraybuffer], importresult.audiofile.name),
                  checked_converters: 0
                };
                this._files.push(audio_process);
                this.decodeArrayBuffer(importresult.audiofile.arraybuffer, audio_process, false).then(
                  () => {
                    set_annotation();
                  }
                ).catch((err) => {
                  console.error(err);
                });
              } else {
                set_annotation();
              }

              file.checked_converters++;
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
    if (file.checked_converters === AppInfo.converters.length
      && file.status === 'progress'
    ) {
      file.status = 'invalid';
    }
  }

  public afterDrop = () => {
    this._oannotation = null;
    for (let i = 0; i < this.dropzone.files.length; i++) {
      const file_process = {
        status: 'progress',
        file: this.dropzone.files[i],
        checked_converters: 0
      };

      let data_file = null;
      let audio_file = null;
      for (let j = 0; j < this.files.length; j++) {
        const file_any = this.files[j];

        if (AudioManager.isValidFileName(file_any.file.name, AppInfo.audioformats)) {
          audio_file = file_any;
        } else if (file_any.file.name === file_process.file.name) {
          data_file = file_any;
        }
      }

      if (AudioManager.isValidFileName(file_process.file.name, AppInfo.audioformats)) {
        file_process.status = 'progress';
        const reader = new FileReader();
        const extension = file_process.file.name.substr(file_process.file.name.lastIndexOf('.'));

        reader.onloadend = () => {
          this.decodeArrayBuffer(reader.result, file_process);
        };

        reader.readAsArrayBuffer(file_process.file);

        // drop previous audio files
        for (let h = 0; h < AppInfo.audioformats.length; h++) {
          this.dropFile(AppInfo.audioformats[h].extension, true);
        }
        this._files.push(file_process);
        break;
      } else {
        if (!isNullOrUndefined(audio_file)) {
          const extension = audio_file.file.name.substr(audio_file.file.name.lastIndexOf('.'));

          // load import data
          for (let j = 0; j < this.dropzone.files.length; j++) {
            const importfile = this.dropzone.files[j];
            if (!Functions.contains(importfile.name, extension)) {
              this.dropFile(extension, true, true);

              const newfile = {
                status: 'progress',
                file: this.dropzone.files[j],
                checked_converters: 0
              };
              this._files.push(newfile);
              this.isValidImportData(newfile);
            }
          }
        } else {
          // load import data
          for (let j = 0; j < this.dropzone.files.length; j++) {
            const importfile = this.dropzone.files[j];
            const extension = importfile.name.substr(importfile.name.lastIndexOf('.'));

            this.dropFile(extension, true, true);

            const newfile = {
              status: 'progress',
              file: this.dropzone.files[j],
              checked_converters: 0
            };
            this._files.push(newfile);
            this.isValidImportData(newfile);
          }
        }
      }
    }
  };

  private checkState() {
    if (isNullOrUndefined(this._files)) {
      this._status = 'empty';
    } else {
      if (!isNullOrUndefined(this.oaudiofile)) {
        if (this.files.length > 0) {
          for (let i = 0; i < this.files.length; i++) {
            if (this.files[i].status === 'progress'
              || this.files[i].status === 'invalid') {
              this._status = this.files[i].status;
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

  private decodeArrayBuffer(buffer: ArrayBuffer,
                            file_process: { status: string, file: File, checked_converters: number },
                            checkimport = true) {
    const extension = file_process.file.name.substr(file_process.file.name.lastIndexOf('.'));

    // check audio
    return AudioManager.decodeAudio(file_process.file.name, file_process.file.type, buffer, AppInfo.audioformats).then(
      (audiomanager: AudioManager) => {
        if (!isNullOrUndefined(this._audiomanager)) {
          this._audiomanager.destroy();
          this._audiomanager = null;
        }

        this._audiomanager = audiomanager;
        file_process.status = 'valid';
        this._oaudiofile = new OAudiofile();
        this._oaudiofile.name = file_process.file.name;
        this._oaudiofile.size = file_process.file.size;
        this._oaudiofile.duration = this._audiomanager.ressource.info.duration.samples;
        this._oaudiofile.samplerate = this._audiomanager.ressource.info.samplerate;
        this._oaudiofile.arraybuffer = buffer;

        this.checkState();

        if (checkimport) {
          // load import data
          for (let j = 0; j < this.dropzone.files.length; j++) {
            const importfile = this.dropzone.files[j];
            if (!AudioManager.isValidFileName(importfile.name, AppInfo.audioformats)) {
              this.dropFile(importfile.name);

              const newfile = {
                status: 'progress',
                file: this.dropzone.files[j],
                checked_converters: 0
              };
              this.dropFile(extension, true, true);
              this._files.push(newfile);
              this.isValidImportData(newfile);
            }
          }

          // check for data already exist
          for (let j = 0; j < this.files.length; j++) {
            const importfile = this.files[j].file;
            if (!AudioManager.isValidFileName(importfile.name, AppInfo.audioformats)) {
              this.files[j].status = 'progress';
              this.files[j].checked_converters = 0;
              this.isValidImportData(this.files[j]);
              break;
            }
          }
        }
      }
    ).catch((error) => {
      console.error('error occured while decoding audio file');
      console.error(error);
    });
  }

  getDropzoneFileString(file: File | SessionFile) {
    const fsize: FileSize = Functions.getFileSize(file.size);
    return Functions.buildStr('{0} ({1} {2})', [file.name, (Math.round(fsize.size * 100) / 100), fsize.label]);
  }

  showSupported() {
    this.modService.show('supportedfiles');
  }

  private dropFile(filename: string, contains: boolean = false, containsnot: boolean = false): boolean {
    for (let i = 0; i < this.files.length; i++) {
      const file = this.files[i].file;

      if ((!contains && filename === file.name)) {
        if (Functions.contains(file.name, filename)) {
          this.files.splice(i, 1);
          return true;
        }
      } else if (contains) {
        if (!containsnot) {
          if (Functions.contains(file.name, filename)) {
            this.files.splice(i, 1);
            return true;
          }
        } else {
          if (!Functions.contains(file.name, filename)) {
            this.files.splice(i, 1);
            return true;
          }
        }
      }
    }
    return false;
  }

  onDeleteEntry(entry: string) {
    if (!isNullOrUndefined(entry)) {
      this.dropFile(entry);
      if (Functions.contains(entry, '.wav') || Functions.contains(entry, '.ogg')) {
        this._oaudiofile = null;
      } else {
        this._oannotation = null;
      }
      this.dropzone.clicklocked = true;
      // make sure, that event click does not trigger

      setTimeout(() => {
        this.dropzone.clicklocked = false;
      }, 300);
    }
  }
}
