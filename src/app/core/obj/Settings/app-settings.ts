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
    'inactivityNotice': {
      'showAfter': number;
    }
  };
}
