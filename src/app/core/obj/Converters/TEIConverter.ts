import {Converter, ExportResult, IFile, ImportResult} from './Converter';
import {OAnnotJSON, OAudiofile} from '../Annotation';
import * as X2JS from 'x2js';

export class TEIConverter extends Converter {

  // https://tei-c.org/release/doc/tei-p5-doc/en/Guidelines.pdf

  public constructor() {
    super();
    this._application = 'Folker';
    this._name = 'TEI';
    this._extension = '.xml';
    this._website.title = 'TEI Format';
    this._website.url = 'https://exmaralda.org/de/folker-de/';
    this._conversion.export = true;
    this._conversion.import = true;
    this._encoding = 'UTF-8';
    this._multitiers = false;
    this._notice = '';
  }

  public export(annotation: OAnnotJSON, audiofile: OAudiofile, levelnum: number): ExportResult {
    let result = '';
    let filename = '';

    if (!(annotation === null || annotation === undefined)) {
      const x2js = new X2JS();
      const xmlJSON = {};

      const level = annotation.levels[levelnum];

      for (let j = 0; j < level.items.length; j++) {
        const transcript = level.items[j].labels[0].value;
        const start = Math.round((level.items[j].sampleStart / audiofile.samplerate) * 100) / 100;
        const duration = Math.round((level.items[j].sampleDur / audiofile.samplerate) * 100) / 100;
        result += `${annotation.name} 1 ${start} ${duration} ${transcript} 1.00\n`;
      }

      filename = annotation.name + this._extension;

      result = x2js.js2xml(xmlJSON);
    }

    return {
      file: {
        name: filename,
        content: result,
        encoding: 'UTF-8',
        type: 'text/plain'
      }
    };
  }

  public import(file: IFile, audiofile: OAudiofile): ImportResult {
    if (audiofile !== null && audiofile !== undefined) {
      const result = new OAnnotJSON(audiofile.name, audiofile.samplerate);

      const content = file.content;

      return {
        annotjson: null,
        audiofile: null,
        error: `This CTM file is not compatible with this audio file.`
      };
    }
  }
}

export class TEIDocument {
  TEI: {
    '_xmlns': string,
    teiHeader: {
      fileDesc: {
        titleStmt: {
          title: string
        },
        publicationStmt: {
          authority: {},
          availability: {},
          distributor: {},
          address: {
            addrLine: {}
          }
        },
        sourceDesc: {
          recordingStmt: {
            recording: {
              _type: string
              media: {
                _mimeType: string,
                _url: string
              },
              broadcast: {
                ab: {}
              },
              equipment: {
                ab: {}
              }
            }
          }
        }
      },
      profileDesc: {
        particDesc: {},
        settingDesc: {
          place: {},
          setting: {
            activity: {}
          }
        }
      },
      encodingDesc: {
        appInfo: {
          application: {
            _ident: string,
            _version: string,
            label: {},
            desc: {}
          }
        },
        transcriptionDesc: {
          _ident: string,
          _version: string,
          desc: string,
          label: string
        }
      },
      revisionDesc: {
        change: {
          _when: string
        }
      }
    },
    text: {
      '_xml:lang': string,
      timeline: {
        _unit: string,
        when: {
          'xml:id': string,
          _interval?: string,
          _since: string
        }[]
      },
      body: {
        annotationBlock: {
          _start: string,
          end: string
          u: {
            '_xml:id': string
            w: {
              '_xml:id': string
            }
          }[]
        }[]
      }
    }
  }
}
