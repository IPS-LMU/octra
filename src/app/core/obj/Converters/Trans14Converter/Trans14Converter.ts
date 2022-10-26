import {Converter, ExportResult, IFile, ImportResult} from '../Converter';
import {OAnnotJSON, OAudiofile, OLabel, OLevel, OSegment} from '../../Annotation';
import * as X2JS from 'x2js';
import {
  Trans14XMLDocument,
  XMLTransEpisodeNode,
  XMLTransNode,
  XMLTransSectionNode,
  XMLTransSpeakerNode,
  XMLTransSpeakersNode,
  XMLTransSyncNode,
  XMLTransTextNode,
  XMLTransTopicsNode,
  XMLTransTurnNode
} from './Trans14XMLDocument';
import {Trans14Speaker, Trans14Topic, Trans14Turn} from './types';
import * as moment from 'moment';

/**
 * DTD: https://github.com/giuliopaci/transcriber/blob/master/etc/trans-14.dtd
 */
export class Trans14Converter extends Converter {

  public constructor() {
    super();
    this._application = 'Transcriber';
    this._name = 'Trans 14';
    this._extension = '.trs';
    this._website.title = 'Transcriber';
    this._website.url = 'https://github.com/giuliopaci/transcriber';
    this._conversion.export = true;
    this._conversion.import = true;
    this._notice = `Import: "Background" tag is going to be ignored. In case of multi-speaker annotation each tier
is going to be named after the speaker identifier. Time markers should be precise. Events are wrapped by "<>" and placed into the text.\n
Export: Octra can't create the following tags: Event, Who, Background. Octra creates a section and one turn for each speaker.`;
    this._encoding = 'UTF-8';
  }

  public export(annotation: OAnnotJSON, audiofile: OAudiofile): ExportResult {
    const audiofileName = audiofile.name.substring(0, audiofile.name.lastIndexOf('.'));
    const audioDurationSeconds = audiofile.duration / audiofile.samplerate;

    const document = new Trans14XMLDocument();

    document.trans = new XMLTransNode({
      version_date: moment().format('YYYY-MM-DD')
    });

    const topics = new XMLTransTopicsNode();
    document.trans.appendChild(topics);

    const segmentLevels = annotation.levels.filter(a => a.type === 'SEGMENT');
    const moreThanOneLevel = segmentLevels.length > 1;

    if (moreThanOneLevel) {
      // add speakers
      const speakers = new XMLTransSpeakersNode();
      document.trans.appendChild(speakers);

      for (const segmentLevel of segmentLevels) {
        speakers.appendChild(new XMLTransSpeakerNode({
          id: segmentLevel.name.replace(/\s/g, ''),
          name: segmentLevel.name
        }));
      }
    }

    const episode = new XMLTransEpisodeNode();
    document.trans.appendChild(episode);

    for (const level of segmentLevels) {
      const sectionTime = {
        start: '0',
        end: audioDurationSeconds.toFixed(3)
      };
      const speakerName = level.name.replace(/\s/g, '');
      const section = new XMLTransSectionNode({
        type: 'report',
        startTime: sectionTime.start,
        endTime: sectionTime.end
      });
      episode.appendChild(section);

      const turn = new XMLTransTurnNode({
        speaker: moreThanOneLevel ? speakerName : undefined,
        startTime: '0',
        endTime: audioDurationSeconds.toFixed(3)
      });
      section.appendChild(turn);

      // insert items
      for (const item of level.items) {
        turn.appendChild(new XMLTransSyncNode({
          time: (item.sampleStart / audiofile.samplerate).toFixed(3)
        }));

        turn.appendChild(new XMLTransTextNode(item.labels[0].value));
      }
    }

    const content = document.toString();
    return {
      file: {
        name: audiofileName + '.trs',
        content,
        type: 'application/xml',
        encoding: 'utf-8'
      }
    };
  }

