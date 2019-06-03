import {Converter, ExportResult, IFile, ImportResult} from './Converter';
import {OAnnotJSON, OAudiofile, OLabel, OLevel, OSegment} from '../Annotation';
import * as moment from 'moment';
import * as X2JS from 'x2js';
import {isNullOrUndefined} from '../../shared/Functions';

export class ELANConverter extends Converter {

  public constructor() {
    super();
    this._application = 'ELAN';
    this._name = 'ELAN';
    this._extension = '.eaf';
    this._website.title = 'ELAN';
    this._website.url = 'https://tla.mpi.nl/tools/tla-tools/elan/';
    this._conversion.export = true;
    this._conversion.import = true;
    this._encoding = 'UTF-8';
    this._multitiers = true;
    this._notice = 'The attributes MEDIA_URL and MEDIA_RELATIVE_URL will be both set with the relative path. In order to open the ' +
      'transcript in ELAN the transcript file must be in the same folder as the audio file.';
  }

  public export(annotation: OAnnotJSON, audiofile: OAudiofile, levelnum: number): ExportResult {
    let result = '';
    let filename = '';

    const x2js = new X2JS();
    const jsonObj = {
      _declaration: {
        _attributes: {
          version: '1.0',
          encoding: 'utf-8'
        }
      },
      ANNOTATION_DOCUMENT: {
        _AUTHOR: 'OCTRA',
        _DATE: moment().format(),
        _FORMAT: '3.0',
        _VERSION: '3.0',
        '_xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        '_xsi:noNamespaceSchemaLocation': 'http://www.mpi.nl/tools/elan/EAFv3.0.xsd',
        HEADER: {
          _TIME_UNITS: 'milliseconds',
          MEDIA_DESCRIPTOR: {
            _MEDIA_URL: (audiofile.url !== '') ? audiofile.url : `./${annotation.annotates}`,
            _MEDIA_RELATIVE_URL: `./${annotation.annotates}`,
            _MIME_TYPE: 'audio/x-wav'
          }
        },
        TIME_ORDER: {
          TIME_SLOT: []
        },
        TIER: [],
        LINGUISTIC_TYPE: {
          _LINGUISTIC_TYPE_ID: 'default'
        }
      }
    };


    let tsidCounter = 1;
    let aidCounter = 1;
    for (let i = 0; i < annotation.levels.length; i++) {
      const level = annotation.levels[i];

      jsonObj.ANNOTATION_DOCUMENT.TIER.push(
        {
          ANNOTATION: [],
          _TIER_ID: level.name,
          _LINGUISTIC_TYPE_REF: 'default'
        }
      );

      if (level.type === 'SEGMENT') {
        // time slot on position 0 needed
        jsonObj.ANNOTATION_DOCUMENT.TIME_ORDER.TIME_SLOT.push({
          _TIME_SLOT_ID: `ts${tsidCounter++}`,
          _TIME_VALUE: `0`
        });

        // read annotation
        for (let j = 0; j < level.items.length; j++) {
          const segment = level.items[j];
          const miliseconds = Math.round((segment.sampleStart + segment.sampleDur) / annotation.sampleRate * 1000);

          // add time slot
          jsonObj.ANNOTATION_DOCUMENT.TIME_ORDER.TIME_SLOT.push({
            _TIME_SLOT_ID: `ts${tsidCounter}`,
            _TIME_VALUE: `${miliseconds}`
          });

          // add alignable annotation
          jsonObj.ANNOTATION_DOCUMENT.TIER[i].ANNOTATION.push(
            {
              ALIGNABLE_ANNOTATION: {
                _ANNOTATION_ID: `a${aidCounter}`,
                ANNOTATION_VALUE: segment.labels[0].value,
                _TIME_SLOT_REF1: `ts${tsidCounter - 1}`,
                _TIME_SLOT_REF2: `ts${tsidCounter}`
              }
            }
          );
          aidCounter++;
          tsidCounter++;
        }
      }
    }

    filename = `${annotation.name}${this._extension}`;
    result = x2js.js2xml(jsonObj);

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
    const result: ImportResult = {
      annotjson: null,
      audiofile: null,
      error: ''
    };

    result.annotjson = new OAnnotJSON(audiofile.name, audiofile.samplerate);

    const x2js = new X2JS();
    const jsonXML = x2js.xml2js<ELAN30Object>(file.content);

    let counter = 1;

    if (!isNullOrUndefined(jsonXML)) {
      const timeUnit = jsonXML.ANNOTATION_DOCUMENT.HEADER._TIME_UNITS;

      if (!isNullOrUndefined(timeUnit) && timeUnit === 'milliseconds') {
        let lastSample = 0;
        for (let i = 0; i < jsonXML.ANNOTATION_DOCUMENT.TIER.length; i++) {
          const tier = jsonXML.ANNOTATION_DOCUMENT.TIER[i];
          const level = new OLevel(tier._TIER_ID, 'SEGMENT', []);

          if (Array.isArray(tier.ANNOTATION)) {
            for (let j = 0; j < tier.ANNOTATION.length; j++) {
              const annotationElement = tier.ANNOTATION[j];
              const t1 = this.getSamplesFromTimeSlot(jsonXML, annotationElement.ALIGNABLE_ANNOTATION._TIME_SLOT_REF1, audiofile.samplerate);
              const t2 = this.getSamplesFromTimeSlot(jsonXML, annotationElement.ALIGNABLE_ANNOTATION._TIME_SLOT_REF2, audiofile.samplerate);

              if (t1 < 0 || t2 < 0) {
                result.error = 'Invalid time unit found';
                return result;
              } else {
                if (t1 > lastSample) {
                  // empty segment space before
                  level.items.push(new OSegment(counter++, lastSample, t1 - lastSample, [
                    new OLabel(tier._TIER_ID, '')]
                  ));
                }

                // correct segment
                level.items.push(new OSegment(counter++, t1, t2 - t1, [
                  new OLabel(tier._TIER_ID, annotationElement.ALIGNABLE_ANNOTATION.ANNOTATION_VALUE)]
                ));
              }
              lastSample = t2;
            }
          } else {
            const annotationElement = tier.ANNOTATION as any;
            const t1 = this.getSamplesFromTimeSlot(jsonXML, annotationElement.ALIGNABLE_ANNOTATION._TIME_SLOT_REF1, audiofile.samplerate);
            const t2 = this.getSamplesFromTimeSlot(jsonXML, annotationElement.ALIGNABLE_ANNOTATION._TIME_SLOT_REF2, audiofile.samplerate);

            if (t1 < 0 || t2 < 0) {
              result.error = 'Invalid time unit found';
              return result;
            } else {
              if (t1 > lastSample) {
                // empty segment space before
                level.items.push(new OSegment(counter++, lastSample, t1 - lastSample, [
                  new OLabel(tier._TIER_ID, '')]
                ));
              }
              // correct segment
              level.items.push(new OSegment(counter++, t1, t2 - t1, [
                new OLabel(tier._TIER_ID, annotationElement.ALIGNABLE_ANNOTATION.ANNOTATION_VALUE)]
              ));
            }
            lastSample = t2;
          }

          if (level.items.length > 0) {
            result.annotjson.levels.push(level);
          }

        }
      } else {
        result.error = 'The timeunits must be miliseconds';
      }

      return result;
    }
  }

