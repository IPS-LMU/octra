export interface AppSettings {
  version: string;
  audio_server: {
    url: string
  };
  octra: {
    database: {
      name: string
    },
    login: {
      enabled: boolean
    },
    showdetails: boolean,
    responsive: {
      enabled: boolean,
      fixedwidth: number
    },
    bugreport: {
      enabled: boolean,
      name: string,
      auth_token: string,
      url: string
    },
    plugins: {
      audioCutter: {
        enabled: boolean,
        authToken: string,
        url: string
      },
      asr: ASRSettings
    },
    allowed_browsers: any[],
    allowed_projects: {
      name: string,
      password: string
    }[],
    languages: string[],
    tracking: {
      active: string
      matomo: {
        host: string,
        siteID: number
      }
    },
    audioExamples: {
      language: string;
      url: string;
      description: string;
    }[],
    'inactivityNotice': {
      'showAfter': number;
    }
  };
}

export interface ASRLanguage {
  code: string,
  name: string,
  asr: string,
  state: string,
  host: string
}

export interface ASRService {
  provider: string,
  type: string,
  termsURL: string,
  dataStoragePolicy: string,
  homepageURL: string,
  logoURL: string
}

export interface ASRSettings {
  enabled: boolean,
  calls: string[],
  services: ASRService[],
  languages: ASRLanguage[]
}