  public import(file: IFile, audiofile: OAudiofile): ImportResult {
    if (audiofile !== null && audiofile !== undefined) {
      const result = new OAnnotJSON(audiofile.name, audiofile.samplerate);

      const x2js = new X2JS();
      const xml = x2js.xml2dom(file.content);

      // 2.
      // 3. parse

      // remove all child nodes that contain "\n"
      const cleaned = this.cleanTransDocument(xml);


      if (cleaned.childNodes.length === 1 && cleaned.childNodes[0].nodeName === 'Trans') {
        // create typed constant root
        const rootElement: HTMLElement = cleaned.childNodes[0] as any;

        const audioFileName = rootElement.getAttribute('audio_filename');
        const version = rootElement.getAttribute('version');
        const versionDate = rootElement.getAttribute('version_date');
        const scribe = rootElement.getAttribute('scribe');
        const xmlLang = rootElement.getAttribute('xml:lang');
        const elapsedTime = rootElement.getAttribute('elapsed time');

        const topics: Trans14Topic[] = [];
        const speakers: Trans14Speaker[] = [];

        let segmentCounter = 1;
        for (let i = 0; i < rootElement.childNodes.length; i++) {
          const child = rootElement.childNodes[i];
          const firstTagName = child.nodeName;

          for (let j = 0; j < child.childNodes.length; j++) {
            const child2 = child.childNodes[j] as HTMLElement;

            switch (firstTagName) {
              case('Topics'):
                topics.push({
                  id: child2.getAttribute('id'),
                  desc: child2.getAttribute('desc')
                });
                break;
              case('Speakers'):
                speakers.push({
                  id: child2.getAttribute('id'),
                  name: child2.getAttribute('name'),
                  type: child2.getAttribute('type')
                });
                break;
              case('Episode'):
                for (let k = 0; k < child2.childNodes.length; k++) {
                  const turnElement = child2.childNodes[k] as HTMLElement;
                  const turn: Trans14Turn = {
                    speaker: turnElement.getAttribute('speaker') + '',
                    startTime: turnElement.getAttribute('startTime') + '',
                    endTime: turnElement.getAttribute('endTime') + ''
                  };


                  let startTime: number;
                  let endTime: number;
                  let currentLevel: OLevel;
                  let lastTurnChild: HTMLElement;

                  for (let l = 0; l < turnElement.childNodes.length; l++) {
                    const turnChild = turnElement.childNodes[l] as HTMLElement;

                    if (turnChild.nodeType === 3) {
                      // text
                      const text = turnChild.nodeValue.replace(/([\r\n]+)/gm, '').replace(/(\s)\s+/g, '$1').trim();

                      if (!currentLevel) {
                        currentLevel = result.levels.find(a => a.name === turn.speaker);
                        if (!currentLevel) {
                          currentLevel = new OLevel(turn.speaker && turn.speaker !== 'null' ? turn.speaker : 'OCTRA_1', 'SEGMENT', []);
                          result.levels.push(currentLevel);
                        }
                      }

                      let newStartTime = (startTime) ? Math.round(startTime * audiofile.samplerate) : undefined;
                      let newEndTime = (endTime) ? Math.round(endTime * audiofile.samplerate) : undefined;
                      let lastSegmentEndTime;
                      let lastSegment: OSegment;

                      if (currentLevel.items.length > 0) {
                        lastSegment = currentLevel.items[currentLevel.items.length - 1] as OSegment;
                        lastSegmentEndTime = lastSegment.sampleStart + lastSegment.sampleDur;
                      }

                      // TODO CONTINUE HERE
                      // TODO check case that there is no identified speaker (e.g. ASR)
                      // TODO there could be a last segment with start equal audio end

                      if (lastTurnChild && lastTurnChild.nodeName !== 'Event') {
                        if (!newStartTime) {
                          // use turn start time
                          newStartTime = Math.round(Number(turn.startTime) * audiofile.samplerate);
                        }

                        if (lastSegmentEndTime && !isNaN(lastSegmentEndTime)) {
                          if (newStartTime - lastSegmentEndTime > 50) {
                            // add empty segment
                            currentLevel.items.push(new OSegment(segmentCounter++, lastSegmentEndTime,
                              newStartTime - lastSegmentEndTime, [new OLabel('TRN', '')]));
                          } else {
                            const maxStartTime = Math.max(newStartTime, lastSegmentEndTime);
                            if (lastSegment) {
                              lastSegment.sampleDur = maxStartTime - lastSegment.sampleStart;
                            }
                            newStartTime = maxStartTime;
                          }
                        } else if (lastSegment && isNaN(lastSegmentEndTime)) {
                          lastSegment.sampleDur = newStartTime - lastSegment.sampleStart;
                          if (newStartTime - lastSegment.sampleStart <= 0) {
                            currentLevel.items.splice(-1, 1);
                          }
                        }

                        if (l === turnElement.childNodes.length - 1) {
                          // last text segment in turn
                          newEndTime = Math.min(Math.round(Number(turn.endTime) * audiofile.samplerate), audiofile.duration);
                        }

                        const sampleStart = newStartTime;
                        const sampleDur = newEndTime - sampleStart;

                        if (currentLevel) {
                          currentLevel.items.push(new OSegment(segmentCounter++, sampleStart, sampleDur, [new OLabel('TRN', text)]));
                        } else {
                          return {
                            annotjson: null,
                            audiofile: null,
                            error: `Import failed.`
                          };
                        }
                      } else if (lastSegment) {
                        // last node was of type Event => append text
                        lastSegment.labels[0].value += ` ${text}`;
                      }
                    } else {
                      if (turnChild.nodeName === 'Sync') {
                        startTime = Number(turnChild.getAttribute('time'));

                        // set end duration for the last segment in turn
                        if (currentLevel && currentLevel.items.length > 0 && l === turnElement.childNodes.length - 1) {
                          const lastSegment = currentLevel.items[currentLevel.items.length - 1];

                          if (isNaN(currentLevel.items[currentLevel.items.length - 1].sampleDur)) {
                            const sampleEnd = Math.round(startTime * audiofile.samplerate);

                            if (Math.abs(audiofile.duration - sampleEnd) <= 10) {
                              lastSegment.sampleDur = audiofile.duration - lastSegment.sampleStart;
                            } else {
                              lastSegment.sampleDur = sampleEnd - lastSegment.sampleStart;
                            }
                          }
                        }
                      } else if (turnChild.nodeName === 'Who') {
                        const whoIndex = Number(turnChild.getAttribute('nb')) - 1;
                        const speaker = speakers[whoIndex];
                        currentLevel = result.levels.find(a => a.name === speaker.id);

                        if (!currentLevel) {
                          currentLevel = new OLevel(speaker.id, 'SEGMENT', []);
                          result.levels.push(currentLevel);
                        }
                      } else if (turnChild.nodeName === 'Event') {
                        // insert event as marker
                        const markerName = turnChild.getAttribute('desc');
                        if (markerName && markerName.trim() !== '') {
                          // insert marker in text
                          if (currentLevel && currentLevel.items.length > 0) {
                            const lastSegment = currentLevel.items[currentLevel.items.length - 1];
                            lastSegment.labels[0].value += ` <${markerName.trim()}>`;
                          }
                        }
                      }
                    }
                    lastTurnChild = turnChild;
                  }
                }

                break;
            }
          }
        }
      } else {
        return {
          annotjson: null,
          audiofile: null,
          error: `Invalid .tag file`
        };
      }

      return {
        annotjson: result,
        audiofile: null,
        error: ''
      };
    }

    return {
      annotjson: null,
      audiofile: null,
      error: `Missing audio file`
    };
  }

  private cleanChildNode(child: ChildNode) {
    for (let i = 0; i < child.childNodes.length; i++) {
      const childNode = child.childNodes[i];
      if (childNode.nodeType === 3 && childNode.nodeValue.trim() === '') {
        childNode.parentNode.removeChild(childNode);
        --i;
      } else {
        for (let j = 0; j < childNode.childNodes.length; j++) {
          const childNode1 = childNode.childNodes[j];

          if (childNode1.nodeType === 3 && childNode1.nodeValue.trim() === '') {
            childNode1.parentNode.removeChild(childNode1);
            --j;
          }

          this.cleanChildNode(childNode1);
        }
      }
    }
  }

  private cleanTransDocument(document: Document) {
    for (let i = 0; i < document.childNodes.length; i++) {
      const childNode = document.childNodes[i] as HTMLElement;
      if (childNode.tagName !== 'Trans' || childNode.nodeType === 10) {
        childNode.parentNode.removeChild(childNode);
        --i;
      } else {
        this.cleanChildNode(childNode);
      }
    }

    if (document.childNodes.length === 1) {
      // TODO success
    } else {
      // TODO return error
    }

    return document;
  }
}
