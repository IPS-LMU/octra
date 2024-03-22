import { OLabel, OSegment } from './annotjson';
import { Converter, IFile } from './converters';
import { OAudiofile, SampleUnit } from '@octra/media';
import { OctraAnnotationSegment } from './octraAnnotationSegment';

export function convertFromSupportedConverters(
  converters: Converter[],
  file: IFile,
  audioFile: OAudiofile
) {
  for (const converter of converters) {
    try {
      const result = converter.import(file, audioFile);
      if (result && result.annotjson) {
        return result;
      }
    } catch (e) {
      // ignore
    }
  }

  return undefined;
}

/**
 * checks if a given string contains a given substring
 * @param haystack string that should be searched
 * @param needle substring that is searched for
 */
export function contains(haystack: string, needle: string): boolean {
  return haystack.indexOf(needle) !== -1;
}

/**
 * returns the segment by the sample position (BrowserSample)
 */
export function getSegmentBySamplePosition(
  segments: OctraAnnotationSegment[],
  samples: SampleUnit
): number {
  let begin = 0;
  for (let i = 0; i < segments.length; i++) {
    if (i > 0) {
      begin = segments[i - 1].time.samples;
    }
    if (
      samples.samples > begin &&
      samples.samples <= segments[i].time.samples
    ) {
      return i;
    }
  }
  return -1;
}

export function getSegmentsOfRange(
  entries: OctraAnnotationSegment[],
  startSamples: SampleUnit,
  endSamples: SampleUnit
): {
  startIndex: number;
  endIndex: number;
} {
  if (startSamples.sampleRate !== endSamples.sampleRate) {
    throw new Error('Samplerate of both SampleUnits must be equal');
  }

  let start = new SampleUnit(0, startSamples.sampleRate);
  let startIndex = -1;
  let endIndex = -1;

  for (let i = 0; i < entries.length; i++) {
    const segment = entries[i];

    if (
      (segment.time!.samples >= startSamples.samples &&
        segment.time!.samples <= endSamples.samples)
    ) {
      if (startIndex < 0) {
        startIndex = i;
      }
      endIndex = i;
    } else if(segment.time.samples > endSamples.samples){
      break;
    }
  }

  return {startIndex, endIndex};
}

/***
 * removes a boundary and concatenates the transcripts of its neighbour.
 * @param entries
 * @param index index of the boundary
 * @param silenceValue the break marker
 * @param mergeTranscripts
 */
export function removeSegmentByIndex(
  entries: OctraAnnotationSegment[],
  index: number,
  silenceValue: string | undefined,
  mergeTranscripts = true
) {
  if (index > -1 && index < entries.length) {
    const segment = entries[index];
    if (
      index < entries.length - 1 &&
      silenceValue !== undefined &&
      silenceValue !== ''
    ) {
      const nextSegment = entries[index + 1];
      const transcription =
        entries[index].getFirstLabelWithoutName('Spealer')?.value;

      if (
        silenceValue !== undefined &&
        nextSegment.getFirstLabelWithoutName('Speaker')?.value !==
          silenceValue &&
        transcription !== silenceValue &&
        mergeTranscripts
      ) {
        // concat transcripts
        if (
          nextSegment.getFirstLabelWithoutName('Speaker')?.value !== '' &&
          transcription !== ''
        ) {
          nextSegment.changeFirstLabelWithoutName(
            'Speaker',
            transcription +
              ' ' +
              nextSegment.getFirstLabelWithoutName('Speaker')?.value
          );
        } else if (
          nextSegment.getFirstLabelWithoutName('Speaker')?.value === '' &&
          transcription !== ''
        ) {
          nextSegment.changeFirstLabelWithoutName(
            'Speaker',
            transcription ?? ''
          );
        }
      } else if (
        nextSegment.getFirstLabelWithoutName('Speaker')?.value === silenceValue
      ) {
        // delete pause
        nextSegment.changeFirstLabelWithoutName('Speaker', transcription ?? '');
      }
    }

    entries.splice(index, 1);
  }
  return entries;
}

