import { Group } from '../FeedbackForm/Group';

export interface ProjectSettings {
  version: string;
  logging?: {
    forced?: boolean;
  };
  navigation: {
    export?: boolean;
    interfaces: boolean;
  };
  interfaces: string[];
  feedback_form?: Group[]; // re-add feedback form generation later
  octra?: {
    asrEnabled?: boolean;
    tools?: ('combine-phrases' | 'cut-audio')[];
    validationEnabled?: boolean;
    sendValidatedTranscriptionOnly?: boolean;
    showOverviewIfTranscriptNotValid?: boolean;
    theme?: string;
    importOptions?: Record<string, any>;
  };
  guidelines?: {
    showExampleNumbers?: boolean;
    showExampleHeader?: boolean;
  };
}
