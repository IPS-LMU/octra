import { ConsoleEntry } from '../../console-logging.service';

export interface BugReportTranslations {
  abort?: string;
  addProtocol?: string;
  bugReportSent?: string;
  description?: string;
  eMail?: string;
  error?: string;
  giveFeedback?: string;
  introduction?: string;
  name?: string;
  protocol?: string;
  screenshots?: string;
  sendFeedback?: string;
  sending?: string;
}

export interface BugReportTool {
  version: string;
  url: string;
  customAttributes?: Record<string, any>;
}

export interface BugReportProtocol<T extends BugReportTool> {
  tool: T;
  entries: ConsoleEntry[];
}
