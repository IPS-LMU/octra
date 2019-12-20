import {AppInfo} from '../../app.info';
import {OAnnotJSON, OAudiofile, OLabel, OLevel, OSegment} from '../obj/Annotation';
import {IndexedDBManager} from '../obj/IndexedDBManager';
import {SubscriptionManager} from '../obj/SubscriptionManager';
import {AppStorageService, OIDBLevel} from './service/appstorage.service';
import {isNullOrUndefined} from './Functions';

export class UpdateManager {
  private version = '';
  private appStorage: AppStorageService;
  private subscrmanager: SubscriptionManager = new SubscriptionManager();

  constructor(appStorage: AppStorageService) {
    this.version = appStorage.version;
    this.appStorage = appStorage;
  }

  public checkForUpdates(dbname: string): Promise<IndexedDBManager> {
    return new Promise<IndexedDBManager>(
      (resolve, reject) => {
        const appversion = AppInfo.version;

        if (!(this.appStorage.localStr.retrieve('version') === null || this.appStorage.localStr.retrieve('version') === undefined)) {
          this.version = this.appStorage.localStr.retrieve('version');
        }


        const continueCheck = () => {
          if ((this.version === null || this.version === undefined)) {
            console.log('update...');
            console.log(appversion);
            console.log(this.version);
            this.update();
          }

          // incremental IDB upgrade: It is very important to make sure, that the database can
          // be upgrade from any version to the latest version
          const idbm = new IndexedDBManager(dbname);
          this.subscrmanager.add(idbm.open(3).subscribe(
            (result) => {
              console.log('open db');
              console.log(result.type);
              if (result.type === 'success') {
                // database opened
                console.log('IDB opened');
                idbm.save('options', 'version', {value: AppInfo.version});
                resolve(idbm);
              } else if (result.type === 'upgradeneeded') {
                // database opened and needs upgrade/installation
                console.log(`IDB needs upgrade from v${result.oldVersion} to v${result.newVersion}...`);
                let version = result.oldVersion;

                // foreach step to the latest version you need to define the uprade
                // procedure
                new Promise<void>((resolve, reject) => {
                  if (version === 1) {
                    const optionsStore = idbm.db.createObjectStore('options', {keyPath: 'name'});
                    const logsStore = idbm.db.createObjectStore('logs', {keyPath: 'timestamp'});
                    const annoLevelsStore = idbm.db.createObjectStore('annotation_levels', {keyPath: 'id'});
                    const annoLinksStore = idbm.db.createObjectStore('annotation_links', {keyPath: 'id'});

                    // options for version 1
                    idbm.saveSequential(optionsStore, [
                      {
                        key: 'easymode',
                        value: {value: this.appStorage.localStr.retrieve('easymode')}
                      },
                      {
                        key: 'submitted',
                        value: {value: this.appStorage.localStr.retrieve('submitted')}
                      },
                      {
                        key: 'feedback',
                        value: {value: this.appStorage.localStr.retrieve('feedback')}
                      },
                      {
                        key: 'dataID',
                        value: {value: this.appStorage.localStr.retrieve('dataID')}
                      },
                      {
                        key: 'audioURL',
                        value: {value: this.appStorage.localStr.retrieve('audioURL')}
                      },
                      {
                        key: 'usemode',
                        value: {value: this.appStorage.localStr.retrieve('offline')}
                      },
                      {
                        key: 'useinterface',
                        value: {value: this.appStorage.sessStr.retrieve('interface')}
                      },
                      {
                        key: 'sessionfile',
                        value: {value: this.appStorage.localStr.retrieve('sessionfile')}
                      },
                      {
                        key: 'language',
                        value: {value: this.appStorage.localStr.retrieve('language')}
                      },
                      {
                        key: 'version',
                        value: {value: this.appStorage.localStr.retrieve('version')}
                      },
                      {
                        key: 'comment',
                        value: {value: this.appStorage.localStr.retrieve('comment')}
                      },
                      {
                        key: 'user',
                        value: {
                          value: {
                            id: this.appStorage.localStr.retrieve('member_id'),
                            project: this.appStorage.localStr.retrieve('member_project'),
                            jobno: this.appStorage.localStr.retrieve('member_jobno')
                          }
                        }
                      }
                    ]).then(() => {

                      const convertAnnotation = () => {
                        if (!isNullOrUndefined(this.appStorage.localStr.retrieve('annotation'))) {
                          console.log(`Convert annotation to IDB...`);

                          const levels = this.appStorage.localStr.retrieve('annotation').levels;
                          const newLevels: OIDBLevel[] = [];
                          for (let i = 0; i < levels.length; i++) {
                            newLevels.push(new OIDBLevel(i + 1, levels[i], i));
                          }

                          idbm.saveArraySequential(newLevels, annoLevelsStore, 'id').then(() => {
                            console.log(`converted annotation levels to IDB`);

                            version++;
                            console.log(`IDB upgraded to v${version}`);
                            this.appStorage.localStr.clear();
                            // do not insert a resolve call here!
                            // after an successful upgrade the success is automatically triggered
                          }).catch((err) => {
                            console.error(err);
                            reject(err);
                          });
                        } else {
                          version++;
                          this.appStorage.localStr.clear();
                          console.log(`IDB upgraded to v${version}`);
                        }
                      };

                      if (!isNullOrUndefined(this.appStorage.localStr.retrieve('logs'))) {
                        console.log('Convert logging data...');
                        console.log(`${this.appStorage.localStr.retrieve('logs').length} logs to convert:`);
                        idbm.saveArraySequential(this.appStorage.localStr.retrieve('logs'), logsStore, 'timestamp').then(() => {
                          console.log(`converted ${this.appStorage.localStr.retrieve('logs').length} logging items to IDB`);
                          convertAnnotation();
                        }).catch((err) => {
                          console.error(err);
                          reject(err);
                        });
                      } else {
                        convertAnnotation();
                      }

                      version = 2;
                      console.log(`updated to v2`);
                      resolve();
                    }).catch((err) => {
                      reject(err);
                    });
                  } else {
                    resolve();
                  }
                }).then(() => {
                  if (version === 2) {
                    const transaction = result.target.transaction;
                    const options = transaction.objectStore('options');

                    idbm.get(options, 'uselocalmode').then((entry) => {
                      if (!(entry === null || entry === undefined)) {
                        if (entry.value === false) {
                          idbm.save(options, 'usemode', {
                            name: 'usemode',
                            value: 'online'
                          });
                        } else if (entry.value === true) {
                          idbm.save(options, 'usemode', {
                            name: 'usemode',
                            value: 'local'
                          });
                        }
                      }
                    });
                    console.log(`updated to v3`);
                  }
                }).catch((error) => {
                  console.error(error);
                });
              }
            },
            (error) => {
              reject(error);
            }));
        };


        // check if version entry in IDB exists
        const idb = new IndexedDBManager(dbname);
        this.subscrmanager.add(idb.open().subscribe(
          (result) => {
            // database opened
            console.log('get version');
            idb.get('options', 'version').then((version) => {
              if (version !== null && version.hasOwnProperty('value')) {
                this.version = version.value;
                idb.close();
                continueCheck();
              }
            }).catch(() => {
              console.log('version empty');
              idb.close();
              continueCheck();
            });
          },
          (err) => {
            // IDB does not exist
            continueCheck();
          }
        ));
      }
    );
  }

