import { OAudiofile, OLabel, OSegment } from './annotjson';
import { Converter, IFile } from './converters';
import { SampleUnit } from '@octra/media';
import { Segment } from './segment';

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
 * returns the segment by the sample position (BrowserSample)
 */
export function getSegmentBySamplePosition(
  segments: Segment[],
  samples: SampleUnit
): number {
  let begin = 0;
  for (let i = 0; i < segments.length; i++) {
    if (i > 0) {
      begin = segments[i - 1].time.samples;
    }
    if (
      samples.samples > begin.valueOf() &&
      samples.samples <= segments[i].time.samples
    ) {
      return i;
    }
  }
  return -1;
}

export function getSegmentsOfRange(
  entries: Segment[],
  startSamples: SampleUnit,
  endSamples: SampleUnit
): Segment[] {
  if (startSamples.sampleRate !== endSamples.sampleRate) {
    throw new Error('Samplerate of both SampleUnits must be equal');
  }

  const result: Segment[] = [];
  let start = new SampleUnit(0, startSamples.sampleRate);

  for (const segment of entries) {
    if (
      (segment.time!.samples >= startSamples.samples &&
        segment.time!.samples <= endSamples.samples) ||
      (start.samples >= startSamples.samples &&
        start.samples <= endSamples.samples) ||
      (start.samples <= startSamples.samples &&
        segment.time!.samples >= endSamples.samples)
    ) {
      result.push(segment);
    }
    start = segment.time!.clone();
  }

  return result;
}

/***
 * removes a boundary and concatenates the transcripts of its neighbour.
 * @param entries
 * @param index index of the boundary
 * @param silenceValue the break marker
 * @param mergeTranscripts
 */
export function removeSegmentByIndex(
  entries: Segment[],
  index: number,
  silenceValue: string,
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
      const transcription: string = entries[index].value;
      if (
        nextSegment.value !== silenceValue &&
        transcription !== silenceValue &&
        mergeTranscripts
      ) {
        // concat transcripts
        if (nextSegment.value !== '' && transcription !== '') {
          nextSegment.value = transcription + ' ' + nextSegment.value;
        } else if (nextSegment.value === '' && transcription !== '') {
          nextSegment.value = transcription;
        }
        nextSegment.speakerLabel = segment.speakerLabel;
      } else if (nextSegment.value === silenceValue) {
        // delete pause
        nextSegment.value = transcription;
      }
    }

    entries.splice(index, 1);
  }
  return entries;
}

export function betweenWhichSegment(
  entries: Segment[],
  samples: number
): Segment | undefined {
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
  entries: Segment[],
  time: SampleUnit,
  label: string,
  value: string | undefined = undefined
): Segment[] {
  const newSegment: Segment = new Segment(time, label);

  if (value !== undefined) {
    newSegment.value = value;
  }

  if (
    entries.find((a) => {
      return a.time!.seconds === time.seconds;
    }) === undefined
  ) {
    entries.push(newSegment);
  } else {
    console.error(
      `segment with this timestamp ${time.seconds} already exists and can not be added.`
    );
  }
  entries = sort(entries);
  entries = cleanup(entries);
  return entries;
}

/**
 * sorts the segments by time in samples
 */
export function sort(entries: Segment[]) {
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

export function cleanup(entries: Segment[]) {
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
  entries: Segment[],
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
  entries: Segment[],
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
  levelName: string,
  entries: Segment[],
  lastOriginalSample: number
): OSegment[] {
  const result: OSegment[] = [];

  let start = 0;
  for (let i = 0; i < entries.length; i++) {
    const segment = entries[i];
    const labels: OLabel[] = [];

    labels.push(new OLabel('Speaker', segment.speakerLabel));
    labels.push(new OLabel(levelName, segment.value));

    let annotSegment = undefined;
    if (i < entries.length - 1) {
      annotSegment = new OSegment(
        i + 1,
        start,
        segment.time.samples - start,
        labels
      );
    } else {
      annotSegment = new OSegment(
        i + 1,
        start,
        lastOriginalSample - start,
        labels
      );
    }
    result.push(annotSegment);

    start = Math.round(segment.time.samples);
  }

  return result;
}

export function convertOSegmentsToSegments(
  levelName: string,
  entries: OSegment[],
  lastOriginalSample: SampleUnit
): Segment[] {
  const result = entries.map(
    (a) =>
      new Segment(
        new SampleUnit(
          a.sampleStart + a.sampleDur,
          lastOriginalSample.sampleRate
        ),
        levelName,
        a.labels.find((a) => a.name === levelName)?.value,
        a.id
      )
  );

  if (result[result.length - 1].time.samples !== lastOriginalSample.samples) {
    // add last segment
    result.push(new Segment(lastOriginalSample.clone(), '', ''));
  }

  return result;
}

/**
 * removes Segment by number of samples
 */
export function removeBySamples(entries: Segment[], timeSamples: SampleUnit) {
  for (let i = 0; i < entries.length; i++) {
    const segment = entries[i];

    if (segment.time!.equals(timeSamples)) {
      entries.splice(i, 1);
      return entries;
    }
  }
  return entries;
}
