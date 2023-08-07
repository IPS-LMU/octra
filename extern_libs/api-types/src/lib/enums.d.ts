export declare enum ProjectUserRole {
    transcriber = "transcriber",
    projectAdministrator = "project_admin",
    dataDelivery = "data_delivery"
}
export declare enum ProjectVisibility {
    public = "public",
    private = "private"
}
export declare enum GlobalUserRole {
    administrator = "administrator",
    user = "user",
    app = "app"
}
export declare enum AccountRole {
    administrator = "administrator",
    user = "user",
    app = "app",
    projectAdministrator = "project_admin",
    dataDelivery = "data_delivery",
    public = "public"
}
export declare enum AccountRoleScope {
    system = "system",
    project = "project"
}
export declare enum TaskStatus {
    draft = "DRAFT",
    free = "FREE",
    paused = "PAUSED",
    busy = "BUSY",
    finished = "FINISHED",
    failed = "FAILED",
    postponed = "POSTPONED"
}
export declare enum TaskInputOutputCreatorType {
    user = "user",
    app = "app"
}
export declare enum AccountLoginMethod {
    'local' = "local",
    'shibboleth' = "shibboleth"
}
export declare enum PolicyType {
    'privacy' = "privacy",
    'terms_and_conditions' = "terms_and_conditions"
}
export declare enum AccountFieldDefinitionType {
    'header' = "header",
    'longtext' = "longtext",
    'text' = "text",
    'selection' = "selection",
    'category_selection' = "category_selection",
    'multiple_choice' = "multiple_choice",
    'radio_buttons' = "radio_buttons",
    'boolean' = "boolean"
}
export declare enum AccountFieldContext {
    'project' = "project",
    'account' = "account"
}
export declare enum AccountPersonGender {
    'male' = "male",
    'female' = "female",
    'divers' = "divers"
}
export declare enum ContentType {
    'Text' = "Text",
    'AnnotJSON' = "AnnotJSON",
    'Textgrid' = "Textgrid"
}
export declare enum ToolType {
    'web-application' = "web-application",
    'console-application' = "console-application",
    'desktop-application' = "desktop-application"
}
export declare enum ToolProcessingType {
    'manual' = "manual",
    'automatic' = "automatic"
}
export declare enum AccountBatchAction {
    'set_active' = "set_active",
    'set_inactive' = "set_inactive",
    'send_email_verification' = "send_email_verification",
    'send_password_reset' = "send_password_reset"
}
