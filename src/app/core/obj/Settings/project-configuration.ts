import {Group} from '../FeedbackForm/Group';

export interface ProjectSettings {
  version: string;
  logging: {
    forced: boolean
  };
  navigation: {
    'export': boolean,
    'interfaces': boolean,
    'help_url': string
  };
  responsive: {
    enabled: boolean,
    fixedwidth: number
  };
  agreement: {
    enabled: boolean,
    text: any
  };
  languages: string[];
  interfaces: string[];
  plugins: any;
  feedback_form: Group[];
}
