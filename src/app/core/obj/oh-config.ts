export interface ASRPluginConfiguration {
  enabled: boolean;
  calls: string[];
  'api': {
    'commands': OHCommand[];
    'languages': OHLanguageObject[];
    'services': OHService[];
    'asrInfoURL'?: string;
    'basConfigURL'?: string;
    'asrQuotaInfoURL'?: string;
  };
  'plugins': {
    'emailSender': {
      'authKey': string;
      'url': string;
    },
    'tracking'?: {
      'active': string,
      'matomo': {
        'host': 'https://stats.clarin.eu/',
        'siteID': 34
      }
    }
  };
  'allowed_browsers': {
    'name': string,
    'version': string
  }[];
}

export interface OHLanguageObject {
  code: string;
  name: string;
  asr: string;
  state: string;
  host: string;
}

export interface OHCommand {
  name: string;
  calls: string[];
}

export interface OHService {
  provider: string;
  basName?: string;
  maxSignalDuration?: number;
  maxSignalSize?: number;
  quotaPerMonth?: number;
  knownIssues?: string;
  usedQuota?: number;
  type: string;
  termsURL: string;
  dataStoragePolicy: string;
  homepageURL: string;
  logoURL: string;
}
