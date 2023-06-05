import {Converter, ExportResult, IFile, ImportResult} from './Converter';
import {OAnnotJSON, OAudiofile, OLevel, OSegment} from '../Annotation';

export class OctraOnlineResultConverter extends Converter {

  public constructor() {
    super();
    this._application = 'Octra';
    this._name = 'OctraOnlineResult';
    this._website.title = 'OCTRA';
    this._website.url = 'https://clarin.phonetik.uni-muenchen.de/apps/octra/octra/';
    this._extension = '.json';
    this._conversion.export = false;
    this._conversion.import = false;
  }

  public export(annotation: OAnnotJSON, audiofile: OAudiofile): ExportResult {
    return null;
  }

  public import(file: IFile, audiofile: OAudiofile): ImportResult {
    if (audiofile !== null && audiofile !== undefined) {
      const result = new OAnnotJSON(audiofile.name, audiofile.samplerate);
      const content = file.content;

      if (content !== '') {
        try {
          const parsed: { start: number, length: number, text: string }[] = JSON.parse(content);
          const level = new OLevel('OCTRA_1', 'SEGMENT');

          let id = 1;
          if (Array.isArray(parsed)) {
            for (const parsedElement of parsed) {
              level.items.push(new OSegment(id++, parsedElement.start, parsedElement.length, [
                {
                  name: 'OCTRA_1',
                  value: parsedElement.text
                }
              ]));
            }
            result.levels.push(level);
            return {
              annotjson: result,
              audiofile: null,
              error: ''
            };
          } else {
            return {
              annotjson: null,
              audiofile: null,
              error: 'Octra result is not type of array (parse error).'
            };
          }
        } catch (e) {
          return {
            annotjson: null,
            audiofile: null,
            error: 'Could not read OctraResult (parse error).'
          };
        }
      } else {
        return {
          annotjson: null,
          audiofile: null,
          error: `Could not read AnnotJSON. (empty content)`
        };
      }
    }

    return {
      annotjson: null,
      audiofile: null,
      error: `This AnnotJSON is not compatible.`
    };
  }
}
