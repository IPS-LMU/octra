export interface AccountFieldSchema {
    class?: string;
}
export declare class AccountFieldDefinition2 {
    schema: AccountFieldSchema | AccountFieldSchema[];
    class?: string;
}
export type AccountFieldTranslation = Record<string, string>;
export declare class AccountFieldHeadline extends AccountFieldDefinition2 {
    schema: {
        class?: string;
        translation: AccountFieldTranslation;
        size: number;
    };
    constructor(partial: Partial<AccountFieldHeadline>);
}
export declare class AccountFieldControl extends AccountFieldDefinition2 {
    isRequired?: boolean;
    helpTextLabels?: AccountFieldTranslation;
    constructor(partial: Partial<AccountFieldControl>);
}
export declare class AccountFieldRadio extends AccountFieldControl {
    schema: {
        class?: string;
        label: AccountFieldTranslation;
        arrangement: 'horizontal' | 'vertical';
        options: {
            label: AccountFieldTranslation;
            value: string;
        }[];
    };
    constructor(partial: Partial<AccountFieldRadio>);
}
export declare class AccountFieldInlineText extends AccountFieldControl {
    schema: {
        class?: string;
        label: AccountFieldTranslation;
        type: 'text' | 'number' | 'email';
        placeholder: AccountFieldTranslation;
        minLength: number;
        maxLength: number;
    };
    constructor(partial: Partial<AccountFieldInlineText>);
}
export declare class AccountFieldTextArea extends AccountFieldControl {
    schema: {
        class?: string;
        label: AccountFieldTranslation;
        placeholder?: AccountFieldTranslation;
        minLength?: number;
        maxLength?: number;
    };
    constructor(partial: Partial<AccountFieldTextArea>);
}
export declare class AccountCategorySelection extends AccountFieldControl {
    multipleResults: boolean;
    schema: {
        class?: string;
        label: AccountFieldTranslation;
        selections: {
            name: string;
            class?: string;
            options: {
                label: AccountFieldTranslation;
                value: string;
            }[];
        }[];
    };
    constructor(partial: Partial<AccountCategorySelection>);
}
export declare class AccountFieldMultipleChoice extends AccountFieldControl {
    schema: {
        class?: string;
        label: AccountFieldTranslation;
        arrangement: 'horizontal' | 'vertical';
        options: {
            label: AccountFieldTranslation;
            value: string;
        }[];
    };
    constructor(partial: Partial<AccountFieldMultipleChoice>);
}
export declare class AccountFieldValue {
    pattern?: string;
    value?: string;
    constructor(partial: Partial<AccountFieldValue>);
}
export declare function generateLanguageOptions(): {
    label: {
        en: string;
    };
    value: string;
}[];
