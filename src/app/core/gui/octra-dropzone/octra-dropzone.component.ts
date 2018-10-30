import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {OAnnotJSON, OAudiofile, OLabel, OSegment} from '../../obj/Annotation';
import {AppInfo} from '../../../app.info';
import {Converter, IFile, ImportResult} from '../../obj/Converters';
import {DropZoneComponent} from '../../component/drop-zone';
import {SessionFile} from '../../obj/SessionFile';
import {SubscriptionManager} from '../../obj/SubscriptionManager';
import {ModalService} from '../../modals/modal.service';
import {AudioManager} from '../../../media-components/obj/media/audio/AudioManager';
import {FileSize, Functions} from '../../shared/Functions';

@Component({
  selector: 'app-octra-dropzone',
  templateUrl: './octra-dropzone.component.html',
  styleUrls: ['./octra-dropzone.component.css']
})
export class OctraDropzoneComponent implements OnInit, OnDestroy {

  get AppInfo(): AppInfo {
    return AppInfo;
  }

  public get files(): {
    status: string,
    file: File,
    checked_converters: number
  }[] {
    return this._files;
  }

  get oaudiofile(): OAudiofile {
    return this._oaudiofile;
  }

  get oannotation(): OAnnotJSON {
    return this._oannotation;
  }

  get status(): string {
    return this._status;
  }

  get audiomanager(): AudioManager {
    return this._audiomanager;
  }

  constructor(private modService: ModalService) {
  }

  @ViewChild('dropzone') dropzone: DropZoneComponent;
  private subscrmanager: SubscriptionManager = new SubscriptionManager();

  public _files: {
    status: string,
    file: File,
    checked_converters: number
  }[] = [];

  private _oaudiofile: OAudiofile;

  private _oannotation: OAnnotJSON;

  private _status: string;

  private _audiomanager: AudioManager;
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
          this.decodeArrayBuffer(<ArrayBuffer> reader.result, file_process);
        };

        reader.readAsArrayBuffer(file_process.file);

        // drop previous audio files
        for (let h = 0; h < AppInfo.audioformats.length; h++) {
          this.dropFile(AppInfo.audioformats[h].extension, true);
        }
        this._files.push(file_process);
        break;
      } else {
        if (!(audio_file === null || audio_file === undefined)) {
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
              const ofile: IFile = {
                name: file.file.name,
                content: <string> reader.result,
                type: file.file.type,
                encoding: converter.encoding
              };

              const importresult: ImportResult = converter.import(ofile, this._oaudiofile);

              const set_annotation = () => {
                if (!(importresult === null || importresult === undefined)
                  && !(importresult.annotjson === null || importresult.annotjson === undefined)) {
                  file.status = 'valid';
                  if (!(this._oaudiofile === null || this._oaudiofile === undefined)) {
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

              if (!(importresult === null || importresult === undefined)
                && !(importresult.audiofile === null || importresult.audiofile === undefined)) {
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

  getDropzoneFileString(file: File | SessionFile) {
    const fsize: FileSize = Functions.getFileSize(file.size);
    return Functions.buildStr('{0} ({1} {2})', [file.name, (Math.round(fsize.size * 100) / 100), fsize.label]);
  }

  showSupported() {
    this.modService.show('supportedfiles');
  }

  onDeleteEntry(entry: string) {
    if (!(entry === null || entry === undefined)) {
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

  private checkState() {
    if ((this._files === null || this._files === undefined)) {
      this._status = 'empty';
    } else {
      if (!(this.oaudiofile === null || this.oaudiofile === undefined)) {
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
        if (!(this._audiomanager === null || this._audiomanager === undefined)) {
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
}
