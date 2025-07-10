import {
  AnnotJSONConverter,
  BundleJSONConverter,
  Converter,
  CTMConverter,
  ELANConverter,
  PartiturConverter,
  PraatTableConverter,
  PraatTextgridConverter,
  SRTConverter,
  TextConverter,
  WebVTTConverter,
  WhisperJSONConverter,
} from './';

export const AllOctraConverters: Converter[] = [
  new AnnotJSONConverter(),
  new WhisperJSONConverter(),
  new PraatTableConverter(),
  new PraatTextgridConverter(),
  new CTMConverter(),
  new PartiturConverter(),
  new BundleJSONConverter(),
  new ELANConverter(),
  new SRTConverter(),
  new WebVTTConverter(),
  new TextConverter(),
];
