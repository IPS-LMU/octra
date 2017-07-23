import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {OAnnotJSON, OAudiofile} from '../../obj/annotjson';
import {FileSize, Functions} from '../../shared/Functions';
import {AppInfo} from '../../../app.info';
import {isNullOrUndefined} from 'util';
import {Converter} from '../../obj/Converters/Converter';
import {DropZoneComponent} from '../../component/drop-zone/drop-zone.component';
import {SessionFile} from '../../obj/SessionFile';
import {ModalService} from '../../shared/service/modal.service';
import {AudioManager} from '../../obj/media/audio/AudioManager';
import {SubscriptionManager} from '../../obj/SubscriptionManager';

@Component({
  selector: 'app-octra-dropzone',
  templateUrl: './octra-dropzone.component.html',
  styleUrls: ['./octra-dropzone.component.css']
})
export class OctraDropzoneComponent implements OnInit, OnDestroy {
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
    if (!isNullOrUndefined(this._oaudiofile)) {
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

                const test: OAnnotJSON = converter.import(ofile, this._oaudiofile);
                file.checked_converters++;
                if (!isNullOrUndefined(test)) {
                  file.status = 'valid';
                  this._oannotation = test;
                  this.checkState();
                } else if (file.checked_converters === AppInfo.converters.length) {
                  // last converter to check
                  file.status = 'invalid';
                  this._oannotation = null;
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
      if (file.checked_converters === AppInfo.converters.length
        && file.status === 'progress'
      ) {
        file.status = 'invalid';
      }
    } else {
      file.status = 'invalid';
    }
  }

  public afterDrop = () => {
    this._oannotation = null;
    console.log('drop');
    for (let i = 0; i < this.dropzone.files.length; i++) {
      const file = {
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
        } else if (file_any.file.name === file.file.name) {
          data_file = file_any;
        }
      }

      console.log('data');
      console.log(data_file);
      if (AudioManager.isValidFileName(file.file.name, AppInfo.audioformats)) {
        file.status = 'progress';
        const reader = new FileReader();
        const extension = file.file.name.substr(file.file.name.lastIndexOf('.'));

        reader.onloadend = (test) => {

          // check audio
          AudioManager.decodeAudio(file.file.name, reader.result, AppInfo.audioformats).then(
            (audiomanager: AudioManager) => {
              file.status = 'valid';
              this._oaudiofile = new OAudiofile();
              this._oaudiofile.name = file.file.name;
              this._oaudiofile.size = file.file.size;
              this._oaudiofile.duration = audiomanager.ressource.info.duration.samples;
              this._oaudiofile.samplerate = audiomanager.ressource.info.samplerate;

              this.checkState();

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
          ).catch((error) => {
            console.error('error occured while decoding audio file');
            console.error(error);
          });
        };

        reader.readAsArrayBuffer(file.file);

        // drop previous audio files
        for (let h = 0; h < AppInfo.audioformats.length; h++) {
          console.log('drop ' + AppInfo.audioformats[h].extension);
          this.dropFile(AppInfo.audioformats[h].extension, true);
        }
        this._files.push(file);
        break;
      } else if (!isNullOrUndefined(audio_file)) {
        const extension = audio_file.file.name.substr(audio_file.file.name.lastIndexOf('.'));
        console.log('audio ext is ' + extension);
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
        console.log('audiofile is null');
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
      if (Functions.contains(entry, '.wav')) {
        this._oaudiofile = null;
      }
      this.dropzone.clicklocked = true;
      // make sure, that event click does not trigger

      setTimeout(() => {
        this.dropzone.clicklocked = false;
      }, 300);
    }
  }
}
