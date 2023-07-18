import { OAudiofile } from "./annotjson";
import { Converter, IFile } from "./converters";

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