export function betweenWhichSegment(
  entries: OctraAnnotationSegment[],
  samples: number
): OctraAnnotationSegment | undefined {
  let start = 0;

  for (const segment of entries) {
    if (samples >= start && samples <= segment.time.samples) {
      return segment;
    }
    start = segment.time.samples;
  }

  return undefined;
}

/**
 * adds new Segment
 */
export function addSegment(
  itemIDCounter: number,
  entries: OctraAnnotationSegment[],
  time: SampleUnit,
  label: string,
  value: string | undefined = undefined
): {
  entries: OctraAnnotationSegment[];
  itemIDCounter: number;
} {
  const newSegment: OctraAnnotationSegment = new OctraAnnotationSegment(
    itemIDCounter,
    time,
    [new OLabel(label, value ?? '')]
  );

  if (
    entries.find((a) => {
      return a.time!.seconds === time.seconds;
    }) === undefined
  ) {
    entries.push(newSegment);
    entries = sort(entries);
    entries = cleanup(entries);
    return { entries, itemIDCounter: itemIDCounter + 1 };
  } else {
    console.error(
      `segment with this timestamp ${time.seconds} already exists and can not be added.`
    );
  }
  return { entries, itemIDCounter: itemIDCounter };
}

/**
 * sorts the segments by time in samples
 */
export function sort(entries: OctraAnnotationSegment[]) {
  entries.sort((a, b) => {
    if (a.time!.samples < b.time!.samples) {
      return -1;
    }
    if (a.time!.samples === b.time!.samples) {
      return 0;
    }
    return 1;
  });
  return entries;
}

export function cleanup(entries: OctraAnnotationSegment[]) {
  const remove: number[] = [];

  if (entries.length > 1) {
    let last = entries[0];
    for (let i = 1; i < entries.length; i++) {
      if (last.time!.samples === entries[i].time!.samples) {
        remove.push(i);
      }
      last = entries[i - 1];
    }

    for (let i = 0; i < remove.length; i++) {
      entries.splice(remove[i], 1);
      remove.splice(i, 1);
      --i;
    }
  }
  return entries;
}

export function getStartTimeBySegmentID(
  entries: OctraAnnotationSegment[],
  id: number
): SampleUnit | undefined {
  const segmentIndex = entries.findIndex((a) => a.id === id);

  if (segmentIndex > -1) {
    if (segmentIndex > 0) {
      return entries[segmentIndex].time.clone();
    } else {
      return new SampleUnit(0, entries[segmentIndex].time.sampleRate);
    }
  }
  return undefined;
}

export function combineSegments(
  entries: OctraAnnotationSegment[],
  segmentIndexStart: number,
  segmentIndexEnd: number,
  breakMarker: string
) {
  for (let i = segmentIndexStart; i < segmentIndexEnd; i++) {
    entries = removeSegmentByIndex(entries, i, breakMarker, false);
    i--;
    segmentIndexEnd--;
  }
}

/**
 * returns an array of normal segment objects with original values.
 */
export function convertSegmentsToOSegments(
  entries: OctraAnnotationSegment[]
): OSegment[] {
  return entries.map((a, i) =>
    a.serializeToOSegment(i > 0 ? entries[i - 1].time.samples : 0)
  );
}

export function convertOSegmentsToSegments(
  entries: OSegment[],
  sampleRate: number
): OctraAnnotationSegment[] {
  return entries.map((a) =>
    OctraAnnotationSegment.deserializeFromOSegment(a, sampleRate)
  );
}

/**
 * removes Segment by number of samples
 */
export function removeBySamples(
  entries: OctraAnnotationSegment[],
  timeSamples: SampleUnit
) {
  for (let i = 0; i < entries.length; i++) {
    const segment = entries[i];

    if (segment.time!.equals(timeSamples)) {
      entries.splice(i, 1);
      return entries;
    }
  }
  return entries;
}
