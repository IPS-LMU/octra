import {AppInfo} from '../../app.info';
import {AppStorageService} from './service/appstorage.service';
import {isNullOrUndefined} from 'util';
import {OAnnotJSON, OAudiofile, OLabel, OLevel, OSegment} from '../obj/Annotation/AnnotJSON';
import {IndexedDBManager} from '../obj/IndexedDBManager';
import {Logger} from './Logger';
import {SubscriptionManager} from '../obj/SubscriptionManager';

export class UpdateManager {
  private version = '';
  private sessService: AppStorageService;
  private subscrmanager: SubscriptionManager = new SubscriptionManager();

  constructor(sessService: AppStorageService) {
    this.version = sessService.version;
    this.sessService = sessService;
  }

  public checkForUpdates(): Promise<IndexedDBManager> {
    return new Promise<IndexedDBManager>(
      (resolve, reject) => {
        const appversion = AppInfo.version;

        if (!isNullOrUndefined(this.sessService.localStr.retrieve('version'))) {
          this.version = this.sessService.localStr.retrieve('version');
        }


        const continue_check = () => {
          if (isNullOrUndefined(this.version)) {
            console.log('update...');
            console.log(appversion);
            console.log(this.version);
            this.update();
          }

          // incremental IDB upgrade: It is very important to make sure, that the database can
          // be upgrade from any version to the latest version
          const idbm = new IndexedDBManager('octra');
          this.subscrmanager.add(idbm.open(2).subscribe(
            (result) => {
              console.log(result.type);
              if (result.type === 'success') {
                // database opened
                Logger.log('IDB opened');
                idbm.save('options', 'version', {value: AppInfo.version});
                resolve(idbm);
              } else if (result.type === 'upgradeneeded') {
                // database opened and needs upgrade/installation
                Logger.log(`IDB needs upgrade from v${result.oldVersion} to v${result.newVersion}...`);
                let version = result.oldVersion;

                // foreach step to the latest version you need to define the uprade
                // procedure
                if (version === 1) {
                  const optionsStore = idbm.db.createObjectStore('options', {keyPath: 'name'});
                  const logsStore = idbm.db.createObjectStore('logs', {keyPath: 'timestamp'});
                  const annoStore = idbm.db.createObjectStore('annotation', {keyPath: 'name'});

                  // options for version 1
                  idbm.saveSequential(optionsStore, [
                    {
                      key: 'easymode',
                      value: {value: this.sessService.localStr.retrieve('easymode')}
                    },
                    {
                      key: 'submitted',
                      value: {value: this.sessService.localStr.retrieve('submitted')}
                    },
                    {
                      key: 'feedback',
                      value: {value: this.sessService.localStr.retrieve('feedback')}
                    },
                    {
                      key: 'data_id',
                      value: {value: this.sessService.localStr.retrieve('data_id')}
                    },
                    {
                      key: 'audio_url',
                      value: {value: this.sessService.localStr.retrieve('audio_url')}
                    },
                    {
                      key: 'uselocalmode',
                      value: {value: this.sessService.localStr.retrieve('offline')}
                    },
                    {
                      key: 'useinterface',
                      value: {value: this.sessService.sessStr.retrieve('interface')}
                    },
                    {
                      key: 'sessionfile',
                      value: {value: this.sessService.localStr.retrieve('sessionfile')}
                    },
                    {
                      key: 'language',
                      value: {value: this.sessService.localStr.retrieve('language')}
                    },
                    {
                      key: 'version',
                      value: {value: this.sessService.localStr.retrieve('version')}
                    },
                    {
                      key: 'comment',
                      value: {value: this.sessService.localStr.retrieve('comment')}
                    },
                    {
                      key: 'user',
                      value: {
                        value: {
                          id: this.sessService.localStr.retrieve('member_id'),
                          project: this.sessService.localStr.retrieve('member_project'),
                          jobno: this.sessService.localStr.retrieve('member_jobno')
                        }
                      }
                    }
                  ]).then(() => {

                    const convertAnnotation = () => {
                      if (!isNullOrUndefined(this.sessService.localStr.retrieve('annotation'))) {
                        Logger.log(`Convert annotation to IDB...`);

                        idbm.saveArraySequential(this.sessService.localStr.retrieve('annotation').levels, annoStore, 'name').then(() => {
                          console.log(`converted annotation levels to IDB`);

                          version++;
                          Logger.log(`IDB upgraded to v${version}`);
                          this.sessService.localStr.clear();
                          // do not insert a resolve call here!
                          // after an successful upgrade the success is automatically triggered
                        }).catch((err) => {
                          console.error(err);
                          reject(err);
                        });
                      } else {
                        version++;
                        this.sessService.localStr.clear();
                        Logger.log(`IDB upgraded to v${version}`);
                      }
                    };

                    if (!isNullOrUndefined(this.sessService.localStr.retrieve('logs'))) {
                      Logger.log('Convert logging data...');
                      Logger.log(`${this.sessService.localStr.retrieve('logs').length} logs to convert:`);
                      idbm.saveArraySequential(this.sessService.localStr.retrieve('logs'), logsStore, 'timestamp').then(() => {
                        console.log(`converted ${this.sessService.localStr.retrieve('logs').length} logging items to IDB`);
                        convertAnnotation();
                      }).catch((err) => {
                        console.error(err);
                        reject(err);
                      });
                    } else {
                      convertAnnotation();
                    }


                  }).catch((err) => {
                    console.error(err);
                  });
                }
              }
            },
            (error) => {
              console.error(error);
              reject(error);
            }));
        };


        // check if version entry in IDB exists
        const idb = new IndexedDBManager('octra');
        this.subscrmanager.add(idb.open().subscribe(
          (result) => {
            // database opened
            Logger.log('get version');
            idb.get('options', 'version').then((version) => {
              if (version !== null && version.hasOwnProperty('value')) {
                this.version = version.value;
                idb.close();
                continue_check();
              }
            }).catch(() => {
              console.log('version empty');
              idb.close();
              continue_check();
            });
          },
          (err) => {
            // IDB does not exist
            continue_check();
          }
        ));
      }
    );
  }

  private update() {
    const appversion = AppInfo.version;

    if (isNullOrUndefined(this.version)) {
      const old_transcription = this.sessService.localStr.retrieve('transcription');
      if (!isNullOrUndefined(old_transcription)) {
        console.log('Convert to new AnnotJSON...');

        const audiofile: OAudiofile = new OAudiofile();
        audiofile.name = '';
        audiofile.size = 0;
        audiofile.duration = 0;
        audiofile.samplerate = 0;

        const segments: OSegment[] = [];

        let start = 0;
        for (let i = 0; i < old_transcription.length; i++) {
          const transcript = old_transcription[i].transcript;
          const time = old_transcription[i].time.samples;

          const segment = new OSegment((i + 1), start, (time - start));
          segment.labels.push(new OLabel('Orthographic', transcript));

          segments.push(segment);
          start = time;
        }

        const level: OLevel = new OLevel('Orthographic', 'SEGMENT');
        level.items = segments;
        const levels: OLevel[] = [];
        levels.push(level);

        const annotation: OAnnotJSON = new OAnnotJSON(audiofile.name, audiofile.samplerate, levels);
        console.log('IMPORTED:');
        this.sessService.localStr.store('annotation', annotation);
        console.log('delete old transcription');
        this.sessService.localStr.store('transcription', null);
        this.sessService.version = appversion;
      }
    } else {
      console.log('version available');
      this.sessService.version = appversion;
    }
  }

  public destroy() {
    this.subscrmanager.destroy();
  }
}
