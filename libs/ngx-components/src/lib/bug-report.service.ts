import { inject, Injectable } from '@angular/core';
import { FeedbackRequestPropertiesDto } from '@octra/api-types';
import { OctraAPIService } from '@octra/ngx-octra-api';
import { removeProperties } from '@octra/utilities';
import { BrowserInfo } from '@octra/web-media';
import { Observable } from 'rxjs';
import { BugReportProtocol, BugReportTool } from './components/bugreport-modal/types';
import { ConsoleEntry, ConsoleGroupEntry, ConsoleLoggingService, ConsoleType } from './console-logging.service';

@Injectable({
  providedIn: 'root',
})
export class BugReportService {
  private consoleService = inject(ConsoleLoggingService);
  private api = inject(OctraAPIService);

  public getPackage<T extends BugReportTool>(
    tool: T,
  ): {
    dto: FeedbackRequestPropertiesDto;
    protocol?: File;
    protocolObj: BugReportProtocol<T>;
  } {
    const protocol: { tool: { version: string; url: string }; entries: (ConsoleEntry | ConsoleGroupEntry)[] } = {
      tool: {
        version: tool.version,
        url: tool.url,
        ...tool.customAttributes,
      },
      entries: this.consoleService.console,
    };

    const dto: FeedbackRequestPropertiesDto = {
      type: 'bug',
      technicalInformation: {
        os: {
          name: BrowserInfo.os.family,
          version: BrowserInfo.os.version,
        },
        browser: {
          name: BrowserInfo.browser + ' ' + BrowserInfo.version,
          version: BrowserInfo.os.version,
        },
      },
    };

    return {
      dto,
      protocol: new File([JSON.stringify(protocol)], `Octra_procotol_${Date.now()}.json`, {
        type: 'application/json',
      }),
      protocolObj: {
        ...protocol,
        entries: protocol.entries.map((a) => {
          if (a.entries) {
            return {
              timestamp: a.timestamp,
              type: ConsoleType.LOG,
              message: `<b>${a.label}</b><br><pre>${JSON.stringify(a.entries, null, 2)}</pre>`,
            };
          }
          return a;
        }),
      } as BugReportProtocol<T>,
    };
  }

  sendReport<T extends BugReportTool>(
    name: string,
    email: string,
    message: string,
    sendProtocol: boolean,
    screenshots: any[],
    tool: T,
  ): Observable<any> {
    const pkg = this.getPackage(tool);
    let body: FeedbackRequestPropertiesDto = {
      ...pkg.dto,
      message: message ?? '',
      requester: {
        email,
        name,
      },
    };
    let protocol: File | undefined = pkg.protocol;

    if (!sendProtocol) {
      body = removeProperties(body, ['technicalInformation']);
      protocol = undefined;
    }

    return this.api.sendFeedback(
      body,
      protocol,
      screenshots?.map((a) => a.blob),
    );
  }
}
