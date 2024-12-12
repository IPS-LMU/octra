import { Group } from '../FeedbackForm/Group';

export interface ProjectSettings {
  version: string;
  logging: {
    forced: boolean;
  };
  navigation: {
    export: boolean;
    interfaces: boolean;
    help_url: string;
  };
  agreement: {
    enabled: boolean;
    text: any;
  };
  languages: string[];
  interfaces: string[];
  plugins: {
    pdfexport: {
      url: string;
    };
  };
  feedback_form: Group[];
  octra?: {
    asrEnabled?: boolean;
    tools?: ('combine-phrases' | 'cut-audio')[];
    validationEnabled?: boolean;
    sendValidatedTranscriptionOnly?: boolean;
    showOverviewIfTranscriptNotValid?: boolean;
    theme?: string;
    importOptions?: Record<string, any>;
  };
  guidelines: any;
}