  private getSamplesFromTimeSlot(obj: ELAN30Object, slotID: string, sampleRate: number) {
    for (let i = 0; i < obj.ANNOTATION_DOCUMENT.TIME_ORDER.TIME_SLOT.length; i++) {
      const timeorderElement = obj.ANNOTATION_DOCUMENT.TIME_ORDER.TIME_SLOT[i];

      if (timeorderElement._TIME_SLOT_ID === slotID) {
        const miliseconds = timeorderElement._TIME_VALUE;
        return Math.round((miliseconds / 1000) * sampleRate);
      }
    }

    return -1;
  }
}

export class ELAN30Object {
  ANNOTATION_DOCUMENT: {
    _AUTHOR: string,
    _DATE: string,
    _FORMAT?: string
    _VERSION: string,
    '_xmlns:xsi': string,
    '_xsi:noNamespaceSchemaLocation': string,
    LICENSE?: {
      _LICENSE_URL?: string
    }
    HEADER: {
      _MEDIA_FILE?: string,
      _TIME_UNITS?: 'milliseconds' | 'NTSC-frames' | 'PAL-frames',
      MEDIA_DESCRIPTOR?: {
        _MEDIA_URL: string,
        _MIME_TYPE: string,
        _TIME_ORIGIN?: number,
        _EXTRACTED_FROM?: string,
        _RELATIVE_MEDIA_URL?: string
      },
      LINKED_FILE_DESCRIPTOR?: {
        _LINK_URL: string,
        _RELATIVE_LINK_URL?: string,
        _MIME_TYPE: string,
        _TIME_ORIGIN?: number,
        _ASSOCIATED_WITH?: string
      },
      PROPERTY: {
        _NAME?: string,
        _text: string
      }[]
    },
    TIME_ORDER: {
      TIME_SLOT?: {
        _TIME_SLOT_ID: string,
        _TIME_VALUE?: number
      }[];
    },
    TIER: {
      _LINGUISTIC_TYPE_REF: string,
      _TIER_ID: string,
      _PARTICIPANT?: string,
      _ANNOTATOR?: string,
      _DEFAULT_LOCALE?: string,
      _PARENT_REF?: string,
      _EXT_REF?: string,
      _LANG_REF?: string,
      ANNOTATION: {
        ALIGNABLE_ANNOTATION?: {
          _ANNOTATION_ID: string,
          _TIME_SLOT_REF1: string,
          _TIME_SLOT_REF2: string,
          _SVG_REF?: string,
          ANNOTATION_VALUE: string
        },
        REF_ANNOTATION?: {
          _ANNOTATION_ID: string,
          _EXT_REF?: string,
          _LANG_REF: string,
          _CVE_REF: string,
          _ANNOTATION_REF: string,
          _PREVIOUS_ANNOTATION?: string,
          ANNOTATION_VALUE: string
        }
      }[]
    }[],
    LINGUISTIC_TYPE: {
      _LINGUISTIC_TYPE_ID: string,
      _TIME_ALIGNABLE?: string,
      _CONSTRAINTS?: string,
      _GRAPHIC_REFERENCES?: boolean,
      _CONTROLLED_VOCABULARY_REF?: string,
      _EXT_REF?: string,
      _LEXICON_REF?: string
    },
    LOCALE?: {},
    LANGUAGE?: {
      _LANG_ID: string,
      _LANG_DEF?: string,
      _LANG_LABEL?: string
    },
    CONSTRAINT: {
      _DESCRIPTION?: string,
      _STEREOTYPE: string
    }[],
    CONTROLLED_VOCABULARY?: {
      DESCRIPTION?: {
        _text: string,
        _LANG_REF: string
      },
      CV_ENTRY_ML?: {
        CVE_VALUE: {
          _LANG_REF: string,
          _DESCRIPTION?: string,
          _text: string
        },
        _CVE_ID: string,
        _EXT_REF?: string
      },
      _CV_ID: string,
      _EXT_REF?: string
    },
    LEXICON_REF?: {
      _LEX_REF_ID: string,
      _NAME: string,
      _TYPE: string,
      _URL: string,
      _LEXICON_ID: string,
      _LEXICON_NAME: string,
      _DATCAT_ID?: string,
      _DATCAT_NAME?: string
    },
    EXTERNAL_REF?: {
      _EXT_REF_ID: string,
      _TYPE: string
      _VALUE: string
    }
  };
}
