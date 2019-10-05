import {Converter, ExportResult, IFile, ImportResult} from './Converter';
import {OAnnotJSON, OAudiofile} from '../Annotation';
import * as X2JS from 'x2js';
import * as moment from 'moment';

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
    this._conversion.import = false;
    this._encoding = 'UTF-8';
    this._multitiers = false;
    this._notice = '';
  }

  public export(annotation: OAnnotJSON, audiofile: OAudiofile): ExportResult {
    let result = '';
    let filename = '';

    if (!(annotation === null || annotation === undefined)) {
      const teiDocument = new TEIDocument();
      teiDocument.TEI._xmlns = 'xmlns=http://www.tei-c.org/ns/1.0';
      const teiHeader = teiDocument.TEI.teiHeader;
      const application = teiHeader.encodingDesc.appInfo.application;

      application._ident = 'OCTRA';
      application._version = Converter.octraInformation.version;

      teiHeader.fileDesc.sourceDesc.recordingStmt.recording = {
        _type: 'audio',
        media: {
          _mimeType: audiofile.type,
          _url: annotation.annotates
        }
      };


      const x2js = new X2JS();

      let timeLineCounter = 1;
      let tagCounter = 1;
      for (let i = 0; i < annotation.levels.length; i++) {
        const level = annotation.levels[i];

        if (level.type === 'SEGMENT') {
          this.addPersonTag(teiDocument, level.name);

          for (let j = 0; j < level.items.length; j++) {
            const item = level.items[j];
            const transcript = item.labels[0].value;
            const segmentEnd = (item.sampleStart + item.sampleDur) / audiofile.samplerate;

            this.addTimeLineEntry(teiDocument, timeLineCounter, segmentEnd);
            tagCounter = this.addAnnotationBlock(teiDocument, level.name, timeLineCounter - 1, timeLineCounter,
              item.labels[0].value, tagCounter);
            timeLineCounter++;

            const start = Math.round((level.items[j].sampleStart / audiofile.samplerate) * 100) / 100;
            const duration = Math.round((level.items[j].sampleDur / audiofile.samplerate) * 100) / 100;
            result += `${annotation.name} 1 ${start} ${duration} ${transcript} 1.00\n`;
          }
        }
      }

      if (teiDocument.TEI.teiHeader.profileDesc.particDesc.length > 0) {
        // all right
        filename = annotation.name + this._extension;
        result = x2js.js2xml(teiDocument);

        return {
          file: {
            name: filename,
            content: result,
            encoding: 'UTF-8',
            type: 'text/plain'
          }
        };
      }
    }

    return null;
  }

  public import
  (file: IFile, audiofile: OAudiofile): ImportResult {
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

  private addPersonTag(document: TEIDocument, abbr: string, foreName: string = '') {
    document.TEI.teiHeader.profileDesc.particDesc.push(
      {
        person: {
          '_xml:id': abbr,
          _n: abbr,
          persName: {
            foreName: foreName,
            abbr: abbr
          }
        }
      });
  }

  private addTimeLineEntry(document: TEIDocument, timeLineCounter: number, interval: number) {
    document.TEI.text.timeline.when.push({
      '_xml:id': `TLI_${timeLineCounter}`,
      _interval: interval.toString(),
      _since: '#TLI_0'
    });
  }

  private addAnnotationBlock(document: TEIDocument, abbr: string, tliStart: number, tliEnd: number, transcript: string, tagCounter: number): number {
    let annotationBlock: {
      _who: string,
      _start: string,
      _end: string,
      u: {
        '_xml:id': string
        w?: {
          '_xml:id': string,
          __text: string
        }[]
      }[]
    } = {
      _who: `#${abbr}`,
      _start: `#TLI${tliStart}`,
      _end: `#TLI${tliEnd}`,
      u: []
    };

    const uTag: {
      '_xml:id': string
      w?: {
        '_xml:id': string,
        __text: string
      }[]
    } = {
      '_xml:id': `u_d1e${tagCounter}`
    };
    tagCounter++;

    let words = transcript.split(' ');
    words = words.filter((a) => {
      return a !== null && a !== ''
    });

    for (const word of words) {
      if (word !== '') {
        if (!uTag.hasOwnProperty('w')) {
          uTag.w = [];
        }

        uTag.w.push({
          '_xml:id': `w_d1e${tagCounter}`,
          __text: word
        });
      }
      tagCounter++;
    }

    annotationBlock.u.push(uTag);
    document.TEI.text.body.annotationBlock.push(annotationBlock);
    return tagCounter;
  }
}

export class TEIDocument {
  TEI: {
    '_xmlns': string,
    teiHeader: {
      fileDesc: {
        titleStmt?: {
          title: string
        },
        publicationStmt?: {
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
              broadcast?: {
                ab: {}
              },
              equipment?: {
                ab: {}
              }
            }
          }
        }
      },
      profileDesc: {
        particDesc: {
          person: {
            '_xml:id': string,
            _n: string,
            persName: {
              foreName: string,
              abbr: string
            }
          }
        }[],
        settingDesc?: {
          place: {},
          setting: {
            activity: {}
          }
        }
      },
      encodingDesc?: {
        appInfo: {
          application: {
            _ident: string,
            _version: string,
            label: string,
            desc: string
          }
        },
        transcriptionDesc?: {
          _ident: string,
          _version: string,
          desc: string,
          label: string
        }
      },
      revisionDesc?: {
        change: {
          _when: string,
          __text: string
        }
      }[]
    },
    text: {
      '_xml:lang'?: string,
      timeline: {
        _unit: string,
        when: {
          '_xml:id': string,
          _interval?: string,
          _since?: string
        }[]
      },
      body: {
        annotationBlock: {
          _who: string,
          _start: string,
          _end: string
          u: {
            '_xml:id': string
            w?: {
              '_xml:id': string
              __text: string
            }[]
          }[]
        }[]
      }
    }
  } = {
    '_xmlns': 'xmlns=http://www.tei-c.org/ns/1.0',
    teiHeader: {
      fileDesc: {
        titleStmt: {
          title: ''
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
              _type: '',
              media: {
                _mimeType: '',
                _url: ''
              }
            }
          }
        }
      },
      profileDesc: {
        particDesc: []
      },
      encodingDesc: {
        appInfo: {
          application: {
            _ident: 'OCTRA',
            _version: '',
            label: 'OCTRA Editor',
            desc: 'Orthographic Transcription'
          }
        }
      },
      revisionDesc: [{
        change: {
          _when: moment().format(),
          __text: 'Created by OCTRA'
        }
      }]
    },
    text: {
      timeline: {
        _unit: 's',
        when: [
          {
            '_xml:id': 'TLI_0'
          }
        ]
      },
      body: {
        annotationBlock: []
      }
    }
  };
}
