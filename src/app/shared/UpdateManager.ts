import {AppInfo} from '../app.info';
import {SessionService} from '../service/session.service';
import {isNullOrUndefined} from 'util';
import {OAnnotJSON, OAudiofile, OLabel, OLevel, OSegment} from '../types/annotjson';
export class UpdateManager {
  private version = '';
  private sessService: SessionService;

  constructor(sessService: SessionService) {
    this.version = sessService.version;
    this.sessService = sessService;
  }

  public checkForUpdates() {
    const appversion = AppInfo.version;

    if (isNullOrUndefined(this.version) || appversion !== this.version) {
      console.log('update...');
      this.update();
    }
  }

  private update() {
    const appversion = AppInfo.version;

    if (isNullOrUndefined(this.version)) {
      if (!isNullOrUndefined(this.sessService.transcription)) {
        console.log('Convert to new AnnotJSON...');

        const audiofile: OAudiofile = new OAudiofile();
        audiofile.name = '';
        audiofile.size = 0;
        audiofile.duration = 0;
        audiofile.samplerate = 0;

        const segments: OSegment[] = [];

        let start = 0;
        for (let i = 0; i < this.sessService.transcription.length; i++) {
          const transcript = this.sessService.transcription[i].transcript;
          const time = this.sessService.transcription[i].time.samples;

          const segment = new OSegment((i + 1), start, (time - start));
          segment.labels.push(new OLabel('Orthographic', transcript));

          start = time;
        }

        const level: OLevel = new OLevel('Orthographic', 'SEGMENT');
        level.items = segments;
        const levels: OLevel[] = [];
        levels.push(level);

        const annotation: OAnnotJSON = new OAnnotJSON(audiofile.name, audiofile.samplerate, levels);
        console.log('IMPORTED:');
        this.sessService.localStr.store('annotation', annotation);
        console.log(this.sessService.annotation);
        console.log('delete old transcription');
        this.sessService.localStr.store('transcription', null);
      } else {
        // OCTRAJSON found
        console.log('clear OCTRAJSON');
        this.sessService.localStr.store('annotation', null);
        this.sessService.version = appversion;
      }
    } else {
      console.log('version available');
      // update

      this.sessService.version = appversion;
    }
  }
}
