export interface OctraToolConfiguration {
    version: string;
    logging: {
        forced: boolean;
    };
    navigation: {
        export: boolean;
        interfaces: boolean;
        help_url: string;
    };
    responsive: {
        enabled: boolean;
        fixedwidth: 1200;
    };
    agreement: {
        enabled: boolean;
        text: Record<string, string>;
    };
    plugins: {
        pdfexport: {
            url: string;
        };
    };
    languages: string[];
    interfaces: string[];
    feedback_form: [
        {
            title: Record<string, string>;
            name: string;
            controls: {
                type: string;
                label: Record<string, string>;
                value: string;
                custom: any;
                required: boolean;
            }[];
        },
        {
            title: Record<string, string>;
            name: string;
            controls: {
                type: string;
                label: Record<string, string>;
                value: string;
                custom: any;
                required: boolean;
            }[];
        }
    ];
    octra?: {
        validationEnabled: boolean;
        sendValidatedTranscriptionOnly: boolean;
        showOverviewIfTranscriptNotValid: boolean;
        theme: string;
    };
    guidelines?: {
        showExampleNumbers: boolean;
        showExampleHeader: boolean;
    };
}
export declare const OctraDefaultToolConfiguration: OctraToolConfiguration;
