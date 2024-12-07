export interface SupportedApplication {
  name: string;
  description: string;
  homepage?: string;
  appURL?: string;
  downloadURL?: string;
  notice?: {
    type: string;
    message: string;
  }[];
}

export class EMUWebAppApplication implements SupportedApplication {
  name = 'Emu-WebApp';
  description =
    'The EMU-webApp is an online and offline web application for labeling, visualizing and correcting speech and derived speech data.';
  homepage = 'https://ips-lmu.github.io/EMU.html';
  appURL = 'https://ips-lmu.github.io/EMU-webApp/';
  notice = [
    {
      type: 'warning',
      message: 'This application only supports .wav, _annot.json and TextGrid',
    },
  ];
}

export class OctraApplication implements SupportedApplication {
  name = 'Octra';
  description =
    'OCTRA is a web-application for the orthographic transcription of audio files.';
  homepage = 'https://clarin.phonetik.uni-muenchen.de/apps/octra/octra-2/login';
  appURL = 'https://clarin.phonetik.uni-muenchen.de/apps/octra/octra-2/login';
}

export class ELANApplication implements SupportedApplication {
  name = 'ELAN';
  description =
    'With ELAN a user can add an unlimited number of textual annotations to audio and/or video recordings. An annotation can be a sentence, word or gloss, a comment, translation or a description of any feature observed in the media. Annotations can be created on multiple layers, called tiers. Tiers can be hierarchically interconnected. An annotation can either be time-aligned to the media or it can refer to other existing annotations. The content of annotations consists of Unicode text and annotation documents are stored in an XML format (EAF).';
  homepage = 'https://archive.mpi.nl/tla/elan';
  appURL = 'https://archive.mpi.nl/tla/elan';
}

export class BASWebservicesApplication implements SupportedApplication {
  name = 'BASWebservices';
  description =
    'The BAS Web Services are a rich set of tools for speech sciences and technology. Starting with MAUS – automatic segmentation and labelling of speech – many tools were developed in the context of CLARIN‑D.';
  homepage = 'https://clarin.phonetik.uni-muenchen.de/BASWebServices/';
  appURL = 'https://clarin.phonetik.uni-muenchen.de/BASWebServices/';
  notice = [
    {
      type: 'warning',
      message: 'The file support depends on the service used.',
    },
  ];
}

export class PraatApplication implements SupportedApplication {
  name = 'Praat';
  description =
    'Praat is scientific tool for those studying linguistics that can analyze spectrograms.';
  homepage = 'https://www.fon.hum.uva.nl/praat/';
}

export class AnyVideoPlayer implements SupportedApplication {
  name = 'Video-Player';
  description = '';
}

export class AnyTextEditor implements SupportedApplication {
  name = 'Text-Editor';
  description = '';
}

export class WhisperXApplication implements SupportedApplication {
  name = 'WhisperX';
  description = 'Automatic Speech Recognition with Word-level Timestamps (& Diarization) ';
  homepage = 'https://github.com/m-bain/whisperX';
}

export class WordApplication implements SupportedApplication {
  name = 'Microsoft Word';
  description = '';
  homepage = 'https://www.microsoft.com/de-de/microsoft-365/word';
}
