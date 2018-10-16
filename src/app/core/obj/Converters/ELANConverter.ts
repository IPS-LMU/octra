import {Converter, ExportResult, IFile, ImportResult} from './Converter';
import {OAnnotJSON, OAudiofile} from '../Annotation/AnnotJSON';
import * as moment from 'moment';
import * as X2JS from 'x2js';

export class ELANConverter extends Converter {

  public constructor() {
    super();
    this._application = '';
    this._name = 'ELAN';
    this._extension = '.eaf';
    this._website.title = '';
    this._website.url = '';
    this._conversion.export = true;
    this._conversion.import = false;
    this._encoding = 'UTF-8';
    this._multitiers = true;
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
    return null;
  }
}