  public destroy() {
    this.subscrmanager.destroy();
  }

  private update() {
    const appversion = AppInfo.version;

    if ((this.version === null || this.version === undefined)) {
      const oldTranscription = this.appStorage.localStr.retrieve('transcription');
      if (!(oldTranscription === null || oldTranscription === undefined)) {
        console.log('Convert to new AnnotJSON...');

        const audiofile: OAudiofile = new OAudiofile();
        audiofile.name = '';
        audiofile.size = 0;
        audiofile.duration = 0;
        audiofile.sampleRate = 0;

        const segments: OSegment[] = [];

        let start = 0;
        for (let i = 0; i < oldTranscription.length; i++) {
          const transcript = oldTranscription[i].transcript;
          const time = oldTranscription[i].time.samples;

          const segment = new OSegment((i + 1), start, (time - start));
          segment.labels.push(new OLabel('Orthographic', transcript));

          segments.push(segment);
          start = time;
        }

        const level: OLevel = new OLevel('Orthographic', 'SEGMENT');
        level.items = segments;
        const levels: OLevel[] = [];
        levels.push(level);

        const annotation: OAnnotJSON = new OAnnotJSON(audiofile.name, audiofile.sampleRate, levels);
        console.log('IMPORTED:');
        this.appStorage.localStr.store('annotation', annotation);
        console.log('delete old transcription');
        this.appStorage.localStr.store('transcription', null);
        this.appStorage.version = appversion;
      }
    } else {
      console.log('version available');
      this.appStorage.version = appversion;
    }
  }
}
