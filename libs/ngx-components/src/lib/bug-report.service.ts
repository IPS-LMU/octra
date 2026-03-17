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

  pkgText = '';

  public getPackage<T extends BugReportTool>(
    toolVersion: string,
  ): {
    dto: FeedbackRequestPropertiesDto;
    protocol?: File;
    protocolObj: BugReportProtocol<T>;
  } {
    const protocol: { tool: { version: string; url: string }; entries: (ConsoleEntry | ConsoleGroupEntry)[] } = {
      tool: {
        version: toolVersion,
        url: window.location.href,
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

    this.pkgText = JSON.stringify(
      {
        ...dto,
        protocol,
      },
      null,
      2,
    );

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

  sendReport(name: string, email: string, message: string, sendProtocol: boolean, screenshots: any[], toolVersion: string): Observable<any> {
    const pkg = this.getPackage(toolVersion);
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
