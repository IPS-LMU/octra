var ProjectUserRole;
(function (ProjectUserRole) {
    ProjectUserRole["transcriber"] = "transcriber";
    ProjectUserRole["projectAdministrator"] = "project_admin";
    ProjectUserRole["dataDelivery"] = "data_delivery";
})(ProjectUserRole || (ProjectUserRole = {}));
var ProjectVisibility;
(function (ProjectVisibility) {
    ProjectVisibility["public"] = "public";
    ProjectVisibility["private"] = "private";
})(ProjectVisibility || (ProjectVisibility = {}));
var GlobalUserRole;
(function (GlobalUserRole) {
    GlobalUserRole["administrator"] = "administrator";
    GlobalUserRole["user"] = "user";
    GlobalUserRole["app"] = "app";
})(GlobalUserRole || (GlobalUserRole = {}));
var AccountRole;
(function (AccountRole) {
    AccountRole["administrator"] = "administrator";
    AccountRole["user"] = "user";
    AccountRole["app"] = "app";
    AccountRole["projectAdministrator"] = "project_admin";
    AccountRole["dataDelivery"] = "data_delivery";
    AccountRole["public"] = "public";
})(AccountRole || (AccountRole = {}));
var AccountRoleScope;
(function (AccountRoleScope) {
    AccountRoleScope["system"] = "system";
    AccountRoleScope["project"] = "project";
})(AccountRoleScope || (AccountRoleScope = {}));
var TaskStatus;
(function (TaskStatus) {
    TaskStatus["draft"] = "DRAFT";
    TaskStatus["free"] = "FREE";
    TaskStatus["paused"] = "PAUSED";
    TaskStatus["busy"] = "BUSY";
    TaskStatus["finished"] = "FINISHED";
    TaskStatus["failed"] = "FAILED";
    TaskStatus["postponed"] = "POSTPONED";
})(TaskStatus || (TaskStatus = {}));
var TaskInputOutputCreatorType;
(function (TaskInputOutputCreatorType) {
    TaskInputOutputCreatorType["user"] = "user";
    TaskInputOutputCreatorType["app"] = "app";
})(TaskInputOutputCreatorType || (TaskInputOutputCreatorType = {}));
var AccountLoginMethod;
(function (AccountLoginMethod) {
    AccountLoginMethod["local"] = "local";
    AccountLoginMethod["shibboleth"] = "shibboleth";
})(AccountLoginMethod || (AccountLoginMethod = {}));
var PolicyType;
(function (PolicyType) {
    PolicyType["privacy"] = "privacy";
    PolicyType["terms_and_conditions"] = "terms_and_conditions";
})(PolicyType || (PolicyType = {}));
var AccountFieldDefinitionType;
(function (AccountFieldDefinitionType) {
    AccountFieldDefinitionType["header"] = "header";
    AccountFieldDefinitionType["longtext"] = "longtext";
    AccountFieldDefinitionType["text"] = "text";
    AccountFieldDefinitionType["selection"] = "selection";
    AccountFieldDefinitionType["category_selection"] = "category_selection";
    AccountFieldDefinitionType["multiple_choice"] = "multiple_choice";
    AccountFieldDefinitionType["radio_buttons"] = "radio_buttons";
    AccountFieldDefinitionType["boolean"] = "boolean";
})(AccountFieldDefinitionType || (AccountFieldDefinitionType = {}));
var AccountFieldContext;
(function (AccountFieldContext) {
    AccountFieldContext["project"] = "project";
    AccountFieldContext["account"] = "account";
})(AccountFieldContext || (AccountFieldContext = {}));
var AccountPersonGender;
(function (AccountPersonGender) {
    AccountPersonGender["male"] = "male";
    AccountPersonGender["female"] = "female";
    AccountPersonGender["divers"] = "divers";
})(AccountPersonGender || (AccountPersonGender = {}));
var ContentType;
(function (ContentType) {
    ContentType["Text"] = "Text";
    ContentType["AnnotJSON"] = "AnnotJSON";
    ContentType["Textgrid"] = "Textgrid";
})(ContentType || (ContentType = {}));
var ToolType;
(function (ToolType) {
    ToolType["web-application"] = "web-application";
    ToolType["console-application"] = "console-application";
    ToolType["desktop-application"] = "desktop-application";
})(ToolType || (ToolType = {}));
var ToolProcessingType;
(function (ToolProcessingType) {
    ToolProcessingType["manual"] = "manual";
    ToolProcessingType["automatic"] = "automatic";
})(ToolProcessingType || (ToolProcessingType = {}));
var AccountBatchAction;
(function (AccountBatchAction) {
    AccountBatchAction["set_active"] = "set_active";
    AccountBatchAction["set_inactive"] = "set_inactive";
    AccountBatchAction["send_email_verification"] = "send_email_verification";
    AccountBatchAction["send_password_reset"] = "send_password_reset";
})(AccountBatchAction || (AccountBatchAction = {}));

class RoleBadgeSettings {
}

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class AccountBatchActionDto {
    static getAttributeTypeMap() {
        return AccountBatchActionDto.attributeTypeMap;
    }
    constructor() { }
}
AccountBatchActionDto.discriminator = undefined;
AccountBatchActionDto.attributeTypeMap = [
    {
        name: 'action',
        baseName: 'action',
        type: 'AccountBatchActionDtoActionEnum',
        format: '',
    },
    {
        name: 'accountIDs',
        baseName: 'accountIDs',
        type: 'Array<string>',
        format: '',
    },
    {
        name: 'redirectTo',
        baseName: 'redirectTo',
        type: 'string',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class AccountChangeDto {
    static getAttributeTypeMap() {
        return AccountChangeDto.attributeTypeMap;
    }
    constructor() { }
}
AccountChangeDto.discriminator = undefined;
AccountChangeDto.attributeTypeMap = [
    {
        name: 'birthday',
        baseName: 'birthday',
        type: 'string',
        format: '',
    },
    {
        name: 'username',
        baseName: 'username',
        type: 'string',
        format: '',
    },
    {
        name: 'email',
        baseName: 'email',
        type: 'string',
        format: '',
    },
    {
        name: 'gender',
        baseName: 'gender',
        type: 'AccountChangeDtoGenderEnum',
        format: '',
    },
    {
        name: 'first_name',
        baseName: 'first_name',
        type: 'string',
        format: '',
    },
    {
        name: 'last_name',
        baseName: 'last_name',
        type: 'string',
        format: '',
    },
    {
        name: 'organization',
        baseName: 'organization',
        type: 'string',
        format: '',
    },
    {
        name: 'state',
        baseName: 'state',
        type: 'string',
        format: '',
    },
    {
        name: 'country',
        baseName: 'country',
        type: 'string',
        format: '',
    },
    {
        name: 'locale',
        baseName: 'locale',
        type: 'string',
        format: '',
    },
    {
        name: 'timezone',
        baseName: 'timezone',
        type: 'string',
        format: '',
    },
    {
        name: 'address',
        baseName: 'address',
        type: 'string',
        format: '',
    },
    {
        name: 'address_details',
        baseName: 'address_details',
        type: 'string',
        format: '',
    },
    {
        name: 'phone',
        baseName: 'phone',
        type: 'string',
        format: '',
    },
    {
        name: 'town',
        baseName: 'town',
        type: 'string',
        format: '',
    },
    {
        name: 'postcode',
        baseName: 'postcode',
        type: 'string',
        format: '',
    },
    {
        name: 'role',
        baseName: 'role',
        type: 'AccountChangeDtoRoleEnum',
        format: '',
    },
    {
        name: 'comment',
        baseName: 'comment',
        type: 'string',
        format: '',
    },
    {
        name: 'active',
        baseName: 'active',
        type: 'boolean',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class AccountCreateRequestDto {
    static getAttributeTypeMap() {
        return AccountCreateRequestDto.attributeTypeMap;
    }
    constructor() { }
}
AccountCreateRequestDto.discriminator = undefined;
AccountCreateRequestDto.attributeTypeMap = [
    {
        name: 'birthday',
        baseName: 'birthday',
        type: 'string',
        format: '',
    },
    {
        name: 'username',
        baseName: 'username',
        type: 'string',
        format: '',
    },
    {
        name: 'password',
        baseName: 'password',
        type: 'string',
        format: '',
    },
    {
        name: 'email',
        baseName: 'email',
        type: 'string',
        format: '',
    },
    {
        name: 'role',
        baseName: 'role',
        type: 'AccountCreateRequestDtoRoleEnum',
        format: '',
    },
    {
        name: 'organization',
        baseName: 'organization',
        type: 'string',
        format: '',
    },
    {
        name: 'state',
        baseName: 'state',
        type: 'string',
        format: '',
    },
    {
        name: 'country',
        baseName: 'country',
        type: 'string',
        format: '',
    },
    {
        name: 'locale',
        baseName: 'locale',
        type: 'string',
        format: '',
    },
    {
        name: 'timezone',
        baseName: 'timezone',
        type: 'string',
        format: '',
    },
    {
        name: 'comment',
        baseName: 'comment',
        type: 'string',
        format: '',
    },
    {
        name: 'active',
        baseName: 'active',
        type: 'boolean',
        format: '',
    },
    {
        name: 'gender',
        baseName: 'gender',
        type: 'AccountCreateRequestDtoGenderEnum',
        format: '',
    },
    {
        name: 'first_name',
        baseName: 'first_name',
        type: 'string',
        format: '',
    },
    {
        name: 'last_name',
        baseName: 'last_name',
        type: 'string',
        format: '',
    },
    {
        name: 'address',
        baseName: 'address',
        type: 'string',
        format: '',
    },
    {
        name: 'address_details',
        baseName: 'address_details',
        type: 'string',
        format: '',
    },
    {
        name: 'phone',
        baseName: 'phone',
        type: 'string',
        format: '',
    },
    {
        name: 'town',
        baseName: 'town',
        type: 'string',
        format: '',
    },
    {
        name: 'postcode',
        baseName: 'postcode',
        type: 'string',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class AccountDto {
    static getAttributeTypeMap() {
        return AccountDto.attributeTypeMap;
    }
    constructor() { }
}
AccountDto.discriminator = undefined;
AccountDto.attributeTypeMap = [
    {
        name: 'creationdate',
        baseName: 'creationdate',
        type: 'string',
        format: '',
    },
    {
        name: 'updatedate',
        baseName: 'updatedate',
        type: 'string',
        format: '',
    },
    {
        name: 'birthday',
        baseName: 'birthday',
        type: 'string',
        format: '',
    },
    {
        name: 'username',
        baseName: 'username',
        type: 'string',
        format: '',
    },
    {
        name: 'email',
        baseName: 'email',
        type: 'string',
        format: '',
    },
    {
        name: 'email_verified',
        baseName: 'email_verified',
        type: 'boolean',
        format: '',
    },
    {
        name: 'loginmethod',
        baseName: 'loginmethod',
        type: 'AccountDtoLoginmethodEnum',
        format: '',
    },
    {
        name: 'gender',
        baseName: 'gender',
        type: 'AccountDtoGenderEnum',
        format: '',
    },
    {
        name: 'first_name',
        baseName: 'first_name',
        type: 'string',
        format: '',
    },
    {
        name: 'last_name',
        baseName: 'last_name',
        type: 'string',
        format: '',
    },
    {
        name: 'address',
        baseName: 'address',
        type: 'string',
        format: '',
    },
    {
        name: 'address_details',
        baseName: 'address_details',
        type: 'string',
        format: '',
    },
    {
        name: 'phone',
        baseName: 'phone',
        type: 'string',
        format: '',
    },
    {
        name: 'timezone',
        baseName: 'timezone',
        type: 'string',
        format: '',
    },
    {
        name: 'town',
        baseName: 'town',
        type: 'string',
        format: '',
    },
    {
        name: 'postcode',
        baseName: 'postcode',
        type: 'string',
        format: '',
    },
    {
        name: 'state',
        baseName: 'state',
        type: 'string',
        format: '',
    },
    {
        name: 'country',
        baseName: 'country',
        type: 'string',
        format: '',
    },
    {
        name: 'locale',
        baseName: 'locale',
        type: 'string',
        format: '',
    },
    {
        name: 'active',
        baseName: 'active',
        type: 'boolean',
        format: '',
    },
    {
        name: 'comment',
        baseName: 'comment',
        type: 'string',
        format: '',
    },
    {
        name: 'organization',
        baseName: 'organization',
        type: 'string',
        format: '',
    },
    {
        name: 'systemRole',
        baseName: 'systemRole',
        type: 'CurrentAccountDtoSystemRole',
        format: '',
    },
    {
        name: 'projectRoles',
        baseName: 'projectRoles',
        type: 'Array<AccountProjectRoleDto>',
        format: '',
    },
    {
        name: 'last_login',
        baseName: 'last_login',
        type: 'string',
        format: '',
    },
    {
        name: 'id',
        baseName: 'id',
        type: 'string',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class AccountFieldDefinition {
    static getAttributeTypeMap() {
        return AccountFieldDefinition.attributeTypeMap;
    }
    constructor() { }
}
AccountFieldDefinition.discriminator = undefined;
AccountFieldDefinition.attributeTypeMap = [
    {
        name: 'schema',
        baseName: 'schema',
        type: 'any',
        format: '',
    },
    {
        name: 'isRequired',
        baseName: 'isRequired',
        type: 'boolean',
        format: '',
    },
    {
        name: 'multipleResults',
        baseName: 'multipleResults',
        type: 'boolean',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class AccountFieldDefinitionCreateDto {
    static getAttributeTypeMap() {
        return AccountFieldDefinitionCreateDto.attributeTypeMap;
    }
    constructor() { }
}
AccountFieldDefinitionCreateDto.discriminator = undefined;
AccountFieldDefinitionCreateDto.attributeTypeMap = [
    {
        name: 'context',
        baseName: 'context',
        type: 'AccountFieldDefinitionCreateDtoContextEnum',
        format: '',
    },
    {
        name: 'name',
        baseName: 'name',
        type: 'string',
        format: '',
    },
    {
        name: 'type',
        baseName: 'type',
        type: 'any',
        format: '',
    },
    {
        name: 'definition',
        baseName: 'definition',
        type: 'AccountFieldDefinitionCreateDtoDefinition',
        format: '',
    },
    {
        name: 'active',
        baseName: 'active',
        type: 'boolean',
        format: '',
    },
    {
        name: 'sort_order',
        baseName: 'sort_order',
        type: 'number',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
/**
 * Schema that is used to generate the control
 */
class AccountFieldDefinitionCreateDtoDefinition {
    static getAttributeTypeMap() {
        return AccountFieldDefinitionCreateDtoDefinition.attributeTypeMap;
    }
    constructor() { }
}
AccountFieldDefinitionCreateDtoDefinition.discriminator = undefined;
AccountFieldDefinitionCreateDtoDefinition.attributeTypeMap = [
    {
        name: 'schema',
        baseName: 'schema',
        type: 'any',
        format: '',
    },
    {
        name: 'isRequired',
        baseName: 'isRequired',
        type: 'boolean',
        format: '',
    },
    {
        name: 'multipleResults',
        baseName: 'multipleResults',
        type: 'boolean',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class AccountFieldDefinitionDto {
    static getAttributeTypeMap() {
        return AccountFieldDefinitionDto.attributeTypeMap;
    }
    constructor() { }
}
AccountFieldDefinitionDto.discriminator = undefined;
AccountFieldDefinitionDto.attributeTypeMap = [
    {
        name: 'context',
        baseName: 'context',
        type: 'AccountFieldDefinitionDtoContextEnum',
        format: '',
    },
    {
        name: 'name',
        baseName: 'name',
        type: 'string',
        format: '',
    },
    {
        name: 'type',
        baseName: 'type',
        type: 'any',
        format: '',
    },
    {
        name: 'definition',
        baseName: 'definition',
        type: 'AccountFieldDefinitionCreateDtoDefinition',
        format: '',
    },
    {
        name: 'removable',
        baseName: 'removable',
        type: 'boolean',
        format: '',
    },
    {
        name: 'active',
        baseName: 'active',
        type: 'boolean',
        format: '',
    },
    {
        name: 'sort_order',
        baseName: 'sort_order',
        type: 'number',
        format: '',
    },
    {
        name: 'id',
        baseName: 'id',
        type: 'string',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class AccountFieldValueDefinitionDto {
    static getAttributeTypeMap() {
        return AccountFieldValueDefinitionDto.attributeTypeMap;
    }
    constructor() { }
}
AccountFieldValueDefinitionDto.discriminator = undefined;
AccountFieldValueDefinitionDto.attributeTypeMap = [
    {
        name: 'context',
        baseName: 'context',
        type: 'AccountFieldValueDefinitionDtoContextEnum',
        format: '',
    },
    {
        name: 'name',
        baseName: 'name',
        type: 'string',
        format: '',
    },
    {
        name: 'type',
        baseName: 'type',
        type: 'any',
        format: '',
    },
    {
        name: 'definition',
        baseName: 'definition',
        type: 'AccountFieldDefinitionCreateDtoDefinition',
        format: '',
    },
    {
        name: 'removable',
        baseName: 'removable',
        type: 'boolean',
        format: '',
    },
    {
        name: 'active',
        baseName: 'active',
        type: 'boolean',
        format: '',
    },
    {
        name: 'sort_order',
        baseName: 'sort_order',
        type: 'number',
        format: '',
    },
    {
        name: 'id',
        baseName: 'id',
        type: 'string',
        format: '',
    },
    {
        name: 'value',
        baseName: 'value',
        type: 'any',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class AccountMinimalDto {
    static getAttributeTypeMap() {
        return AccountMinimalDto.attributeTypeMap;
    }
    constructor() { }
}
AccountMinimalDto.discriminator = undefined;
AccountMinimalDto.attributeTypeMap = [
    {
        name: 'creationdate',
        baseName: 'creationdate',
        type: 'string',
        format: '',
    },
    {
        name: 'updatedate',
        baseName: 'updatedate',
        type: 'string',
        format: '',
    },
    {
        name: 'birthday',
        baseName: 'birthday',
        type: 'string',
        format: '',
    },
    {
        name: 'id',
        baseName: 'id',
        type: 'string',
        format: '',
    },
    {
        name: 'username',
        baseName: 'username',
        type: 'string',
        format: '',
    },
    {
        name: 'email',
        baseName: 'email',
        type: 'string',
        format: '',
    },
    {
        name: 'email_verified',
        baseName: 'email_verified',
        type: 'boolean',
        format: '',
    },
    {
        name: 'loginmethod',
        baseName: 'loginmethod',
        type: 'AccountMinimalDtoLoginmethodEnum',
        format: '',
    },
    {
        name: 'gender',
        baseName: 'gender',
        type: 'AccountMinimalDtoGenderEnum',
        format: '',
    },
    {
        name: 'first_name',
        baseName: 'first_name',
        type: 'string',
        format: '',
    },
    {
        name: 'last_name',
        baseName: 'last_name',
        type: 'string',
        format: '',
    },
    {
        name: 'phone',
        baseName: 'phone',
        type: 'string',
        format: '',
    },
    {
        name: 'timezone',
        baseName: 'timezone',
        type: 'string',
        format: '',
    },
    {
        name: 'town',
        baseName: 'town',
        type: 'string',
        format: '',
    },
    {
        name: 'postcode',
        baseName: 'postcode',
        type: 'string',
        format: '',
    },
    {
        name: 'state',
        baseName: 'state',
        type: 'string',
        format: '',
    },
    {
        name: 'country',
        baseName: 'country',
        type: 'string',
        format: '',
    },
    {
        name: 'locale',
        baseName: 'locale',
        type: 'string',
        format: '',
    },
    {
        name: 'active',
        baseName: 'active',
        type: 'boolean',
        format: '',
    },
    {
        name: 'comment',
        baseName: 'comment',
        type: 'string',
        format: '',
    },
    {
        name: 'organization',
        baseName: 'organization',
        type: 'string',
        format: '',
    },
    {
        name: 'systemRole',
        baseName: 'systemRole',
        type: 'CurrentAccountDtoSystemRole',
        format: '',
    },
    {
        name: 'projectRoles',
        baseName: 'projectRoles',
        type: 'Array<AccountProjectRoleDto>',
        format: '',
    },
    {
        name: 'last_login',
        baseName: 'last_login',
        type: 'string',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class AccountProjectRoleDto {
    static getAttributeTypeMap() {
        return AccountProjectRoleDto.attributeTypeMap;
    }
    constructor() { }
}
AccountProjectRoleDto.discriminator = undefined;
AccountProjectRoleDto.attributeTypeMap = [
    {
        name: 'valid_startdate',
        baseName: 'valid_startdate',
        type: 'string',
        format: '',
    },
    {
        name: 'valid_enddate',
        baseName: 'valid_enddate',
        type: 'string',
        format: '',
    },
    {
        name: 'role',
        baseName: 'role',
        type: 'string',
        format: '',
    },
    {
        name: 'scope',
        baseName: 'scope',
        type: 'AccountProjectRoleDtoScopeEnum',
        format: '',
    },
    {
        name: 'project_id',
        baseName: 'project_id',
        type: 'string',
        format: '',
    },
    {
        name: 'project_name',
        baseName: 'project_name',
        type: 'string',
        format: '',
    },
    {
        name: 'i18n',
        baseName: 'i18n',
        type: 'any',
        format: '',
    },
    {
        name: 'badge',
        baseName: 'badge',
        type: 'any',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class AccountProjectRoleDto2 {
    static getAttributeTypeMap() {
        return AccountProjectRoleDto2.attributeTypeMap;
    }
    constructor() { }
}
AccountProjectRoleDto2.discriminator = undefined;
AccountProjectRoleDto2.attributeTypeMap = [
    {
        name: 'valid_startdate',
        baseName: 'valid_startdate',
        type: 'string',
        format: '',
    },
    {
        name: 'valid_enddate',
        baseName: 'valid_enddate',
        type: 'string',
        format: '',
    },
    {
        name: 'id',
        baseName: 'id',
        type: 'string',
        format: '',
    },
    {
        name: 'label',
        baseName: 'label',
        type: 'string',
        format: '',
    },
    {
        name: 'i18n',
        baseName: 'i18n',
        type: 'any',
        format: '',
    },
    {
        name: 'badge',
        baseName: 'badge',
        type: 'any',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class AccountRegisterRequestDto {
    static getAttributeTypeMap() {
        return AccountRegisterRequestDto.attributeTypeMap;
    }
    constructor() { }
}
AccountRegisterRequestDto.discriminator = undefined;
AccountRegisterRequestDto.attributeTypeMap = [
    {
        name: 'birthday',
        baseName: 'birthday',
        type: 'string',
        format: '',
    },
    {
        name: 'username',
        baseName: 'username',
        type: 'string',
        format: '',
    },
    {
        name: 'password',
        baseName: 'password',
        type: 'string',
        format: '',
    },
    {
        name: 'email',
        baseName: 'email',
        type: 'string',
        format: '',
    },
    {
        name: 'gender',
        baseName: 'gender',
        type: 'AccountRegisterRequestDtoGenderEnum',
        format: '',
    },
    {
        name: 'first_name',
        baseName: 'first_name',
        type: 'string',
        format: '',
    },
    {
        name: 'last_name',
        baseName: 'last_name',
        type: 'string',
        format: '',
    },
    {
        name: 'organization',
        baseName: 'organization',
        type: 'string',
        format: '',
    },
    {
        name: 'state',
        baseName: 'state',
        type: 'string',
        format: '',
    },
    {
        name: 'country',
        baseName: 'country',
        type: 'string',
        format: '',
    },
    {
        name: 'locale',
        baseName: 'locale',
        type: 'string',
        format: '',
    },
    {
        name: 'timezone',
        baseName: 'timezone',
        type: 'string',
        format: '',
    },
    {
        name: 'address',
        baseName: 'address',
        type: 'string',
        format: '',
    },
    {
        name: 'address_details',
        baseName: 'address_details',
        type: 'string',
        format: '',
    },
    {
        name: 'phone',
        baseName: 'phone',
        type: 'string',
        format: '',
    },
    {
        name: 'town',
        baseName: 'town',
        type: 'string',
        format: '',
    },
    {
        name: 'postcode',
        baseName: 'postcode',
        type: 'string',
        format: '',
    },
    {
        name: 'redirectTo',
        baseName: 'redirectTo',
        type: 'string',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class AccountSearchResultDto {
    static getAttributeTypeMap() {
        return AccountSearchResultDto.attributeTypeMap;
    }
    constructor() { }
}
AccountSearchResultDto.discriminator = undefined;
AccountSearchResultDto.attributeTypeMap = [
    {
        name: 'id',
        baseName: 'id',
        type: 'string',
        format: '',
    },
    {
        name: 'first_name',
        baseName: 'first_name',
        type: 'string',
        format: '',
    },
    {
        name: 'last_name',
        baseName: 'last_name',
        type: 'string',
        format: '',
    },
    {
        name: 'email',
        baseName: 'email',
        type: 'string',
        format: '',
    },
    {
        name: 'username',
        baseName: 'username',
        type: 'string',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class AccountSettingsDto {
    static getAttributeTypeMap() {
        return AccountSettingsDto.attributeTypeMap;
    }
    constructor() { }
}
AccountSettingsDto.discriminator = undefined;
AccountSettingsDto.attributeTypeMap = [
    {
        name: 'timezone',
        baseName: 'timezone',
        type: 'string',
        format: '',
    },
    {
        name: 'locale',
        baseName: 'locale',
        type: 'string',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class AccountStatisticItemDto {
    static getAttributeTypeMap() {
        return AccountStatisticItemDto.attributeTypeMap;
    }
    constructor() { }
}
AccountStatisticItemDto.discriminator = undefined;
AccountStatisticItemDto.attributeTypeMap = [
    {
        name: 'role_name',
        baseName: 'role_name',
        type: 'any',
        format: '',
    },
    {
        name: 'count',
        baseName: 'count',
        type: 'number',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class AllAccountsGenderStatistics {
    static getAttributeTypeMap() {
        return AllAccountsGenderStatistics.attributeTypeMap;
    }
    constructor() { }
}
AllAccountsGenderStatistics.discriminator = undefined;
AllAccountsGenderStatistics.attributeTypeMap = [
    {
        name: 'male',
        baseName: 'male',
        type: 'number',
        format: '',
    },
    {
        name: 'female',
        baseName: 'female',
        type: 'number',
        format: '',
    },
    {
        name: 'divers',
        baseName: 'divers',
        type: 'number',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class AllAccountsSystemRolesStatistics {
    static getAttributeTypeMap() {
        return AllAccountsSystemRolesStatistics.attributeTypeMap;
    }
    constructor() { }
}
AllAccountsSystemRolesStatistics.discriminator = undefined;
AllAccountsSystemRolesStatistics.attributeTypeMap = [
    {
        name: 'administrator',
        baseName: 'administrator',
        type: 'number',
        format: '',
    },
    {
        name: 'user',
        baseName: 'user',
        type: 'number',
        format: '',
    },
    {
        name: 'app',
        baseName: 'app',
        type: 'number',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class AllAccountStatistics {
    static getAttributeTypeMap() {
        return AllAccountStatistics.attributeTypeMap;
    }
    constructor() { }
}
AllAccountStatistics.discriminator = undefined;
AllAccountStatistics.attributeTypeMap = [
    {
        name: 'total',
        baseName: 'total',
        type: 'number',
        format: '',
    },
    {
        name: 'activeLast30Days',
        baseName: 'activeLast30Days',
        type: 'number',
        format: '',
    },
    {
        name: 'registrationsLast30Days',
        baseName: 'registrationsLast30Days',
        type: 'number',
        format: '',
    },
    {
        name: 'activated',
        baseName: 'activated',
        type: 'number',
        format: '',
    },
    {
        name: 'deleted',
        baseName: 'deleted',
        type: 'number',
        format: '',
    },
    {
        name: 'gender',
        baseName: 'gender',
        type: 'AllAccountsGenderStatistics',
        format: '',
    },
    {
        name: 'roles',
        baseName: 'roles',
        type: 'AllAccountStatisticsRoles',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class AllAccountStatisticsRoles {
    static getAttributeTypeMap() {
        return AllAccountStatisticsRoles.attributeTypeMap;
    }
    constructor() { }
}
AllAccountStatisticsRoles.discriminator = undefined;
AllAccountStatisticsRoles.attributeTypeMap = [
    {
        name: 'system',
        baseName: 'system',
        type: 'AllAccountsSystemRolesStatistics',
        format: '',
    },
    {
        name: 'project',
        baseName: 'project',
        type: 'Array<StatisticsProjectRoleDto>',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class AllProjectsStatistics {
    static getAttributeTypeMap() {
        return AllProjectsStatistics.attributeTypeMap;
    }
    constructor() { }
}
AllProjectsStatistics.discriminator = undefined;
AllProjectsStatistics.attributeTypeMap = [
    {
        name: 'total',
        baseName: 'total',
        type: 'number',
        format: '',
    },
    {
        name: 'active',
        baseName: 'active',
        type: 'number',
        format: '',
    },
    {
        name: 'inactive',
        baseName: 'inactive',
        type: 'number',
        format: '',
    },
    {
        name: 'private',
        baseName: 'private',
        type: 'number',
        format: '',
    },
    {
        name: 'public',
        baseName: 'public',
        type: 'number',
        format: '',
    },
    {
        name: 'running',
        baseName: 'running',
        type: 'number',
        format: '',
    },
    {
        name: 'scheduled',
        baseName: 'scheduled',
        type: 'number',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class AllStatisticsDto {
    static getAttributeTypeMap() {
        return AllStatisticsDto.attributeTypeMap;
    }
    constructor() { }
}
AllStatisticsDto.discriminator = undefined;
AllStatisticsDto.attributeTypeMap = [
    {
        name: 'last_updated',
        baseName: 'last_updated',
        type: 'string',
        format: '',
    },
    {
        name: 'accounts',
        baseName: 'accounts',
        type: 'AllAccountStatistics',
        format: '',
    },
    {
        name: 'projects',
        baseName: 'projects',
        type: 'AllProjectsStatistics',
        format: '',
    },
    {
        name: 'tasks',
        baseName: 'tasks',
        type: 'AllStatisticsTasksDto',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class AllStatisticsTasksDto {
    static getAttributeTypeMap() {
        return AllStatisticsTasksDto.attributeTypeMap;
    }
    constructor() { }
}
AllStatisticsTasksDto.discriminator = undefined;
AllStatisticsTasksDto.attributeTypeMap = [
    {
        name: 'total',
        baseName: 'total',
        type: 'number',
        format: '',
    },
    {
        name: 'free',
        baseName: 'free',
        type: 'number',
        format: '',
    },
    {
        name: 'busy',
        baseName: 'busy',
        type: 'number',
        format: '',
    },
    {
        name: 'postponed',
        baseName: 'postponed',
        type: 'number',
        format: '',
    },
    {
        name: 'paused',
        baseName: 'paused',
        type: 'number',
        format: '',
    },
    {
        name: 'finished',
        baseName: 'finished',
        type: 'number',
        format: '',
    },
    {
        name: 'failed',
        baseName: 'failed',
        type: 'number',
        format: '',
    },
    {
        name: 'draft',
        baseName: 'draft',
        type: 'number',
        format: '',
    },
    {
        name: 'averageDuration',
        baseName: 'averageDuration',
        type: 'number',
        format: '',
    },
    {
        name: 'medianDuration',
        baseName: 'medianDuration',
        type: 'number',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class AppTokenChangeDto {
    static getAttributeTypeMap() {
        return AppTokenChangeDto.attributeTypeMap;
    }
    constructor() { }
}
AppTokenChangeDto.discriminator = undefined;
AppTokenChangeDto.attributeTypeMap = [
    {
        name: 'name',
        baseName: 'name',
        type: 'string',
        format: '',
    },
    {
        name: 'domain',
        baseName: 'domain',
        type: 'string',
        format: '',
    },
    {
        name: 'description',
        baseName: 'description',
        type: 'string',
        format: '',
    },
    {
        name: 'registrations',
        baseName: 'registrations',
        type: 'boolean',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class AppTokenCreateDto {
    static getAttributeTypeMap() {
        return AppTokenCreateDto.attributeTypeMap;
    }
    constructor() { }
}
AppTokenCreateDto.discriminator = undefined;
AppTokenCreateDto.attributeTypeMap = [
    {
        name: 'name',
        baseName: 'name',
        type: 'string',
        format: '',
    },
    {
        name: 'domain',
        baseName: 'domain',
        type: 'string',
        format: '',
    },
    {
        name: 'description',
        baseName: 'description',
        type: 'string',
        format: '',
    },
    {
        name: 'registrations',
        baseName: 'registrations',
        type: 'boolean',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class AppTokenDto {
    static getAttributeTypeMap() {
        return AppTokenDto.attributeTypeMap;
    }
    constructor() { }
}
AppTokenDto.discriminator = undefined;
AppTokenDto.attributeTypeMap = [
    {
        name: 'creationdate',
        baseName: 'creationdate',
        type: 'string',
        format: '',
    },
    {
        name: 'updatedate',
        baseName: 'updatedate',
        type: 'string',
        format: '',
    },
    {
        name: 'name',
        baseName: 'name',
        type: 'string',
        format: '',
    },
    {
        name: 'key',
        baseName: 'key',
        type: 'string',
        format: '',
    },
    {
        name: 'domain',
        baseName: 'domain',
        type: 'string',
        format: '',
    },
    {
        name: 'description',
        baseName: 'description',
        type: 'string',
        format: '',
    },
    {
        name: 'registrations',
        baseName: 'registrations',
        type: 'boolean',
        format: '',
    },
    {
        name: 'readonly',
        baseName: 'readonly',
        type: 'boolean',
        format: '',
    },
    {
        name: 'id',
        baseName: 'id',
        type: 'string',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class AuthDto {
    static getAttributeTypeMap() {
        return AuthDto.attributeTypeMap;
    }
    constructor() { }
}
AuthDto.discriminator = undefined;
AuthDto.attributeTypeMap = [
    {
        name: 'openURL',
        baseName: 'openURL',
        type: 'string',
        format: '',
    },
    {
        name: 'accessToken',
        baseName: 'accessToken',
        type: 'string',
        format: '',
    },
    {
        name: 'agreementToken',
        baseName: 'agreementToken',
        type: 'string',
        format: '',
    },
    {
        name: 'me',
        baseName: 'me',
        type: 'AuthDtoMe',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
/**
 * this property only exists if the authentication was successful.
 */
class AuthDtoMe {
    static getAttributeTypeMap() {
        return AuthDtoMe.attributeTypeMap;
    }
    constructor() { }
}
AuthDtoMe.discriminator = undefined;
AuthDtoMe.attributeTypeMap = [
    {
        name: 'id',
        baseName: 'id',
        type: 'string',
        format: '',
    },
    {
        name: 'email',
        baseName: 'email',
        type: 'string',
        format: '',
    },
    {
        name: 'email_verified',
        baseName: 'email_verified',
        type: 'boolean',
        format: '',
    },
    {
        name: 'first_name',
        baseName: 'first_name',
        type: 'string',
        format: '',
    },
    {
        name: 'last_name',
        baseName: 'last_name',
        type: 'string',
        format: '',
    },
    {
        name: 'username',
        baseName: 'username',
        type: 'string',
        format: '',
    },
    {
        name: 'locale',
        baseName: 'locale',
        type: 'string',
        format: '',
    },
    {
        name: 'timezone',
        baseName: 'timezone',
        type: 'string',
        format: '',
    },
    {
        name: 'systemRole',
        baseName: 'systemRole',
        type: 'CurrentAccountDtoSystemRole',
        format: '',
    },
    {
        name: 'projectRoles',
        baseName: 'projectRoles',
        type: 'Array<AccountProjectRoleDto>',
        format: '',
    },
    {
        name: 'last_login',
        baseName: 'last_login',
        type: 'string',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class ChangeAccountInformationDto {
    static getAttributeTypeMap() {
        return ChangeAccountInformationDto.attributeTypeMap;
    }
    constructor() { }
}
ChangeAccountInformationDto.discriminator = undefined;
ChangeAccountInformationDto.attributeTypeMap = [
    {
        name: 'birthday',
        baseName: 'birthday',
        type: 'string',
        format: '',
    },
    {
        name: 'first_name',
        baseName: 'first_name',
        type: 'string',
        format: '',
    },
    {
        name: 'last_name',
        baseName: 'last_name',
        type: 'string',
        format: '',
    },
    {
        name: 'gender',
        baseName: 'gender',
        type: 'ChangeAccountInformationDtoGenderEnum',
        format: '',
    },
    {
        name: 'state',
        baseName: 'state',
        type: 'string',
        format: '',
    },
    {
        name: 'country',
        baseName: 'country',
        type: 'string',
        format: '',
    },
    {
        name: 'organization',
        baseName: 'organization',
        type: 'string',
        format: '',
    },
    {
        name: 'address',
        baseName: 'address',
        type: 'string',
        format: '',
    },
    {
        name: 'address_details',
        baseName: 'address_details',
        type: 'string',
        format: '',
    },
    {
        name: 'phone',
        baseName: 'phone',
        type: 'string',
        format: '',
    },
    {
        name: 'town',
        baseName: 'town',
        type: 'string',
        format: '',
    },
    {
        name: 'postcode',
        baseName: 'postcode',
        type: 'string',
        format: '',
    },
    {
        name: 'email',
        baseName: 'email',
        type: 'string',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class ChangeMyPassword400Response {
    static getAttributeTypeMap() {
        return ChangeMyPassword400Response.attributeTypeMap;
    }
    constructor() { }
}
ChangeMyPassword400Response.discriminator = undefined;
ChangeMyPassword400Response.attributeTypeMap = [
    {
        name: 'message',
        baseName: 'message',
        type: 'string',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class ChangePasswordDto {
    static getAttributeTypeMap() {
        return ChangePasswordDto.attributeTypeMap;
    }
    constructor() { }
}
ChangePasswordDto.discriminator = undefined;
ChangePasswordDto.attributeTypeMap = [
    {
        name: 'oldPassword',
        baseName: 'oldPassword',
        type: 'string',
        format: '',
    },
    {
        name: 'newPassword',
        baseName: 'newPassword',
        type: 'string',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class ChangeTaskData404Response {
    static getAttributeTypeMap() {
        return ChangeTaskData404Response.attributeTypeMap;
    }
    constructor() { }
}
ChangeTaskData404Response.discriminator = undefined;
ChangeTaskData404Response.attributeTypeMap = [
    {
        name: 'message',
        baseName: 'message',
        type: 'string',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class CurrentAccountDto {
    static getAttributeTypeMap() {
        return CurrentAccountDto.attributeTypeMap;
    }
    constructor() { }
}
CurrentAccountDto.discriminator = undefined;
CurrentAccountDto.attributeTypeMap = [
    {
        name: 'id',
        baseName: 'id',
        type: 'string',
        format: '',
    },
    {
        name: 'email',
        baseName: 'email',
        type: 'string',
        format: '',
    },
    {
        name: 'email_verified',
        baseName: 'email_verified',
        type: 'boolean',
        format: '',
    },
    {
        name: 'first_name',
        baseName: 'first_name',
        type: 'string',
        format: '',
    },
    {
        name: 'last_name',
        baseName: 'last_name',
        type: 'string',
        format: '',
    },
    {
        name: 'username',
        baseName: 'username',
        type: 'string',
        format: '',
    },
    {
        name: 'locale',
        baseName: 'locale',
        type: 'string',
        format: '',
    },
    {
        name: 'timezone',
        baseName: 'timezone',
        type: 'string',
        format: '',
    },
    {
        name: 'systemRole',
        baseName: 'systemRole',
        type: 'CurrentAccountDtoSystemRole',
        format: '',
    },
    {
        name: 'projectRoles',
        baseName: 'projectRoles',
        type: 'Array<AccountProjectRoleDto>',
        format: '',
    },
    {
        name: 'last_login',
        baseName: 'last_login',
        type: 'string',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
/**
 * the system user role.
 */
class CurrentAccountDtoSystemRole {
    static getAttributeTypeMap() {
        return CurrentAccountDtoSystemRole.attributeTypeMap;
    }
    constructor() { }
}
CurrentAccountDtoSystemRole.discriminator = undefined;
CurrentAccountDtoSystemRole.attributeTypeMap = [
    {
        name: 'label',
        baseName: 'label',
        type: 'string',
        format: '',
    },
    {
        name: 'i18n',
        baseName: 'i18n',
        type: 'any',
        format: '',
    },
    {
        name: 'badge',
        baseName: 'badge',
        type: 'any',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class FileProjectDto {
    static getAttributeTypeMap() {
        return FileProjectDto.attributeTypeMap;
    }
    constructor() { }
}
FileProjectDto.discriminator = undefined;
FileProjectDto.attributeTypeMap = [
    {
        name: 'creationdate',
        baseName: 'creationdate',
        type: 'string',
        format: '',
    },
    {
        name: 'updatedate',
        baseName: 'updatedate',
        type: 'string',
        format: '',
    },
    {
        name: 'uploader_id',
        baseName: 'uploader_id',
        type: 'string',
        format: '',
    },
    {
        name: 'real_name',
        baseName: 'real_name',
        type: 'string',
        format: '',
    },
    {
        name: 'type',
        baseName: 'type',
        type: 'string',
        format: '',
    },
    {
        name: 'size',
        baseName: 'size',
        type: 'number',
        format: '',
    },
    {
        name: 'url',
        baseName: 'url',
        type: 'string',
        format: '',
    },
    {
        name: 'content_type',
        baseName: 'content_type',
        type: 'string',
        format: '',
    },
    {
        name: 'content',
        baseName: 'content',
        type: 'any',
        format: '',
    },
    {
        name: 'hash',
        baseName: 'hash',
        type: 'string',
        format: '',
    },
    {
        name: 'metadata',
        baseName: 'metadata',
        type: 'any',
        format: '',
    },
    {
        name: 'id',
        baseName: 'id',
        type: 'string',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class GeneralSettingsDto {
    static getAttributeTypeMap() {
        return GeneralSettingsDto.attributeTypeMap;
    }
    constructor() { }
}
GeneralSettingsDto.discriminator = undefined;
GeneralSettingsDto.attributeTypeMap = [
    {
        name: 'mail_support_address',
        baseName: 'mail_support_address',
        type: 'string',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class GetAccountInformation404Response {
    static getAttributeTypeMap() {
        return GetAccountInformation404Response.attributeTypeMap;
    }
    constructor() { }
}
GetAccountInformation404Response.discriminator = undefined;
GetAccountInformation404Response.attributeTypeMap = [
    {
        name: 'message',
        baseName: 'message',
        type: 'string',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class GetProject404Response {
    static getAttributeTypeMap() {
        return GetProject404Response.attributeTypeMap;
    }
    constructor() { }
}
GetProject404Response.discriminator = undefined;
GetProject404Response.attributeTypeMap = [
    {
        name: 'message',
        baseName: 'message',
        type: 'string',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class ListRoles401Response {
    static getAttributeTypeMap() {
        return ListRoles401Response.attributeTypeMap;
    }
    constructor() { }
}
ListRoles401Response.discriminator = undefined;
ListRoles401Response.attributeTypeMap = [
    {
        name: 'message',
        baseName: 'message',
        type: 'string',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class ListRoles403Response {
    static getAttributeTypeMap() {
        return ListRoles403Response.attributeTypeMap;
    }
    constructor() { }
}
ListRoles403Response.discriminator = undefined;
ListRoles403Response.attributeTypeMap = [
    {
        name: 'message',
        baseName: 'message',
        type: 'string',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class Login401Response {
    static getAttributeTypeMap() {
        return Login401Response.attributeTypeMap;
    }
    constructor() { }
}
Login401Response.discriminator = undefined;
Login401Response.attributeTypeMap = [
    {
        name: 'message',
        baseName: 'message',
        type: 'string',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class LoginRequest {
    static getAttributeTypeMap() {
        return LoginRequest.attributeTypeMap;
    }
    constructor() { }
}
LoginRequest.discriminator = undefined;
LoginRequest.attributeTypeMap = [
    {
        name: 'type',
        baseName: 'type',
        type: 'LoginRequestTypeEnum',
        format: '',
    },
    {
        name: 'usernameOrEmail',
        baseName: 'usernameOrEmail',
        type: 'string',
        format: '',
    },
    {
        name: 'password',
        baseName: 'password',
        type: 'string',
        format: '',
    },
    {
        name: 'useCookies',
        baseName: 'useCookies',
        type: 'boolean',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class LoginRequestOneOf {
    static getAttributeTypeMap() {
        return LoginRequestOneOf.attributeTypeMap;
    }
    constructor() { }
}
LoginRequestOneOf.discriminator = undefined;
LoginRequestOneOf.attributeTypeMap = [
    {
        name: 'type',
        baseName: 'type',
        type: 'LoginRequestOneOfTypeEnum',
        format: '',
    },
    {
        name: 'usernameOrEmail',
        baseName: 'usernameOrEmail',
        type: 'string',
        format: '',
    },
    {
        name: 'password',
        baseName: 'password',
        type: 'string',
        format: '',
    },
    {
        name: 'useCookies',
        baseName: 'useCookies',
        type: 'boolean',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class LoginRequestOneOf1 {
    static getAttributeTypeMap() {
        return LoginRequestOneOf1.attributeTypeMap;
    }
    constructor() { }
}
LoginRequestOneOf1.discriminator = undefined;
LoginRequestOneOf1.attributeTypeMap = [
    {
        name: 'type',
        baseName: 'type',
        type: 'LoginRequestOneOf1TypeEnum',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class PolicyChangeRequestDto {
    static getAttributeTypeMap() {
        return PolicyChangeRequestDto.attributeTypeMap;
    }
    constructor() { }
}
PolicyChangeRequestDto.discriminator = undefined;
PolicyChangeRequestDto.attributeTypeMap = [
    {
        name: 'publishdate',
        baseName: 'publishdate',
        type: 'string',
        format: '',
    },
    {
        name: 'type',
        baseName: 'type',
        type: 'PolicyChangeRequestDtoTypeEnum',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class PolicyCreateRequestDto {
    static getAttributeTypeMap() {
        return PolicyCreateRequestDto.attributeTypeMap;
    }
    constructor() { }
}
PolicyCreateRequestDto.discriminator = undefined;
PolicyCreateRequestDto.attributeTypeMap = [
    {
        name: 'type',
        baseName: 'type',
        type: 'PolicyCreateRequestDtoTypeEnum',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class PolicyCreateTranslationDto {
    static getAttributeTypeMap() {
        return PolicyCreateTranslationDto.attributeTypeMap;
    }
    constructor() { }
}
PolicyCreateTranslationDto.discriminator = undefined;
PolicyCreateTranslationDto.attributeTypeMap = [
    {
        name: 'locale',
        baseName: 'locale',
        type: 'string',
        format: '',
    },
    {
        name: 'files',
        baseName: 'files',
        type: 'Array<any>',
        format: '',
    },
    {
        name: 'url',
        baseName: 'url',
        type: 'string',
        format: '',
    },
    {
        name: 'text',
        baseName: 'text',
        type: 'string',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class PolicyDto {
    static getAttributeTypeMap() {
        return PolicyDto.attributeTypeMap;
    }
    constructor() { }
}
PolicyDto.discriminator = undefined;
PolicyDto.attributeTypeMap = [
    {
        name: 'publishdate',
        baseName: 'publishdate',
        type: 'string',
        format: '',
    },
    {
        name: 'creationdate',
        baseName: 'creationdate',
        type: 'string',
        format: '',
    },
    {
        name: 'id',
        baseName: 'id',
        type: 'number',
        format: '',
    },
    {
        name: 'type',
        baseName: 'type',
        type: 'PolicyDtoTypeEnum',
        format: '',
    },
    {
        name: 'version',
        baseName: 'version',
        type: 'number',
        format: '',
    },
    {
        name: 'translations',
        baseName: 'translations',
        type: 'Array<PolicyTranslationDto>',
        format: '',
    },
    {
        name: 'numberOfConsents',
        baseName: 'numberOfConsents',
        type: 'number',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class PolicyMinimalDto {
    static getAttributeTypeMap() {
        return PolicyMinimalDto.attributeTypeMap;
    }
    constructor() { }
}
PolicyMinimalDto.discriminator = undefined;
PolicyMinimalDto.attributeTypeMap = [
    {
        name: 'publishdate',
        baseName: 'publishdate',
        type: 'string',
        format: '',
    },
    {
        name: 'creationdate',
        baseName: 'creationdate',
        type: 'string',
        format: '',
    },
    {
        name: 'translations',
        baseName: 'translations',
        type: 'Array<string>',
        format: '',
    },
    {
        name: 'id',
        baseName: 'id',
        type: 'number',
        format: '',
    },
    {
        name: 'type',
        baseName: 'type',
        type: 'PolicyMinimalDtoTypeEnum',
        format: '',
    },
    {
        name: 'version',
        baseName: 'version',
        type: 'number',
        format: '',
    },
    {
        name: 'numberOfConsents',
        baseName: 'numberOfConsents',
        type: 'number',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class PolicyPublishRequestDto {
    static getAttributeTypeMap() {
        return PolicyPublishRequestDto.attributeTypeMap;
    }
    constructor() { }
}
PolicyPublishRequestDto.discriminator = undefined;
PolicyPublishRequestDto.attributeTypeMap = [
    {
        name: 'items',
        baseName: 'items',
        type: 'Array<PolicyPublishRequestItemDto>',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class PolicyPublishRequestItemDto {
    static getAttributeTypeMap() {
        return PolicyPublishRequestItemDto.attributeTypeMap;
    }
    constructor() { }
}
PolicyPublishRequestItemDto.discriminator = undefined;
PolicyPublishRequestItemDto.attributeTypeMap = [
    {
        name: 'publishdate',
        baseName: 'publishdate',
        type: 'string',
        format: '',
    },
    {
        name: 'id',
        baseName: 'id',
        type: 'number',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class PolicyTranslationDto {
    static getAttributeTypeMap() {
        return PolicyTranslationDto.attributeTypeMap;
    }
    constructor() { }
}
PolicyTranslationDto.discriminator = undefined;
PolicyTranslationDto.attributeTypeMap = [
    {
        name: 'updatedate',
        baseName: 'updatedate',
        type: 'string',
        format: '',
    },
    {
        name: 'creationdate',
        baseName: 'creationdate',
        type: 'string',
        format: '',
    },
    {
        name: 'id',
        baseName: 'id',
        type: 'number',
        format: '',
    },
    {
        name: 'locale',
        baseName: 'locale',
        type: 'string',
        format: '',
    },
    {
        name: 'url',
        baseName: 'url',
        type: 'string',
        format: '',
    },
    {
        name: 'text',
        baseName: 'text',
        type: 'string',
        format: '',
    },
    {
        name: 'author',
        baseName: 'author',
        type: 'string',
        format: '',
    },
    {
        name: 'numberOfConsents',
        baseName: 'numberOfConsents',
        type: 'number',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class PolicyTranslationViewDto {
    static getAttributeTypeMap() {
        return PolicyTranslationViewDto.attributeTypeMap;
    }
    constructor() { }
}
PolicyTranslationViewDto.discriminator = undefined;
PolicyTranslationViewDto.attributeTypeMap = [
    {
        name: 'url',
        baseName: 'url',
        type: 'string',
        format: '',
    },
    {
        name: 'text',
        baseName: 'text',
        type: 'string',
        format: '',
    },
    {
        name: 'type',
        baseName: 'type',
        type: 'PolicyTranslationViewDtoTypeEnum',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class ProjectAccountDto {
    static getAttributeTypeMap() {
        return ProjectAccountDto.attributeTypeMap;
    }
    constructor() { }
}
ProjectAccountDto.discriminator = undefined;
ProjectAccountDto.attributeTypeMap = [
    {
        name: 'comment',
        baseName: 'comment',
        type: 'string',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class ProjectAssignRoleDto {
    static getAttributeTypeMap() {
        return ProjectAssignRoleDto.attributeTypeMap;
    }
    constructor() { }
}
ProjectAssignRoleDto.discriminator = undefined;
ProjectAssignRoleDto.attributeTypeMap = [
    {
        name: 'valid_startdate',
        baseName: 'valid_startdate',
        type: 'string',
        format: '',
    },
    {
        name: 'valid_enddate',
        baseName: 'valid_enddate',
        type: 'string',
        format: '',
    },
    {
        name: 'account_id',
        baseName: 'account_id',
        type: 'string',
        format: '',
    },
    {
        name: 'roles',
        baseName: 'roles',
        type: 'Array<string>',
        format: '',
    },
    {
        name: 'overwrite',
        baseName: 'overwrite',
        type: 'Array<string>',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class ProjectDto {
    static getAttributeTypeMap() {
        return ProjectDto.attributeTypeMap;
    }
    constructor() { }
}
ProjectDto.discriminator = undefined;
ProjectDto.attributeTypeMap = [
    {
        name: 'creationdate',
        baseName: 'creationdate',
        type: 'string',
        format: '',
    },
    {
        name: 'updatedate',
        baseName: 'updatedate',
        type: 'string',
        format: '',
    },
    {
        name: 'startdate',
        baseName: 'startdate',
        type: 'string',
        format: '',
    },
    {
        name: 'enddate',
        baseName: 'enddate',
        type: 'string',
        format: '',
    },
    {
        name: 'id',
        baseName: 'id',
        type: 'string',
        format: '',
    },
    {
        name: 'name',
        baseName: 'name',
        type: 'string',
        format: '',
    },
    {
        name: 'active',
        baseName: 'active',
        type: 'boolean',
        format: '',
    },
    {
        name: 'visibility',
        baseName: 'visibility',
        type: 'ProjectDtoVisibilityEnum',
        format: '',
    },
    {
        name: 'shortname',
        baseName: 'shortname',
        type: 'string',
        format: '',
    },
    {
        name: 'description',
        baseName: 'description',
        type: 'string',
        format: '',
    },
    {
        name: 'roles',
        baseName: 'roles',
        type: 'Array<ProjectRoleDto>',
        format: '',
    },
    {
        name: 'statistics',
        baseName: 'statistics',
        type: 'ProjectDtoStatistics',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class ProjectDtoStatistics {
    static getAttributeTypeMap() {
        return ProjectDtoStatistics.attributeTypeMap;
    }
    constructor() { }
}
ProjectDtoStatistics.discriminator = undefined;
ProjectDtoStatistics.attributeTypeMap = [
    {
        name: 'status',
        baseName: 'status',
        type: 'ProjectDtoStatusStatistics',
        format: '',
    },
    {
        name: 'tasks',
        baseName: 'tasks',
        type: 'Array<ProjectDtoTasksStatistics>',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class ProjectDtoStatusStatistics {
    static getAttributeTypeMap() {
        return ProjectDtoStatusStatistics.attributeTypeMap;
    }
    constructor() { }
}
ProjectDtoStatusStatistics.discriminator = undefined;
ProjectDtoStatusStatistics.attributeTypeMap = [
    {
        name: 'free',
        baseName: 'free',
        type: 'number',
        format: '',
    },
    {
        name: 'paused',
        baseName: 'paused',
        type: 'number',
        format: '',
    },
    {
        name: 'busy',
        baseName: 'busy',
        type: 'number',
        format: '',
    },
    {
        name: 'finished',
        baseName: 'finished',
        type: 'number',
        format: '',
    },
    {
        name: 'postponed',
        baseName: 'postponed',
        type: 'number',
        format: '',
    },
    {
        name: 'failed',
        baseName: 'failed',
        type: 'number',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class ProjectDtoTasksStatistics {
    static getAttributeTypeMap() {
        return ProjectDtoTasksStatistics.attributeTypeMap;
    }
    constructor() { }
}
ProjectDtoTasksStatistics.discriminator = undefined;
ProjectDtoTasksStatistics.attributeTypeMap = [
    {
        name: 'type',
        baseName: 'type',
        type: 'string',
        format: '',
    },
    {
        name: 'status',
        baseName: 'status',
        type: 'ProjectDtoStatusStatistics',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class ProjectFieldDefinitionDto {
    static getAttributeTypeMap() {
        return ProjectFieldDefinitionDto.attributeTypeMap;
    }
    constructor() { }
}
ProjectFieldDefinitionDto.discriminator = undefined;
ProjectFieldDefinitionDto.attributeTypeMap = [
    {
        name: 'id',
        baseName: 'id',
        type: 'string',
        format: '',
    },
    {
        name: 'context',
        baseName: 'context',
        type: 'ProjectFieldDefinitionDtoContextEnum',
        format: '',
    },
    {
        name: 'name',
        baseName: 'name',
        type: 'string',
        format: '',
    },
    {
        name: 'type',
        baseName: 'type',
        type: 'any',
        format: '',
    },
    {
        name: 'definition',
        baseName: 'definition',
        type: 'AccountFieldDefinitionCreateDtoDefinition',
        format: '',
    },
    {
        name: 'active',
        baseName: 'active',
        type: 'boolean',
        format: '',
    },
    {
        name: 'sort_order',
        baseName: 'sort_order',
        type: 'number',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class ProjectFileUploadDto {
    static getAttributeTypeMap() {
        return ProjectFileUploadDto.attributeTypeMap;
    }
    constructor() { }
}
ProjectFileUploadDto.discriminator = undefined;
ProjectFileUploadDto.attributeTypeMap = [
    {
        name: 'files',
        baseName: 'files',
        type: 'Array<any>',
        format: '',
    },
    {
        name: 'target_path',
        baseName: 'target_path',
        type: 'string',
        format: '',
    },
    {
        name: 'force_overwrite',
        baseName: 'force_overwrite',
        type: 'boolean',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class ProjectRemoveRequestDto {
    static getAttributeTypeMap() {
        return ProjectRemoveRequestDto.attributeTypeMap;
    }
    constructor() { }
}
ProjectRemoveRequestDto.discriminator = undefined;
ProjectRemoveRequestDto.attributeTypeMap = [
    {
        name: 'removeProjectFiles',
        baseName: 'removeProjectFiles',
        type: 'boolean',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class ProjectRequestDto {
    static getAttributeTypeMap() {
        return ProjectRequestDto.attributeTypeMap;
    }
    constructor() { }
}
ProjectRequestDto.discriminator = undefined;
ProjectRequestDto.attributeTypeMap = [
    {
        name: 'startdate',
        baseName: 'startdate',
        type: 'string',
        format: '',
    },
    {
        name: 'enddate',
        baseName: 'enddate',
        type: 'string',
        format: '',
    },
    {
        name: 'name',
        baseName: 'name',
        type: 'string',
        format: '',
    },
    {
        name: 'shortname',
        baseName: 'shortname',
        type: 'string',
        format: '',
    },
    {
        name: 'visibility',
        baseName: 'visibility',
        type: 'ProjectRequestDtoVisibilityEnum',
        format: '',
    },
    {
        name: 'description',
        baseName: 'description',
        type: 'string',
        format: '',
    },
    {
        name: 'active',
        baseName: 'active',
        type: 'boolean',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class ProjectRoleDto {
    static getAttributeTypeMap() {
        return ProjectRoleDto.attributeTypeMap;
    }
    constructor() { }
}
ProjectRoleDto.discriminator = undefined;
ProjectRoleDto.attributeTypeMap = [
    {
        name: 'account_id',
        baseName: 'account_id',
        type: 'string',
        format: '',
    },
    {
        name: 'roles',
        baseName: 'roles',
        type: 'Array<AccountProjectRoleDto2>',
        format: '',
    },
    {
        name: 'first_name',
        baseName: 'first_name',
        type: 'string',
        format: '',
    },
    {
        name: 'last_name',
        baseName: 'last_name',
        type: 'string',
        format: '',
    },
    {
        name: 'username',
        baseName: 'username',
        type: 'string',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class ProjectRoleResultDto {
    static getAttributeTypeMap() {
        return ProjectRoleResultDto.attributeTypeMap;
    }
    constructor() { }
}
ProjectRoleResultDto.discriminator = undefined;
ProjectRoleResultDto.attributeTypeMap = [
    {
        name: 'valid_startdate',
        baseName: 'valid_startdate',
        type: 'string',
        format: '',
    },
    {
        name: 'valid_enddate',
        baseName: 'valid_enddate',
        type: 'string',
        format: '',
    },
    {
        name: 'account_id',
        baseName: 'account_id',
        type: 'string',
        format: '',
    },
    {
        name: 'roles',
        baseName: 'roles',
        type: 'Array<string>',
        format: '',
    },
    {
        name: 'overwrite',
        baseName: 'overwrite',
        type: 'Array<string>',
        format: '',
    },
    {
        name: 'id',
        baseName: 'id',
        type: 'string',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class ProjectStatisticsDto {
    static getAttributeTypeMap() {
        return ProjectStatisticsDto.attributeTypeMap;
    }
    constructor() { }
}
ProjectStatisticsDto.discriminator = undefined;
ProjectStatisticsDto.attributeTypeMap = [
    {
        name: 'tasks',
        baseName: 'tasks',
        type: 'ProjectStatisticsDtoTasks',
        format: '',
    },
    {
        name: 'accounts',
        baseName: 'accounts',
        type: 'Array<AccountStatisticItemDto>',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class ProjectStatisticsDtoTasks {
    static getAttributeTypeMap() {
        return ProjectStatisticsDtoTasks.attributeTypeMap;
    }
    constructor() { }
}
ProjectStatisticsDtoTasks.discriminator = undefined;
ProjectStatisticsDtoTasks.attributeTypeMap = [
    {
        name: 'drafts',
        baseName: 'drafts',
        type: 'number',
        format: '',
    },
    {
        name: 'free',
        baseName: 'free',
        type: 'number',
        format: '',
    },
    {
        name: 'paused',
        baseName: 'paused',
        type: 'number',
        format: '',
    },
    {
        name: 'busy',
        baseName: 'busy',
        type: 'number',
        format: '',
    },
    {
        name: 'finished',
        baseName: 'finished',
        type: 'number',
        format: '',
    },
    {
        name: 'failed',
        baseName: 'failed',
        type: 'number',
        format: '',
    },
    {
        name: 'postponed',
        baseName: 'postponed',
        type: 'number',
        format: '',
    },
    {
        name: 'all',
        baseName: 'all',
        type: 'number',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class ProjectTempFileEntryDto {
    static getAttributeTypeMap() {
        return ProjectTempFileEntryDto.attributeTypeMap;
    }
    constructor() { }
}
ProjectTempFileEntryDto.discriminator = undefined;
ProjectTempFileEntryDto.attributeTypeMap = [
    {
        name: 'name',
        baseName: 'name',
        type: 'string',
        format: '',
    },
    {
        name: 'mimeType',
        baseName: 'mimeType',
        type: 'string',
        format: '',
    },
    {
        name: 'size',
        baseName: 'size',
        type: 'number',
        format: '',
    },
    {
        name: 'creationdate',
        baseName: 'creationdate',
        type: 'string',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
/**
 * properties applied to the task
 */
class Properties {
    static getAttributeTypeMap() {
        return Properties.attributeTypeMap;
    }
    constructor() { }
}
Properties.discriminator = undefined;
Properties.attributeTypeMap = [
    {
        name: 'startdate',
        baseName: 'startdate',
        type: 'string',
        format: '',
    },
    {
        name: 'enddate',
        baseName: 'enddate',
        type: 'string',
        format: '',
    },
    {
        name: 'pid',
        baseName: 'pid',
        type: 'string',
        format: '',
    },
    {
        name: 'orgtext',
        baseName: 'orgtext',
        type: 'string',
        format: '',
    },
    {
        name: 'assessment',
        baseName: 'assessment',
        type: 'string',
        format: '',
    },
    {
        name: 'priority',
        baseName: 'priority',
        type: 'number',
        format: '',
    },
    {
        name: 'code',
        baseName: 'code',
        type: 'string',
        format: '',
    },
    {
        name: 'comment',
        baseName: 'comment',
        type: 'string',
        format: '',
    },
    {
        name: 'tool_configuration_id',
        baseName: 'tool_configuration_id',
        type: 'string',
        format: '',
    },
    {
        name: 'admin_comment',
        baseName: 'admin_comment',
        type: 'string',
        format: '',
    },
    {
        name: 'worker_id',
        baseName: 'worker_id',
        type: 'string',
        format: '',
    },
    {
        name: 'nexttask_id',
        baseName: 'nexttask_id',
        type: 'string',
        format: '',
    },
    {
        name: 'use_outputs_from_task_id',
        baseName: 'use_outputs_from_task_id',
        type: 'string',
        format: '',
    },
    {
        name: 'previoustask_id',
        baseName: 'previoustask_id',
        type: 'string',
        format: '',
    },
    {
        name: 'files_destination',
        baseName: 'files_destination',
        type: 'string',
        format: '',
    },
    {
        name: 'log',
        baseName: 'log',
        type: 'Array<any>',
        format: '',
    },
    {
        name: 'status',
        baseName: 'status',
        type: 'PropertiesStatusEnum',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class ResetPasswordRequestDto {
    static getAttributeTypeMap() {
        return ResetPasswordRequestDto.attributeTypeMap;
    }
    constructor() { }
}
ResetPasswordRequestDto.discriminator = undefined;
ResetPasswordRequestDto.attributeTypeMap = [
    {
        name: 'email',
        baseName: 'email',
        type: 'string',
        format: '',
    },
    {
        name: 'redirectTo',
        baseName: 'redirectTo',
        type: 'string',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class RoleCreateDto {
    static getAttributeTypeMap() {
        return RoleCreateDto.attributeTypeMap;
    }
    constructor() { }
}
RoleCreateDto.discriminator = undefined;
RoleCreateDto.attributeTypeMap = [
    {
        name: 'label',
        baseName: 'label',
        type: 'string',
        format: '',
    },
    {
        name: 'description',
        baseName: 'description',
        type: 'string',
        format: '',
    },
    {
        name: 'i18n',
        baseName: 'i18n',
        type: 'any',
        format: '',
    },
    {
        name: 'badge',
        baseName: 'badge',
        type: 'any',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class RoleDto {
    static getAttributeTypeMap() {
        return RoleDto.attributeTypeMap;
    }
    constructor() { }
}
RoleDto.discriminator = undefined;
RoleDto.attributeTypeMap = [
    {
        name: 'creationdate',
        baseName: 'creationdate',
        type: 'string',
        format: '',
    },
    {
        name: 'updatedate',
        baseName: 'updatedate',
        type: 'string',
        format: '',
    },
    {
        name: 'label',
        baseName: 'label',
        type: 'string',
        format: '',
    },
    {
        name: 'description',
        baseName: 'description',
        type: 'string',
        format: '',
    },
    {
        name: 'scope',
        baseName: 'scope',
        type: 'RoleDtoScopeEnum',
        format: '',
    },
    {
        name: 'readonly',
        baseName: 'readonly',
        type: 'boolean',
        format: '',
    },
    {
        name: 'i18n',
        baseName: 'i18n',
        type: 'any',
        format: '',
    },
    {
        name: 'badge',
        baseName: 'badge',
        type: 'any',
        format: '',
    },
    {
        name: 'id',
        baseName: 'id',
        type: 'string',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class RunBatchAction400Response {
    static getAttributeTypeMap() {
        return RunBatchAction400Response.attributeTypeMap;
    }
    constructor() { }
}
RunBatchAction400Response.discriminator = undefined;
RunBatchAction400Response.attributeTypeMap = [
    {
        name: 'message',
        baseName: 'message',
        type: 'string',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class StatisticsProjectRoleDto {
    static getAttributeTypeMap() {
        return StatisticsProjectRoleDto.attributeTypeMap;
    }
    constructor() { }
}
StatisticsProjectRoleDto.discriminator = undefined;
StatisticsProjectRoleDto.attributeTypeMap = [
    {
        name: 'label',
        baseName: 'label',
        type: 'string',
        format: '',
    },
    {
        name: 'i18n',
        baseName: 'i18n',
        type: 'any',
        format: '',
    },
    {
        name: 'value',
        baseName: 'value',
        type: 'number',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class SupportedTaskDto {
    static getAttributeTypeMap() {
        return SupportedTaskDto.attributeTypeMap;
    }
    constructor() { }
}
SupportedTaskDto.discriminator = undefined;
SupportedTaskDto.attributeTypeMap = [
    {
        name: 'name',
        baseName: 'name',
        type: 'string',
        format: '',
    },
    {
        name: 'neededAssets',
        baseName: 'neededAssets',
        type: 'SupportedTaskTypeSetDefinition',
        format: '',
    },
    {
        name: 'style',
        baseName: 'style',
        type: 'SupportedTaskDtoStyle',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class SupportedTaskDtoStyle {
    static getAttributeTypeMap() {
        return SupportedTaskDtoStyle.attributeTypeMap;
    }
    constructor() { }
}
SupportedTaskDtoStyle.discriminator = undefined;
SupportedTaskDtoStyle.attributeTypeMap = [
    {
        name: 'color',
        baseName: 'color',
        type: 'string',
        format: '',
    },
    {
        name: 'backgroundColor',
        baseName: 'backgroundColor',
        type: 'string',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class SupportedTaskTypesConstraints {
    static getAttributeTypeMap() {
        return SupportedTaskTypesConstraints.attributeTypeMap;
    }
    constructor() { }
}
SupportedTaskTypesConstraints.discriminator = undefined;
SupportedTaskTypesConstraints.attributeTypeMap = [
    {
        name: 'defaultName',
        baseName: 'defaultName',
        type: 'string',
        format: '',
    },
    {
        name: 'defaultFile',
        baseName: 'defaultFile',
        type: 'any',
        format: '',
    },
    {
        name: 'schemaFile',
        baseName: 'schemaFile',
        type: 'any',
        format: '',
    },
    {
        name: 'extension',
        baseName: 'extension',
        type: 'Array<string>',
        format: '',
    },
    {
        name: 'description',
        baseName: 'description',
        type: 'string',
        format: '',
    },
    {
        name: 'contentFormat',
        baseName: 'contentFormat',
        type: 'string',
        format: '',
    },
    {
        name: 'mimeType',
        baseName: 'mimeType',
        type: 'Array<string>',
        format: '',
    },
    {
        name: 'namePattern',
        baseName: 'namePattern',
        type: 'string',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class SupportedTaskTypeSetDefinition {
    static getAttributeTypeMap() {
        return SupportedTaskTypeSetDefinition.attributeTypeMap;
    }
    constructor() { }
}
SupportedTaskTypeSetDefinition.discriminator = undefined;
SupportedTaskTypeSetDefinition.attributeTypeMap = [
    {
        name: 'name',
        baseName: 'name',
        type: 'string',
        format: '',
    },
    {
        name: 'statements',
        baseName: 'statements',
        type: 'Array<SupportedTaskTypeStatement>',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class SupportedTaskTypeStatement {
    static getAttributeTypeMap() {
        return SupportedTaskTypeStatement.attributeTypeMap;
    }
    constructor() { }
}
SupportedTaskTypeStatement.discriminator = undefined;
SupportedTaskTypeStatement.attributeTypeMap = [
    {
        name: 'name',
        baseName: 'name',
        type: 'string',
        format: '',
    },
    {
        name: 'combination',
        baseName: 'combination',
        type: 'string',
        format: '',
    },
    {
        name: 'description',
        baseName: 'description',
        type: 'string',
        format: '',
    },
    {
        name: 'optional',
        baseName: 'optional',
        type: 'boolean',
        format: '',
    },
    {
        name: 'takeMin',
        baseName: 'takeMin',
        type: 'number',
        format: '',
    },
    {
        name: 'take',
        baseName: 'take',
        type: 'number',
        format: '',
    },
    {
        name: 'takeMax',
        baseName: 'takeMax',
        type: 'number',
        format: '',
    },
    {
        name: 'constraints',
        baseName: 'constraints',
        type: 'Array<SupportedTaskTypesConstraints>',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class SystemRoleDto {
    static getAttributeTypeMap() {
        return SystemRoleDto.attributeTypeMap;
    }
    constructor() { }
}
SystemRoleDto.discriminator = undefined;
SystemRoleDto.attributeTypeMap = [
    {
        name: 'label',
        baseName: 'label',
        type: 'string',
        format: '',
    },
    {
        name: 'i18n',
        baseName: 'i18n',
        type: 'any',
        format: '',
    },
    {
        name: 'badge',
        baseName: 'badge',
        type: 'any',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class TaskBatchSessionDto {
    static getAttributeTypeMap() {
        return TaskBatchSessionDto.attributeTypeMap;
    }
    constructor() { }
}
TaskBatchSessionDto.discriminator = undefined;
TaskBatchSessionDto.attributeTypeMap = [
    {
        name: 'session_id',
        baseName: 'session_id',
        type: 'string',
        format: '',
    },
    {
        name: 'session_timestamp',
        baseName: 'session_timestamp',
        type: 'number',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class TaskBatchTransactionDto {
    static getAttributeTypeMap() {
        return TaskBatchTransactionDto.attributeTypeMap;
    }
    constructor() { }
}
TaskBatchTransactionDto.discriminator = undefined;
TaskBatchTransactionDto.attributeTypeMap = [
    {
        name: 'transaction_timestamp',
        baseName: 'transaction_timestamp',
        type: 'number',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class TaskBatchUploadDto {
    static getAttributeTypeMap() {
        return TaskBatchUploadDto.attributeTypeMap;
    }
    constructor() { }
}
TaskBatchUploadDto.discriminator = undefined;
TaskBatchUploadDto.attributeTypeMap = [
    {
        name: 'properties',
        baseName: 'properties',
        type: 'Properties',
        format: '',
    },
    {
        name: 'inputs',
        baseName: 'inputs',
        type: 'Array<any>',
        format: '',
    },
    {
        name: 'outputs',
        baseName: 'outputs',
        type: 'Array<any>',
        format: '',
    },
    {
        name: 'session_id',
        baseName: 'session_id',
        type: 'string',
        format: '',
    },
    {
        name: 'session_timestamp',
        baseName: 'session_timestamp',
        type: 'number',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class TaskChangeDto {
    static getAttributeTypeMap() {
        return TaskChangeDto.attributeTypeMap;
    }
    constructor() { }
}
TaskChangeDto.discriminator = undefined;
TaskChangeDto.attributeTypeMap = [
    {
        name: 'properties',
        baseName: 'properties',
        type: 'TaskChangeDtoProperties',
        format: '',
    },
    {
        name: 'inputs',
        baseName: 'inputs',
        type: 'Array<any>',
        format: '',
    },
    {
        name: 'outputs',
        baseName: 'outputs',
        type: 'Array<any>',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
/**
 * properties of the task
 */
class TaskChangeDtoProperties {
    static getAttributeTypeMap() {
        return TaskChangeDtoProperties.attributeTypeMap;
    }
    constructor() { }
}
TaskChangeDtoProperties.discriminator = undefined;
TaskChangeDtoProperties.attributeTypeMap = [
    {
        name: 'startdate',
        baseName: 'startdate',
        type: 'string',
        format: '',
    },
    {
        name: 'enddate',
        baseName: 'enddate',
        type: 'string',
        format: '',
    },
    {
        name: 'pid',
        baseName: 'pid',
        type: 'string',
        format: '',
    },
    {
        name: 'orgtext',
        baseName: 'orgtext',
        type: 'string',
        format: '',
    },
    {
        name: 'assessment',
        baseName: 'assessment',
        type: 'string',
        format: '',
    },
    {
        name: 'priority',
        baseName: 'priority',
        type: 'number',
        format: '',
    },
    {
        name: 'code',
        baseName: 'code',
        type: 'string',
        format: '',
    },
    {
        name: 'comment',
        baseName: 'comment',
        type: 'string',
        format: '',
    },
    {
        name: 'tool_configuration_id',
        baseName: 'tool_configuration_id',
        type: 'string',
        format: '',
    },
    {
        name: 'admin_comment',
        baseName: 'admin_comment',
        type: 'string',
        format: '',
    },
    {
        name: 'worker_id',
        baseName: 'worker_id',
        type: 'string',
        format: '',
    },
    {
        name: 'nexttask_id',
        baseName: 'nexttask_id',
        type: 'string',
        format: '',
    },
    {
        name: 'use_outputs_from_task_id',
        baseName: 'use_outputs_from_task_id',
        type: 'string',
        format: '',
    },
    {
        name: 'previoustask_id',
        baseName: 'previoustask_id',
        type: 'string',
        format: '',
    },
    {
        name: 'files_destination',
        baseName: 'files_destination',
        type: 'string',
        format: '',
    },
    {
        name: 'log',
        baseName: 'log',
        type: 'Array<any>',
        format: '',
    },
    {
        name: 'status',
        baseName: 'status',
        type: 'TaskChangeDtoPropertiesStatusEnum',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class TaskDto {
    static getAttributeTypeMap() {
        return TaskDto.attributeTypeMap;
    }
    constructor() { }
}
TaskDto.discriminator = undefined;
TaskDto.attributeTypeMap = [
    {
        name: 'creationdate',
        baseName: 'creationdate',
        type: 'string',
        format: '',
    },
    {
        name: 'updatedate',
        baseName: 'updatedate',
        type: 'string',
        format: '',
    },
    {
        name: 'startdate',
        baseName: 'startdate',
        type: 'string',
        format: '',
    },
    {
        name: 'enddate',
        baseName: 'enddate',
        type: 'string',
        format: '',
    },
    {
        name: 'pid',
        baseName: 'pid',
        type: 'string',
        format: '',
    },
    {
        name: 'orgtext',
        baseName: 'orgtext',
        type: 'string',
        format: '',
    },
    {
        name: 'assessment',
        baseName: 'assessment',
        type: 'string',
        format: '',
    },
    {
        name: 'priority',
        baseName: 'priority',
        type: 'number',
        format: '',
    },
    {
        name: 'status',
        baseName: 'status',
        type: 'TaskDtoStatusEnum',
        format: '',
    },
    {
        name: 'code',
        baseName: 'code',
        type: 'string',
        format: '',
    },
    {
        name: 'log',
        baseName: 'log',
        type: 'any',
        format: '',
    },
    {
        name: 'comment',
        baseName: 'comment',
        type: 'string',
        format: '',
    },
    {
        name: 'tool_configuration',
        baseName: 'tool_configuration',
        type: 'ToolConfigurationDto',
        format: '',
    },
    {
        name: 'admin_comment',
        baseName: 'admin_comment',
        type: 'string',
        format: '',
    },
    {
        name: 'worker_id',
        baseName: 'worker_id',
        type: 'string',
        format: '',
    },
    {
        name: 'worker_username',
        baseName: 'worker_username',
        type: 'string',
        format: '',
    },
    {
        name: 'nexttask',
        baseName: 'nexttask',
        type: 'TaskDto',
        format: '',
    },
    {
        name: 'use_outputs_from_task_id',
        baseName: 'use_outputs_from_task_id',
        type: 'string',
        format: '',
    },
    {
        name: 'use_outputs_from_task',
        baseName: 'use_outputs_from_task',
        type: 'Array<TaskInputOutputDto>',
        format: '',
    },
    {
        name: 'inputs',
        baseName: 'inputs',
        type: 'Array<TaskInputOutputDto>',
        format: '',
    },
    {
        name: 'outputs',
        baseName: 'outputs',
        type: 'Array<TaskInputOutputDto>',
        format: '',
    },
    {
        name: 'id',
        baseName: 'id',
        type: 'string',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class TaskInputOutputDto {
    static getAttributeTypeMap() {
        return TaskInputOutputDto.attributeTypeMap;
    }
    constructor() { }
}
TaskInputOutputDto.discriminator = undefined;
TaskInputOutputDto.attributeTypeMap = [
    {
        name: 'type',
        baseName: 'type',
        type: 'any',
        format: '',
    },
    {
        name: 'creator_type',
        baseName: 'creator_type',
        type: 'TaskInputOutputDtoCreatorTypeEnum',
        format: '',
    },
    {
        name: 'label',
        baseName: 'label',
        type: 'string',
        format: '',
    },
    {
        name: 'description',
        baseName: 'description',
        type: 'string',
        format: '',
    },
    {
        name: 'filename',
        baseName: 'filename',
        type: 'string',
        format: '',
    },
    {
        name: 'url',
        baseName: 'url',
        type: 'string',
        format: '',
    },
    {
        name: 'content_type',
        baseName: 'content_type',
        type: 'string',
        format: '',
    },
    {
        name: 'content',
        baseName: 'content',
        type: 'any',
        format: '',
    },
    {
        name: 'fileType',
        baseName: 'fileType',
        type: 'string',
        format: '',
    },
    {
        name: 'size',
        baseName: 'size',
        type: 'number',
        format: '',
    },
    {
        name: 'metadata',
        baseName: 'metadata',
        type: 'any',
        format: '',
    },
    {
        name: 'uploader_username',
        baseName: 'uploader_username',
        type: 'string',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class TaskListInputOutputDto {
    static getAttributeTypeMap() {
        return TaskListInputOutputDto.attributeTypeMap;
    }
    constructor() { }
}
TaskListInputOutputDto.discriminator = undefined;
TaskListInputOutputDto.attributeTypeMap = [
    {
        name: 'creator_type',
        baseName: 'creator_type',
        type: 'TaskListInputOutputDtoCreatorTypeEnum',
        format: '',
    },
    {
        name: 'label',
        baseName: 'label',
        type: 'string',
        format: '',
    },
    {
        name: 'description',
        baseName: 'description',
        type: 'string',
        format: '',
    },
    {
        name: 'filename',
        baseName: 'filename',
        type: 'string',
        format: '',
    },
    {
        name: 'url',
        baseName: 'url',
        type: 'string',
        format: '',
    },
    {
        name: 'fileType',
        baseName: 'fileType',
        type: 'string',
        format: '',
    },
    {
        name: 'uploader_username',
        baseName: 'uploader_username',
        type: 'string',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class TaskListItemDto {
    static getAttributeTypeMap() {
        return TaskListItemDto.attributeTypeMap;
    }
    constructor() { }
}
TaskListItemDto.discriminator = undefined;
TaskListItemDto.attributeTypeMap = [
    {
        name: 'creationdate',
        baseName: 'creationdate',
        type: 'string',
        format: '',
    },
    {
        name: 'updatedate',
        baseName: 'updatedate',
        type: 'string',
        format: '',
    },
    {
        name: 'startdate',
        baseName: 'startdate',
        type: 'string',
        format: '',
    },
    {
        name: 'enddate',
        baseName: 'enddate',
        type: 'string',
        format: '',
    },
    {
        name: 'inputs',
        baseName: 'inputs',
        type: 'Array<TaskListInputOutputDto>',
        format: '',
    },
    {
        name: 'outputs',
        baseName: 'outputs',
        type: 'Array<TaskListInputOutputDto>',
        format: '',
    },
    {
        name: 'tool_configuration',
        baseName: 'tool_configuration',
        type: 'ToolConfigurationMinimalDto',
        format: '',
    },
    {
        name: 'nexttask',
        baseName: 'nexttask',
        type: 'TaskListItemDto',
        format: '',
    },
    {
        name: 'id',
        baseName: 'id',
        type: 'string',
        format: '',
    },
    {
        name: 'pid',
        baseName: 'pid',
        type: 'string',
        format: '',
    },
    {
        name: 'orgtext',
        baseName: 'orgtext',
        type: 'string',
        format: '',
    },
    {
        name: 'assessment',
        baseName: 'assessment',
        type: 'string',
        format: '',
    },
    {
        name: 'priority',
        baseName: 'priority',
        type: 'number',
        format: '',
    },
    {
        name: 'status',
        baseName: 'status',
        type: 'TaskListItemDtoStatusEnum',
        format: '',
    },
    {
        name: 'code',
        baseName: 'code',
        type: 'string',
        format: '',
    },
    {
        name: 'log',
        baseName: 'log',
        type: 'any',
        format: '',
    },
    {
        name: 'comment',
        baseName: 'comment',
        type: 'string',
        format: '',
    },
    {
        name: 'admin_comment',
        baseName: 'admin_comment',
        type: 'string',
        format: '',
    },
    {
        name: 'worker_id',
        baseName: 'worker_id',
        type: 'string',
        format: '',
    },
    {
        name: 'worker_username',
        baseName: 'worker_username',
        type: 'string',
        format: '',
    },
    {
        name: 'use_outputs_from_task_id',
        baseName: 'use_outputs_from_task_id',
        type: 'string',
        format: '',
    },
    {
        name: 'use_outputs_from_task',
        baseName: 'use_outputs_from_task',
        type: 'Array<TaskInputOutputDto>',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class TaskProperties {
    static getAttributeTypeMap() {
        return TaskProperties.attributeTypeMap;
    }
    constructor() { }
}
TaskProperties.discriminator = undefined;
TaskProperties.attributeTypeMap = [
    {
        name: 'startdate',
        baseName: 'startdate',
        type: 'string',
        format: '',
    },
    {
        name: 'enddate',
        baseName: 'enddate',
        type: 'string',
        format: '',
    },
    {
        name: 'pid',
        baseName: 'pid',
        type: 'string',
        format: '',
    },
    {
        name: 'orgtext',
        baseName: 'orgtext',
        type: 'string',
        format: '',
    },
    {
        name: 'assessment',
        baseName: 'assessment',
        type: 'string',
        format: '',
    },
    {
        name: 'priority',
        baseName: 'priority',
        type: 'number',
        format: '',
    },
    {
        name: 'code',
        baseName: 'code',
        type: 'string',
        format: '',
    },
    {
        name: 'comment',
        baseName: 'comment',
        type: 'string',
        format: '',
    },
    {
        name: 'tool_configuration_id',
        baseName: 'tool_configuration_id',
        type: 'string',
        format: '',
    },
    {
        name: 'admin_comment',
        baseName: 'admin_comment',
        type: 'string',
        format: '',
    },
    {
        name: 'worker_id',
        baseName: 'worker_id',
        type: 'string',
        format: '',
    },
    {
        name: 'nexttask_id',
        baseName: 'nexttask_id',
        type: 'string',
        format: '',
    },
    {
        name: 'use_outputs_from_task_id',
        baseName: 'use_outputs_from_task_id',
        type: 'string',
        format: '',
    },
    {
        name: 'previoustask_id',
        baseName: 'previoustask_id',
        type: 'string',
        format: '',
    },
    {
        name: 'files_destination',
        baseName: 'files_destination',
        type: 'string',
        format: '',
    },
    {
        name: 'log',
        baseName: 'log',
        type: 'Array<any>',
        format: '',
    },
    {
        name: 'status',
        baseName: 'status',
        type: 'TaskPropertiesStatusEnum',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class TaskSaveDto {
    static getAttributeTypeMap() {
        return TaskSaveDto.attributeTypeMap;
    }
    constructor() { }
}
TaskSaveDto.discriminator = undefined;
TaskSaveDto.attributeTypeMap = [
    {
        name: 'properties',
        baseName: 'properties',
        type: 'TaskSaveDtoProperties',
        format: '',
    },
    {
        name: 'outputs',
        baseName: 'outputs',
        type: 'Array<any>',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
/**
 * properties of the task
 */
class TaskSaveDtoProperties {
    static getAttributeTypeMap() {
        return TaskSaveDtoProperties.attributeTypeMap;
    }
    constructor() { }
}
TaskSaveDtoProperties.discriminator = undefined;
TaskSaveDtoProperties.attributeTypeMap = [
    {
        name: 'assessment',
        baseName: 'assessment',
        type: 'string',
        format: '',
    },
    {
        name: 'code',
        baseName: 'code',
        type: 'string',
        format: '',
    },
    {
        name: 'comment',
        baseName: 'comment',
        type: 'string',
        format: '',
    },
    {
        name: 'log',
        baseName: 'log',
        type: 'Array<any>',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class TaskSaveProperties {
    static getAttributeTypeMap() {
        return TaskSaveProperties.attributeTypeMap;
    }
    constructor() { }
}
TaskSaveProperties.discriminator = undefined;
TaskSaveProperties.attributeTypeMap = [
    {
        name: 'assessment',
        baseName: 'assessment',
        type: 'string',
        format: '',
    },
    {
        name: 'code',
        baseName: 'code',
        type: 'string',
        format: '',
    },
    {
        name: 'comment',
        baseName: 'comment',
        type: 'string',
        format: '',
    },
    {
        name: 'log',
        baseName: 'log',
        type: 'Array<any>',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class TaskStartActionDto {
    static getAttributeTypeMap() {
        return TaskStartActionDto.attributeTypeMap;
    }
    constructor() { }
}
TaskStartActionDto.discriminator = undefined;
TaskStartActionDto.attributeTypeMap = [
    {
        name: 'task_type',
        baseName: 'task_type',
        type: 'string',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class TaskUploadDto {
    static getAttributeTypeMap() {
        return TaskUploadDto.attributeTypeMap;
    }
    constructor() { }
}
TaskUploadDto.discriminator = undefined;
TaskUploadDto.attributeTypeMap = [
    {
        name: 'properties',
        baseName: 'properties',
        type: 'Properties',
        format: '',
    },
    {
        name: 'inputs',
        baseName: 'inputs',
        type: 'Array<any>',
        format: '',
    },
    {
        name: 'outputs',
        baseName: 'outputs',
        type: 'Array<any>',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class ToolChangeRequestDto {
    static getAttributeTypeMap() {
        return ToolChangeRequestDto.attributeTypeMap;
    }
    constructor() { }
}
ToolChangeRequestDto.discriminator = undefined;
ToolChangeRequestDto.attributeTypeMap = [
    {
        name: 'active',
        baseName: 'active',
        type: 'boolean',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class ToolConfigurationAssetChangeDto {
    static getAttributeTypeMap() {
        return ToolConfigurationAssetChangeDto.attributeTypeMap;
    }
    constructor() { }
}
ToolConfigurationAssetChangeDto.discriminator = undefined;
ToolConfigurationAssetChangeDto.attributeTypeMap = [
    {
        name: 'id',
        baseName: 'id',
        type: 'string',
        format: '',
    },
    {
        name: 'name',
        baseName: 'name',
        type: 'string',
        format: '',
    },
    {
        name: 'filename',
        baseName: 'filename',
        type: 'string',
        format: '',
    },
    {
        name: 'mime_type',
        baseName: 'mime_type',
        type: 'string',
        format: '',
    },
    {
        name: 'content',
        baseName: 'content',
        type: 'any',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class ToolConfigurationAssetDto {
    static getAttributeTypeMap() {
        return ToolConfigurationAssetDto.attributeTypeMap;
    }
    constructor() { }
}
ToolConfigurationAssetDto.discriminator = undefined;
ToolConfigurationAssetDto.attributeTypeMap = [
    {
        name: 'id',
        baseName: 'id',
        type: 'string',
        format: '',
    },
    {
        name: 'name',
        baseName: 'name',
        type: 'string',
        format: '',
    },
    {
        name: 'filename',
        baseName: 'filename',
        type: 'string',
        format: '',
    },
    {
        name: 'mime_type',
        baseName: 'mime_type',
        type: 'string',
        format: '',
    },
    {
        name: 'content',
        baseName: 'content',
        type: 'any',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class ToolConfigurationChangeDto {
    static getAttributeTypeMap() {
        return ToolConfigurationChangeDto.attributeTypeMap;
    }
    constructor() { }
}
ToolConfigurationChangeDto.discriminator = undefined;
ToolConfigurationChangeDto.attributeTypeMap = [
    {
        name: 'name',
        baseName: 'name',
        type: 'string',
        format: '',
    },
    {
        name: 'assets',
        baseName: 'assets',
        type: 'Array<ToolConfigurationAssetChangeDto>',
        format: '',
    },
    {
        name: 'standard',
        baseName: 'standard',
        type: 'boolean',
        format: '',
    },
    {
        name: 'value',
        baseName: 'value',
        type: 'any',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class ToolConfigurationCreateDto {
    static getAttributeTypeMap() {
        return ToolConfigurationCreateDto.attributeTypeMap;
    }
    constructor() { }
}
ToolConfigurationCreateDto.discriminator = undefined;
ToolConfigurationCreateDto.attributeTypeMap = [
    {
        name: 'name',
        baseName: 'name',
        type: 'string',
        format: '',
    },
    {
        name: 'task_type',
        baseName: 'task_type',
        type: 'string',
        format: '',
    },
    {
        name: 'standard',
        baseName: 'standard',
        type: 'boolean',
        format: '',
    },
    {
        name: 'tool_id',
        baseName: 'tool_id',
        type: 'string',
        format: '',
    },
    {
        name: 'value',
        baseName: 'value',
        type: 'any',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class ToolConfigurationDto {
    static getAttributeTypeMap() {
        return ToolConfigurationDto.attributeTypeMap;
    }
    constructor() { }
}
ToolConfigurationDto.discriminator = undefined;
ToolConfigurationDto.attributeTypeMap = [
    {
        name: 'name',
        baseName: 'name',
        type: 'string',
        format: '',
    },
    {
        name: 'id',
        baseName: 'id',
        type: 'string',
        format: '',
    },
    {
        name: 'tool',
        baseName: 'tool',
        type: 'ToolDto',
        format: '',
    },
    {
        name: 'task_type',
        baseName: 'task_type',
        type: 'SupportedTaskDto',
        format: '',
    },
    {
        name: 'assets',
        baseName: 'assets',
        type: 'Array<ToolConfigurationAssetDto>',
        format: '',
    },
    {
        name: 'standard',
        baseName: 'standard',
        type: 'boolean',
        format: '',
    },
    {
        name: 'tool_id',
        baseName: 'tool_id',
        type: 'string',
        format: '',
    },
    {
        name: 'value',
        baseName: 'value',
        type: 'any',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class ToolConfigurationMinimalDto {
    static getAttributeTypeMap() {
        return ToolConfigurationMinimalDto.attributeTypeMap;
    }
    constructor() { }
}
ToolConfigurationMinimalDto.discriminator = undefined;
ToolConfigurationMinimalDto.attributeTypeMap = [
    {
        name: 'name',
        baseName: 'name',
        type: 'string',
        format: '',
    },
    {
        name: 'id',
        baseName: 'id',
        type: 'string',
        format: '',
    },
    {
        name: 'tool',
        baseName: 'tool',
        type: 'ToolMinimalDto',
        format: '',
    },
    {
        name: 'task_type',
        baseName: 'task_type',
        type: 'SupportedTaskDto',
        format: '',
    },
    {
        name: 'assets',
        baseName: 'assets',
        type: 'Array<ToolConfigurationAssetDto>',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class ToolDto {
    static getAttributeTypeMap() {
        return ToolDto.attributeTypeMap;
    }
    constructor() { }
}
ToolDto.discriminator = undefined;
ToolDto.attributeTypeMap = [
    {
        name: 'creationdate',
        baseName: 'creationdate',
        type: 'string',
        format: '',
    },
    {
        name: 'updatedate',
        baseName: 'updatedate',
        type: 'string',
        format: '',
    },
    {
        name: 'name',
        baseName: 'name',
        type: 'string',
        format: '',
    },
    {
        name: 'version',
        baseName: 'version',
        type: 'string',
        format: '',
    },
    {
        name: 'authors',
        baseName: 'authors',
        type: 'Array<string>',
        format: '',
    },
    {
        name: 'homepage',
        baseName: 'homepage',
        type: 'string',
        format: '',
    },
    {
        name: 'description',
        baseName: 'description',
        type: 'string',
        format: '',
    },
    {
        name: 'type',
        baseName: 'type',
        type: 'ToolDtoTypeEnum',
        format: '',
    },
    {
        name: 'processingType',
        baseName: 'processingType',
        type: 'ToolDtoProcessingTypeEnum',
        format: '',
    },
    {
        name: 'supportedTaskTypes',
        baseName: 'supportedTaskTypes',
        type: 'Array<string>',
        format: '',
    },
    {
        name: 'url',
        baseName: 'url',
        type: 'string',
        format: '',
    },
    {
        name: 'pid',
        baseName: 'pid',
        type: 'string',
        format: '',
    },
    {
        name: 'defaultPreferences',
        baseName: 'defaultPreferences',
        type: 'any',
        format: '',
    },
    {
        name: 'preferencesSchema',
        baseName: 'preferencesSchema',
        type: 'any',
        format: '',
    },
    {
        name: 'ioValidation',
        baseName: 'ioValidation',
        type: 'any',
        format: '',
    },
    {
        name: 'active',
        baseName: 'active',
        type: 'boolean',
        format: '',
    },
    {
        name: 'installed',
        baseName: 'installed',
        type: 'boolean',
        format: '',
    },
    {
        name: 'folder_name',
        baseName: 'folder_name',
        type: 'string',
        format: '',
    },
    {
        name: 'id',
        baseName: 'id',
        type: 'string',
        format: '',
    },
];

/**
 * OCTRA API
 * # Introduction The OCTRA-API is a REST-API that allows apps to interact with the OCTRA Database (OCTRA-DB) and its project files.  <img src=\"./assets/octra-backend-diagram.png\" alt=\"octra diagram\" />  In order to use this API you should meet the following requirements:  1. You have a valid app token. You can request an app token from the administrator (contact <a href=\"mailto:octra@phonetik.uni-muenchen.de\">octra@phonetik.uni-muenchen.de</a>).<br/>     The app token should be sent...      a. ... with each HTTP-Request in a HTTP-header called \"X-App-Token\". For example:<br/>     <code>X-App-Token: 7328z4093u4ß92u4902u348</code><br/><br/>     App tokens are bound to specific domains (aka \"origins\").<br/>      b. ... or with each HTTP-Request as cookie \"ocb_app_token\" (added by the server automatically). This method is recommended for web applications.      c. ... or with each HTTP-Request as query parameter \"app_token\" (only recommended for HTML embedded files if cookies can't be used).  2. All HTTP-requests but the authentication methods need the user to be authenticated. The OCTRA-API uses JWT (Jason Web Token) for authentication and authorization.     A successful <a href=\"#tag/Authentication/operation/login\">login request</a> returns the JWT which is valid for 24h. This JWT must be appended ...      a. ... to the \"Authorization\" HTTP-Header. For example: <code>Authorization: Bearer 7328z40293i84ß034293ß02934</code>      b. ... or as cookie called \"ocb_sessiontoken\". You need this e.g. if you want the user to access embedded files in HTML.      c. ... or with each HTTP-Request as query parameter \"session_token\" (only recommended for HTML embedded files if cookies can't be used).  **Notice:** If you call API methods via terminal you can't use cookies and have to add the tokens to the headers or query parameters. If you have to retrieve files from a project programmatically you can add the app and session tokens as query parameters.  ## Role model  This API makes use of a role model. Each user has exactly one global role and project-specific roles.  ### Global roles  <table> <tbody> <tr> <td><code>administrator</code></td> <td>System administrator with full access to all API functions.</td> </tr> <tr> <td><code>user</code></td> <td>Default role for users with normal access rights.</td> </tr> <tr> <td><code>app</code></td> <td>Role for Desktop-applications. See notice below. </td> </tr> </tbody> </table>  #### Notice about app roles  <div style=\"background-color:rgba(255,165,0,0.36);padding:20px;\"> Applications need to be authenticated like normal users but without the need of accepting the data policy and terms & conditions. The owner of the app has to make sure that our policies are accepted by users whose data is shared with octra-backend. </div>  ### Project-specific roles <table> <tbody> <tr> <td><code>project_admin</code></td> <td>Project administrator with administrative access rights for the project he or she is assigned with.</td> </tr> <tr> <td><code>data_delivery</code></td> <td>Data deliverer with limited access rights.</td> </tr> <tr> <td colspan=\"2\">There are custom roles that are created by the administrator. As long as an API method allow role \"user\" a user with a custom role is allows to call this method.</td> </tr> </tbody> </table>
 *
 * OpenAPI spec version: 0.7.8
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class ToolMinimalDto {
    static getAttributeTypeMap() {
        return ToolMinimalDto.attributeTypeMap;
    }
    constructor() { }
}
ToolMinimalDto.discriminator = undefined;
ToolMinimalDto.attributeTypeMap = [
    {
        name: 'id',
        baseName: 'id',
        type: 'string',
        format: '',
    },
    {
        name: 'name',
        baseName: 'name',
        type: 'string',
        format: '',
    },
    {
        name: 'version',
        baseName: 'version',
        type: 'string',
        format: '',
    },
    {
        name: 'active',
        baseName: 'active',
        type: 'boolean',
        format: '',
    },
];

const COUNTRYSTATES = [
    {
        country: 'Afghanistan',
        states: [
            'Badakhshan',
            'Badghis',
            'Baghlan',
            'Balkh',
            'Bamian',
            'Daykondi',
            'Farah',
            'Faryab',
            'Ghazni',
            'Ghowr',
            'Helmand',
            'Herat',
            'Jowzjan',
            'Kabul',
            'Kandahar',
            'Kapisa',
            'Khost',
            'Konar',
            'Kondoz',
            'Laghman',
            'Lowgar',
            'Nangarhar',
            'Nimruz',
            'Nurestan',
            'Oruzgan',
            'Paktia',
            'Paktika',
            'Panjshir',
            'Parvan',
            'Samangan',
            'Sar-e Pol',
            'Takhar',
            'Vardak',
            'Zabol',
        ],
    },
    {
        country: 'Albania',
        states: ['Berat', 'Dibres', 'Durres', 'Elbasan', 'Fier', 'Gjirokastre', 'Korce', 'Kukes', 'Lezhe', 'Shkoder', 'Tirane', 'Vlore'],
    },
    {
        country: 'Algeria',
        states: [
            'Adrar',
            'Ain Defla',
            'Ain Temouchent',
            'Alger',
            'Annaba',
            'Batna',
            'Bechar',
            'Bejaia',
            'Biskra',
            'Blida',
            'Bordj Bou Arreridj',
            'Bouira',
            'Boumerdes',
            'Chlef',
            'Constantine',
            'Djelfa',
            'El Bayadh',
            'El Oued',
            'El Tarf',
            'Ghardaia',
            'Guelma',
            'Illizi',
            'Jijel',
            'Khenchela',
            'Laghouat',
            'Muaskar',
            'Medea',
            'Mila',
            'Mostaganem',
            "M'Sila",
            'Naama',
            'Oran',
            'Ouargla',
            'Oum el Bouaghi',
            'Relizane',
            'Saida',
            'Setif',
            'Sidi Bel Abbes',
            'Skikda',
            'Souk Ahras',
            'Tamanghasset',
            'Tebessa',
            'Tiaret',
            'Tindouf',
            'Tipaza',
            'Tissemsilt',
            'Tizi Ouzou',
            'Tlemcen',
        ],
    },
    {
        country: 'Andorra',
        states: ['Andorra la Vella', 'Canillo', 'Encamp', 'Escaldes-Engordany', 'La Massana', 'Ordino', 'Sant Julia de Loria'],
    },
    {
        country: 'Angola',
        states: [
            'Bengo',
            'Benguela',
            'Bie',
            'Cabinda',
            'Cuando Cubango',
            'Cuanza Norte',
            'Cuanza Sul',
            'Cunene',
            'Huambo',
            'Huila',
            'Luanda',
            'Lunda Norte',
            'Lunda Sul',
            'Malanje',
            'Moxico',
            'Namibe',
            'Uige',
            'Zaire',
        ],
    },
    {
        country: 'Antarctica',
        states: [],
    },
    {
        country: 'Antigua and Barbuda',
        states: ['Barbuda', 'Redonda', 'Saint George', 'Saint John', 'Saint Mary', 'Saint Paul', 'Saint Peter', 'Saint Philip'],
    },
    {
        country: 'Argentina',
        states: [
            'Buenos Aires',
            'Buenos Aires Capital',
            'Catamarca',
            'Chaco',
            'Chubut',
            'Cordoba',
            'Corrientes',
            'Entre Rios',
            'Formosa',
            'Jujuy',
            'La Pampa',
            'La Rioja',
            'Mendoza',
            'Misiones',
            'Neuquen',
            'Rio Negro',
            'Salta',
            'San Juan',
            'San Luis',
            'Santa Cruz',
            'Santa Fe',
            'Santiago del Estero',
            'Tierra del Fuego',
            'Tucuman',
        ],
    },
    {
        country: 'Armenia',
        states: ['Aragatsotn', 'Ararat', 'Armavir', "Geghark'unik'", "Kotayk'", 'Lorri', 'Shirak', "Syunik'", 'Tavush', "Vayots' Dzor", 'Yerevan'],
    },
    {
        country: 'Australia',
        states: ['New South Wales', 'Victoria', 'Queensland', 'Western Australia', 'South Australia', 'Tasmania'],
    },
    {
        country: 'Austria',
        states: ['Burgenland', 'Kaernten', 'Niederoesterreich', 'Oberoesterreich', 'Salzburg', 'Steiermark', 'Tirol', 'Vorarlberg', 'Wien'],
    },
    {
        country: 'Azerbaijan',
        states: [
            'Abseron Rayonu',
            'Agcabadi Rayonu',
            'Agdam Rayonu',
            'Agdas Rayonu',
            'Agstafa Rayonu',
            'Agsu Rayonu',
            'Astara Rayonu',
            'Balakan Rayonu',
            'Barda Rayonu',
            'Beylaqan Rayonu',
            'Bilasuvar Rayonu',
            'Cabrayil Rayonu',
            'Calilabad Rayonu',
            'Daskasan Rayonu',
            'Davaci Rayonu',
            'Fuzuli Rayonu',
            'Gadabay Rayonu',
            'Goranboy Rayonu',
            'Goycay Rayonu',
            'Haciqabul Rayonu',
            'Imisli Rayonu',
            'Ismayilli Rayonu',
            'Kalbacar Rayonu',
            'Kurdamir Rayonu',
            'Lacin Rayonu',
            'Lankaran Rayonu',
            'Lerik Rayonu',
            'Masalli Rayonu',
            'Neftcala Rayonu',
            'Oguz Rayonu',
            'Qabala Rayonu',
            'Qax Rayonu',
            'Qazax Rayonu',
            'Qobustan Rayonu',
            'Quba Rayonu',
            'Qubadli Rayonu',
            'Qusar Rayonu',
            'Saatli Rayonu',
            'Sabirabad Rayonu',
            'Saki Rayonu',
            'Salyan Rayonu',
            'Samaxi Rayonu',
            'Samkir Rayonu',
            'Samux Rayonu',
            'Siyazan Rayonu',
            'Susa Rayonu',
            'Tartar Rayonu',
            'Tovuz Rayonu',
            'Ucar Rayonu',
            'Xacmaz Rayonu',
            'Xanlar Rayonu',
            'Xizi Rayonu',
            'Xocali Rayonu',
            'Xocavand Rayonu',
            'Yardimli Rayonu',
            'Yevlax Rayonu',
            'Zangilan Rayonu',
            'Zaqatala Rayonu',
            'Zardab Rayonu',
            'Ali Bayramli Sahari',
            'Baki Sahari',
            'Ganca Sahari',
            'Lankaran Sahari',
            'Mingacevir Sahari',
            'Naftalan Sahari',
            'Saki Sahari',
            'Sumqayit Sahari',
            'Susa Sahari',
            'Xankandi Sahari',
            'Yevlax Sahari',
            'Naxcivan Muxtar',
        ],
    },
    {
        country: 'Bahamas',
        states: [
            'Acklins and Crooked Islands',
            'Bimini',
            'Cat Island',
            'Exuma',
            'Freeport',
            'Fresh Creek',
            "Governor's Harbour",
            'Green Turtle Cay',
            'Harbour Island',
            'High Rock',
            'Inagua',
            'Kemps Bay',
            'Long Island',
            'Marsh Harbour',
            'Mayaguana',
            'New Providence',
            'Nichollstown and Berry Islands',
            'Ragged Island',
            'Rock Sound',
            'Sandy Point',
            'San Salvador and Rum Cay',
        ],
    },
    {
        country: 'Bahrain',
        states: [
            'Al Hadd',
            'Al Manamah',
            'Al Mintaqah al Gharbiyah',
            'Al Mintaqah al Wusta',
            'Al Mintaqah ash Shamaliyah',
            'Al Muharraq',
            "Ar Rifa' wa al Mintaqah al Janubiyah",
            'Jidd Hafs',
            'Madinat Hamad',
            "Madinat 'Isa",
            'Juzur Hawar',
            'Sitrah',
        ],
    },
    {
        country: 'Bangladesh',
        states: ['Barisal', 'Chittagong', 'Dhaka', 'Khulna', 'Rajshahi', 'Sylhet'],
    },
    {
        country: 'Barbados',
        states: [
            'Christ Church',
            'Saint Andrew',
            'Saint George',
            'Saint James',
            'Saint John',
            'Saint Joseph',
            'Saint Lucy',
            'Saint Michael',
            'Saint Peter',
            'Saint Philip',
            'Saint Thomas',
        ],
    },
    {
        country: 'Belarus',
        states: ['Brest', 'Homyel', 'Horad Minsk', 'Hrodna', 'Mahilyow', 'Minsk', 'Vitsyebsk'],
    },
    {
        country: 'Belgium',
        states: [
            'Antwerpen',
            'Brabant Wallon',
            'Brussels',
            'Flanders',
            'Hainaut',
            'Liege',
            'Limburg',
            'Luxembourg',
            'Namur',
            'Oost-Vlaanderen',
            'Vlaams-Brabant',
            'Wallonia',
            'West-Vlaanderen',
        ],
    },
    {
        country: 'Belize',
        states: ['Belize', 'Cayo', 'Corozal', 'Orange Walk', 'Stann Creek', 'Toledo'],
    },
    {
        country: 'Benin',
        states: ['Alibori', 'Atakora', 'Atlantique', 'Borgou', 'Collines', 'Donga', 'Kouffo', 'Littoral', 'Mono', 'Oueme', 'Plateau', 'Zou'],
    },
    {
        country: 'Bermuda',
        states: [
            'Devonshire',
            'Hamilton',
            'Hamilton',
            'Paget',
            'Pembroke',
            'Saint George',
            "Saint George's",
            'Sandys',
            "Smith's",
            'Southampton',
            'Warwick',
        ],
    },
    {
        country: 'Bhutan',
        states: [
            'Bumthang',
            'Chukha',
            'Dagana',
            'Gasa',
            'Haa',
            'Lhuntse',
            'Mongar',
            'Paro',
            'Pemagatshel',
            'Punakha',
            'Samdrup Jongkhar',
            'Samtse',
            'Sarpang',
            'Thimphu',
            'Trashigang',
            'Trashiyangste',
            'Trongsa',
            'Tsirang',
            'Wangdue Phodrang',
            'Zhemgang',
        ],
    },
    {
        country: 'Bolivia',
        states: ['Chuquisaca', 'Cochabamba', 'Beni', 'La Paz', 'Oruro', 'Pando', 'Potosi', 'Santa Cruz', 'Tarija'],
    },
    {
        country: 'Bosnia and Herzegovina',
        states: [
            'Una-Sana [Federation]',
            'Posavina [Federation]',
            'Tuzla [Federation]',
            'Zenica-Doboj [Federation]',
            'Bosnian Podrinje [Federation]',
            'Central Bosnia [Federation]',
            'Herzegovina-Neretva [Federation]',
            'West Herzegovina [Federation]',
            'Sarajevo [Federation]',
            ' West Bosnia [Federation]',
            'Banja Luka [RS]',
            'Bijeljina [RS]',
            'Doboj [RS]',
            'Fo?a [RS]',
            'Sarajevo-Romanija [RS]',
            'Trebinje [RS]',
            'Vlasenica [RS]',
        ],
    },
    {
        country: 'Botswana',
        states: ['Central', 'Ghanzi', 'Kgalagadi', 'Kgatleng', 'Kweneng', 'North East', 'North West', 'South East', 'Southern'],
    },
    {
        country: 'Brazil',
        states: [
            'Acre',
            'Alagoas',
            'Amapa',
            'Amazonas',
            'Bahia',
            'Ceara',
            'Distrito Federal',
            'Espirito Santo',
            'Goias',
            'Maranhao',
            'Mato Grosso',
            'Mato Grosso do Sul',
            'Minas Gerais',
            'Para',
            'Paraiba',
            'Parana',
            'Pernambuco',
            'Piaui',
            'Rio de Janeiro',
            'Rio Grande do Norte',
            'Rio Grande do Sul',
            'Rondonia',
            'Roraima',
            'Santa Catarina',
            'Sao Paulo',
            'Sergipe',
            'Tocantins',
        ],
    },
    {
        country: 'Brunei',
        states: ['Belait', 'Brunei and Muara', 'Temburong', 'Tutong'],
    },
    {
        country: 'Bulgaria',
        states: [
            'Blagoevgrad',
            'Burgas',
            'Dobrich',
            'Gabrovo',
            'Khaskovo',
            'Kurdzhali',
            'Kyustendil',
            'Lovech',
            'Montana',
            'Pazardzhik',
            'Pernik',
            'Pleven',
            'Plovdiv',
            'Razgrad',
            'Ruse',
            'Shumen',
            'Silistra',
            'Sliven',
            'Smolyan',
            'Sofiya',
            'Sofiya-Grad',
            'Stara Zagora',
            'Turgovishte',
            'Varna',
            'Veliko Turnovo',
            'Vidin',
            'Vratsa',
            'Yambol',
        ],
    },
    {
        country: 'Burkina Faso',
        states: [
            'Bale',
            'Bam',
            'Banwa',
            'Bazega',
            'Bougouriba',
            'Boulgou',
            'Boulkiemde',
            'Comoe',
            'Ganzourgou',
            'Gnagna',
            'Gourma',
            'Houet',
            'Ioba',
            'Kadiogo',
            'Kenedougou',
            'Komondjari',
            'Kompienga',
            'Kossi',
            'Koulpelogo',
            'Kouritenga',
            'Kourweogo',
            'Leraba',
            'Loroum',
            'Mouhoun',
            'Namentenga',
            'Nahouri',
            'Nayala',
            'Noumbiel',
            'Oubritenga',
            'Oudalan',
            'Passore',
            'Poni',
            'Sanguie',
            'Sanmatenga',
            'Seno',
            'Sissili',
            'Soum',
            'Sourou',
            'Tapoa',
            'Tuy',
            'Yagha',
            'Yatenga',
            'Ziro',
            'Zondoma',
            'Zoundweogo',
        ],
    },
    {
        country: 'Burma',
        states: [
            'Ayeyarwady',
            'Bago',
            'Magway',
            'Mandalay',
            'Sagaing',
            'Tanintharyi',
            'Yangon',
            'Chin State',
            'Kachin State',
            'Kayin State',
            'Kayah State',
            'Mon State',
            'Rakhine State',
            'Shan State',
        ],
    },
    {
        country: 'Burundi',
        states: [
            'Bubanza',
            'Bujumbura Mairie',
            'Bujumbura Rural',
            'Bururi',
            'Cankuzo',
            'Cibitoke',
            'Gitega',
            'Karuzi',
            'Kayanza',
            'Kirundo',
            'Makamba',
            'Muramvya',
            'Muyinga',
            'Mwaro',
            'Ngozi',
            'Rutana',
            'Ruyigi',
        ],
    },
    {
        country: 'Cambodia',
        states: [
            'Banteay Mean Chey',
            'Batdambang',
            'Kampong Cham',
            'Kampong Chhnang',
            'Kampong Spoe',
            'Kampong Thum',
            'Kampot',
            'Kandal',
            'Koh Kong',
            'Kracheh',
            'Mondol Kiri',
            'Otdar Mean Chey',
            'Pouthisat',
            'Preah Vihear',
            'Prey Veng',
            'Rotanakir',
            'Siem Reab',
            'Stoeng Treng',
            'Svay Rieng',
            'Takao',
            'Keb',
            'Pailin',
            'Phnom Penh',
            'Preah Seihanu',
        ],
    },
    {
        country: 'Cameroon',
        states: ['Adamaoua', 'Centre', 'Est', 'Extreme-Nord', 'Littoral', 'Nord', 'Nord-Ouest', 'Ouest', 'Sud', 'Sud-Ouest'],
    },
    {
        country: 'Canada',
        states: [
            'Alberta',
            'British Columbia',
            'Manitoba',
            'New Brunswick',
            'Newfoundland and Labrador',
            'Northwest Territories',
            'Nova Scotia',
            'Nunavut',
            'Ontario',
            'Prince Edward Island',
            'Quebec',
            'Saskatchewan',
            'Yukon Territory',
        ],
    },
    {
        country: 'Cape Verde',
        states: [],
    },
    {
        country: 'Central African Republic',
        states: [
            'Bamingui-Bangoran',
            'Bangui',
            'Basse-Kotto',
            'Haute-Kotto',
            'Haut-Mbomou',
            'Kemo',
            'Lobaye',
            'Mambere-Kadei',
            'Mbomou',
            'Nana-Grebizi',
            'Nana-Mambere',
            'Ombella-Mpoko',
            'Ouaka',
            'Ouham',
            'Ouham-Pende',
            'Sangha-Mbaere',
            'Vakaga',
        ],
    },
    {
        country: 'Chad',
        states: [
            'Batha',
            'Biltine',
            'Borkou-Ennedi-Tibesti',
            'Chari-Baguirmi',
            'Guéra',
            'Kanem',
            'Lac',
            'Logone Occidental',
            'Logone Oriental',
            'Mayo-Kebbi',
            'Moyen-Chari',
            'Ouaddaï',
            'Salamat',
            'Tandjile',
        ],
    },
    {
        country: 'Chile',
        states: [
            'Aysen',
            'Antofagasta',
            'Araucania',
            'Atacama',
            'Bio-Bio',
            'Coquimbo',
            "O'Higgins",
            'Los Lagos',
            'Magallanes y la Antartica Chilena',
            'Maule',
            'Santiago Region Metropolitana',
            'Tarapaca',
            'Valparaiso',
        ],
    },
    {
        country: 'China',
        states: [
            'Anhui',
            'Fujian',
            'Gansu',
            'Guangdong',
            'Guizhou',
            'Hainan',
            'Hebei',
            'Heilongjiang',
            'Henan',
            'Hubei',
            'Hunan',
            'Jiangsu',
            'Jiangxi',
            'Jilin',
            'Liaoning',
            'Qinghai',
            'Shaanxi',
            'Shandong',
            'Shanxi',
            'Sichuan',
            'Yunnan',
            'Zhejiang',
            'Guangxi',
            'Nei Mongol',
            'Ningxia',
            'Xinjiang',
            'Xizang (Tibet)',
            'Beijing',
            'Chongqing',
            'Shanghai',
            'Tianjin',
        ],
    },
    {
        country: 'Colombia',
        states: [
            'Amazonas',
            'Antioquia',
            'Arauca',
            'Atlantico',
            'Bogota District Capital',
            'Bolivar',
            'Boyaca',
            'Caldas',
            'Caqueta',
            'Casanare',
            'Cauca',
            'Cesar',
            'Choco',
            'Cordoba',
            'Cundinamarca',
            'Guainia',
            'Guaviare',
            'Huila',
            'La Guajira',
            'Magdalena',
            'Meta',
            'Narino',
            'Norte de Santander',
            'Putumayo',
            'Quindio',
            'Risaralda',
            'San Andres & Providencia',
            'Santander',
            'Sucre',
            'Tolima',
            'Valle del Cauca',
            'Vaupes',
            'Vichada',
        ],
    },
    {
        country: 'Comoros',
        states: ['Grande Comore (Njazidja)', 'Anjouan (Nzwani)', 'Moheli (Mwali)'],
    },
    {
        country: 'Congo, Democratic Republic',
        states: [
            'Bandundu',
            'Bas-Congo',
            'Equateur',
            'Kasai-Occidental',
            'Kasai-Oriental',
            'Katanga',
            'Kinshasa',
            'Maniema',
            'Nord-Kivu',
            'Orientale',
            'Sud-Kivu',
        ],
    },
    {
        country: 'Congo, Republic of the',
        states: ['Bouenza', 'Brazzaville', 'Cuvette', 'Cuvette-Ouest', 'Kouilou', 'Lekoumou', 'Likouala', 'Niari', 'Plateaux', 'Pool', 'Sangha'],
    },
    {
        country: 'Costa Rica',
        states: ['Alajuela', 'Cartago', 'Guanacaste', 'Heredia', 'Limon', 'Puntarenas', 'San Jose'],
    },
    {
        country: "Cote d'Ivoire",
        states: [],
    },
    {
        country: 'Croatia',
        states: [
            'Bjelovarsko-Bilogorska',
            'Brodsko-Posavska',
            'Dubrovacko-Neretvanska',
            'Istarska',
            'Karlovacka',
            'Koprivnicko-Krizevacka',
            'Krapinsko-Zagorska',
            'Licko-Senjska',
            'Medimurska',
            'Osjecko-Baranjska',
            'Pozesko-Slavonska',
            'Primorsko-Goranska',
            'Sibensko-Kninska',
            'Sisacko-Moslavacka',
            'Splitsko-Dalmatinska',
            'Varazdinska',
            'Viroviticko-Podravska',
            'Vukovarsko-Srijemska',
            'Zadarska',
            'Zagreb',
            'Zagrebacka',
        ],
    },
    {
        country: 'Cuba',
        states: [
            'Camaguey',
            'Ciego de Avila',
            'Cienfuegos',
            'Ciudad de La Habana',
            'Granma',
            'Guantanamo',
            'Holguin',
            'Isla de la Juventud',
            'La Habana',
            'Las Tunas',
            'Matanzas',
            'Pinar del Rio',
            'Sancti Spiritus',
            'Santiago de Cuba',
            'Villa Clara',
        ],
    },
    {
        country: 'Cyprus',
        states: ['Famagusta', 'Kyrenia', 'Larnaca', 'Limassol', 'Nicosia', 'Paphos'],
    },
    {
        country: 'Czech Republic',
        states: [
            'Jihocesky Kraj',
            'Jihomoravsky Kraj',
            'Karlovarsky Kraj',
            'Kralovehradecky Kraj',
            'Liberecky Kraj',
            'Moravskoslezsky Kraj',
            'Olomoucky Kraj',
            'Pardubicky Kraj',
            'Plzensky Kraj',
            'Praha',
            'Stredocesky Kraj',
            'Ustecky Kraj',
            'Vysocina',
            'Zlinsky Kraj',
        ],
    },
    {
        country: 'Denmark',
        states: [
            'Arhus',
            'Bornholm',
            'Frederiksberg',
            'Frederiksborg',
            'Fyn',
            'Kobenhavn',
            'Kobenhavns',
            'Nordjylland',
            'Ribe',
            'Ringkobing',
            'Roskilde',
            'Sonderjylland',
            'Storstrom',
            'Vejle',
            'Vestsjalland',
            'Viborg',
        ],
    },
    {
        country: 'Djibouti',
        states: ['Ali Sabih', 'Dikhil', 'Djibouti', 'Obock', 'Tadjoura'],
    },
    {
        country: 'Dominica',
        states: [
            'Saint Andrew',
            'Saint David',
            'Saint George',
            'Saint John',
            'Saint Joseph',
            'Saint Luke',
            'Saint Mark',
            'Saint Patrick',
            'Saint Paul',
            'Saint Peter',
        ],
    },
    {
        country: 'Dominican Republic',
        states: [
            'Azua',
            'Baoruco',
            'Barahona',
            'Dajabon',
            'Distrito Nacional',
            'Duarte',
            'Elias Pina',
            'El Seibo',
            'Espaillat',
            'Hato Mayor',
            'Independencia',
            'La Altagracia',
            'La Romana',
            'La Vega',
            'Maria Trinidad Sanchez',
            'Monsenor Nouel',
            'Monte Cristi',
            'Monte Plata',
            'Pedernales',
            'Peravia',
            'Puerto Plata',
            'Salcedo',
            'Samana',
            'Sanchez Ramirez',
            'San Cristobal',
            'San Jose de Ocoa',
            'San Juan',
            'San Pedro de Macoris',
            'Santiago',
            'Santiago Rodriguez',
            'Santo Domingo',
            'Valverde',
        ],
    },
    {
        country: 'East Timor',
        states: [
            'Aileu',
            'Ainaro',
            'Baucau',
            'Bobonaro',
            'Cova-Lima',
            'Dili',
            'Ermera',
            'Lautem',
            'Liquica',
            'Manatuto',
            'Manufahi',
            'Oecussi',
            'Viqueque',
        ],
    },
    {
        country: 'Ecuador',
        states: [
            'Azuay',
            'Bolivar',
            'Canar',
            'Carchi',
            'Chimborazo',
            'Cotopaxi',
            'El Oro',
            'Esmeraldas',
            'Galapagos',
            'Guayas',
            'Imbabura',
            'Loja',
            'Los Rios',
            'Manabi',
            'Morona-Santiago',
            'Napo',
            'Orellana',
            'Pastaza',
            'Pichincha',
            'Sucumbios',
            'Tungurahua',
            'Zamora-Chinchipe',
        ],
    },
    {
        country: 'Egypt',
        states: [
            'Ad Daqahliyah',
            'Al Bahr al Ahmar',
            'Al Buhayrah',
            'Al Fayyum',
            'Al Gharbiyah',
            'Al Iskandariyah',
            "Al Isma'iliyah",
            'Al Jizah',
            'Al Minufiyah',
            'Al Minya',
            'Al Qahirah',
            'Al Qalyubiyah',
            'Al Wadi al Jadid',
            'Ash Sharqiyah',
            'As Suways',
            'Aswan',
            'Asyut',
            'Bani Suwayf',
            "Bur Sa'id",
            'Dumyat',
            "Janub Sina'",
            'Kafr ash Shaykh',
            'Matruh',
            'Qina',
            "Shamal Sina'",
            'Suhaj',
        ],
    },
    {
        country: 'El Salvador',
        states: [
            'Ahuachapan',
            'Cabanas',
            'Chalatenango',
            'Cuscatlan',
            'La Libertad',
            'La Paz',
            'La Union',
            'Morazan',
            'San Miguel',
            'San Salvador',
            'Santa Ana',
            'San Vicente',
            'Sonsonate',
            'Usulutan',
        ],
    },
    {
        country: 'Equatorial Guinea',
        states: ['Annobon', 'Bioko Norte', 'Bioko Sur', 'Centro Sur', 'Kie-Ntem', 'Litoral', 'Wele-Nzas'],
    },
    {
        country: 'Eritrea',
        states: ['Anseba', 'Debub', "Debubawi K'eyih Bahri", 'Gash Barka', "Ma'akel", 'Semenawi Keyih Bahri'],
    },
    {
        country: 'Estonia',
        states: [
            'Harjumaa (Tallinn)',
            'Hiiumaa (Kardla)',
            'Ida-Virumaa (Johvi)',
            'Jarvamaa (Paide)',
            'Jogevamaa (Jogeva)',
            'Laanemaa (Haapsalu)',
            'Laane-Virumaa (Rakvere)',
            'Parnumaa (Parnu)',
            'Polvamaa (Polva)',
            'Raplamaa (Rapla)',
            'Saaremaa (Kuressaare)',
            'Tartumaa (Tartu)',
            'Valgamaa (Valga)',
            'Viljandimaa (Viljandi)',
            'Vorumaa (Voru)',
        ],
    },
    {
        country: 'Ethiopia',
        states: [
            'Addis Ababa',
            'Afar',
            'Amhara',
            'Binshangul Gumuz',
            'Dire Dawa',
            'Gambela Hizboch',
            'Harari',
            'Oromia',
            'Somali',
            'Tigray',
            'Southern Nations, Nationalities, and Peoples Region',
        ],
    },
    {
        country: 'Fiji',
        states: ['Central (Suva)', 'Eastern (Levuka)', 'Northern (Labasa)', 'Rotuma', 'Western (Lautoka)'],
    },
    {
        country: 'Finland',
        states: ['Aland', 'Etela-Suomen Laani', 'Ita-Suomen Laani', 'Lansi-Suomen Laani', 'Lappi', 'Oulun Laani'],
    },
    {
        country: 'France',
        states: [
            'Alsace',
            'Aquitaine',
            'Auvergne',
            'Basse-Normandie',
            'Bourgogne',
            'Bretagne',
            'Centre',
            'Champagne-Ardenne',
            'Corse',
            'Franche-Comte',
            'Haute-Normandie',
            'Ile-de-France',
            'Languedoc-Roussillon',
            'Limousin',
            'Lorraine',
            'Midi-Pyrenees',
            'Nord-Pas-de-Calais',
            'Pays de la Loire',
            'Picardie',
            'Poitou-Charentes',
            "Provence-Alpes-Cote d'Azur",
            'Rhone-Alpes',
        ],
    },
    {
        country: 'Gabon',
        states: ['Estuaire', 'Haut-Ogooue', 'Moyen-Ogooue', 'Ngounie', 'Nyanga', 'Ogooue-Ivindo', 'Ogooue-Lolo', 'Ogooue-Maritime', 'Woleu-Ntem'],
    },
    {
        country: 'Gambia',
        states: ['Banjul', 'Central River', 'Lower River', 'North Bank', 'Upper River', 'Western'],
    },
    {
        country: 'Georgia',
        states: [],
    },
    {
        country: 'Germany',
        states: [
            'Baden-Wuerttemberg',
            'Bayern',
            'Berlin',
            'Brandenburg',
            'Bremen',
            'Hamburg',
            'Hessen',
            'Mecklenburg-Vorpommern',
            'Niedersachsen',
            'Nordrhein-Westfalen',
            'Rheinland-Pfalz',
            'Saarland',
            'Sachsen',
            'Sachsen-Anhalt',
            'Schleswig-Holstein',
            'Thueringen',
        ],
    },
    {
        country: 'Ghana',
        states: ['Ashanti', 'Brong-Ahafo', 'Central', 'Eastern', 'Greater Accra', 'Northern', 'Upper East', 'Upper West', 'Volta', 'Western'],
    },
    {
        country: 'Greece',
        states: [
            'Agion Oros',
            'Achaia',
            'Aitolia kai Akarmania',
            'Argolis',
            'Arkadia',
            'Arta',
            'Attiki',
            'Chalkidiki',
            'Chanion',
            'Chios',
            'Dodekanisos',
            'Drama',
            'Evros',
            'Evrytania',
            'Evvoia',
            'Florina',
            'Fokidos',
            'Fthiotis',
            'Grevena',
            'Ileia',
            'Imathia',
            'Ioannina',
            'Irakleion',
            'Karditsa',
            'Kastoria',
            'Kavala',
            'Kefallinia',
            'Kerkyra',
            'Kilkis',
            'Korinthia',
            'Kozani',
            'Kyklades',
            'Lakonia',
            'Larisa',
            'Lasithi',
            'Lefkas',
            'Lesvos',
            'Magnisia',
            'Messinia',
            'Pella',
            'Pieria',
            'Preveza',
            'Rethynnis',
            'Rodopi',
            'Samos',
            'Serrai',
            'Thesprotia',
            'Thessaloniki',
            'Trikala',
            'Voiotia',
            'Xanthi',
            'Zakynthos',
        ],
    },
    {
        country: 'Greenland',
        states: ['Avannaa (Nordgronland)', 'Tunu (Ostgronland)', 'Kitaa (Vestgronland)'],
    },
    {
        country: 'Grenada',
        states: ['Carriacou and Petit Martinique', 'Saint Andrew', 'Saint David', 'Saint George', 'Saint John', 'Saint Mark', 'Saint Patrick'],
    },
    {
        country: 'Guatemala',
        states: [
            'Alta Verapaz',
            'Baja Verapaz',
            'Chimaltenango',
            'Chiquimula',
            'El Progreso',
            'Escuintla',
            'Guatemala',
            'Huehuetenango',
            'Izabal',
            'Jalapa',
            'Jutiapa',
            'Peten',
            'Quetzaltenango',
            'Quiche',
            'Retalhuleu',
            'Sacatepequez',
            'San Marcos',
            'Santa Rosa',
            'Solola',
            'Suchitepequez',
            'Totonicapan',
            'Zacapa',
        ],
    },
    {
        country: 'Guinea',
        states: [
            'Beyla',
            'Boffa',
            'Boke',
            'Conakry',
            'Coyah',
            'Dabola',
            'Dalaba',
            'Dinguiraye',
            'Dubreka',
            'Faranah',
            'Forecariah',
            'Fria',
            'Gaoual',
            'Gueckedou',
            'Kankan',
            'Kerouane',
            'Kindia',
            'Kissidougou',
            'Koubia',
            'Koundara',
            'Kouroussa',
            'Labe',
            'Lelouma',
            'Lola',
            'Macenta',
            'Mali',
            'Mamou',
            'Mandiana',
            'Nzerekore',
            'Pita',
            'Siguiri',
            'Telimele',
            'Tougue',
            'Yomou',
        ],
    },
    {
        country: 'Guinea-Bissau',
        states: ['Bafata', 'Biombo', 'Bissau', 'Bolama', 'Cacheu', 'Gabu', 'Oio', 'Quinara', 'Tombali'],
    },
    {
        country: 'Guyana',
        states: [
            'Barima-Waini',
            'Cuyuni-Mazaruni',
            'Demerara-Mahaica',
            'East Berbice-Corentyne',
            'Essequibo Islands-West Demerara',
            'Mahaica-Berbice',
            'Pomeroon-Supenaam',
            'Potaro-Siparuni',
            'Upper Demerara-Berbice',
            'Upper Takutu-Upper Essequibo',
        ],
    },
    {
        country: 'Haiti',
        states: ['Artibonite', 'Centre', "Grand 'Anse", 'Nord', 'Nord-Est', 'Nord-Ouest', 'Ouest', 'Sud', 'Sud-Est'],
    },
    {
        country: 'Honduras',
        states: [
            'Atlantida',
            'Choluteca',
            'Colon',
            'Comayagua',
            'Copan',
            'Cortes',
            'El Paraiso',
            'Francisco Morazan',
            'Gracias a Dios',
            'Intibuca',
            'Islas de la Bahia',
            'La Paz',
            'Lempira',
            'Ocotepeque',
            'Olancho',
            'Santa Barbara',
            'Valle',
            'Yoro',
        ],
    },
    {
        country: 'Hong Kong',
        states: [],
    },
    {
        country: 'Hungary',
        states: [
            'Bacs-Kiskun',
            'Baranya',
            'Bekes',
            'Borsod-Abauj-Zemplen',
            'Csongrad',
            'Fejer',
            'Gyor-Moson-Sopron',
            'Hajdu-Bihar',
            'Heves',
            'Jasz-Nagykun-Szolnok',
            'Komarom-Esztergom',
            'Nograd',
            'Pest',
            'Somogy',
            'Szabolcs-Szatmar-Bereg',
            'Tolna',
            'Vas',
            'Veszprem',
            'Zala',
            'Bekescsaba',
            'Debrecen',
            'Dunaujvaros',
            'Eger',
            'Gyor',
            'Hodmezovasarhely',
            'Kaposvar',
            'Kecskemet',
            'Miskolc',
            'Nagykanizsa',
            'Nyiregyhaza',
            'Pecs',
            'Sopron',
            'Szeged',
            'Szekesfehervar',
            'Szolnok',
            'Szombathely',
            'Tatabanya',
            'Veszprem',
            'Zalaegerszeg',
        ],
    },
    {
        country: 'Iceland',
        states: ['Austurland', 'Hofudhborgarsvaedhi', 'Nordhurland Eystra', 'Nordhurland Vestra', 'Sudhurland', 'Sudhurnes', 'Vestfirdhir', 'Vesturland'],
    },
    {
        country: 'India',
        states: [
            'Andaman and Nicobar Islands',
            'Andhra Pradesh',
            'Arunachal Pradesh',
            'Assam',
            'Bihar',
            'Chandigarh',
            'Chhattisgarh',
            'Dadra and Nagar Haveli',
            'Daman and Diu',
            'Delhi',
            'Goa',
            'Gujarat',
            'Haryana',
            'Himachal Pradesh',
            'Jammu and Kashmir',
            'Jharkhand',
            'Karnataka',
            'Kerala',
            'Lakshadweep',
            'Madhya Pradesh',
            'Maharashtra',
            'Manipur',
            'Meghalaya',
            'Mizoram',
            'Nagaland',
            'Orissa',
            'Pondicherry',
            'Punjab',
            'Rajasthan',
            'Sikkim',
            'Tamil Nadu',
            'Tripura',
            'Uttaranchal',
            'Uttar Pradesh',
            'West Bengal',
        ],
    },
    {
        country: 'Indonesia',
        states: [
            'Aceh',
            'Bali',
            'Banten',
            'Bengkulu',
            'Gorontalo',
            'Irian Jaya Barat',
            'Jakarta Raya',
            'Jambi',
            'Jawa Barat',
            'Jawa Tengah',
            'Jawa Timur',
            'Kalimantan Barat',
            'Kalimantan Selatan',
            'Kalimantan Tengah',
            'Kalimantan Timur',
            'Kepulauan Bangka Belitung',
            'Kepulauan Riau',
            'Lampung',
            'Maluku',
            'Maluku Utara',
            'Nusa Tenggara Barat',
            'Nusa Tenggara Timur',
            'Papua',
            'Riau',
            'Sulawesi Barat',
            'Sulawesi Selatan',
            'Sulawesi Tengah',
            'Sulawesi Tenggara',
            'Sulawesi Utara',
            'Sumatera Barat',
            'Sumatera Selatan',
            'Sumatera Utara',
            'Yogyakarta',
        ],
    },
    {
        country: 'Iran',
        states: [
            'Ardabil',
            'Azarbayjan-e Gharbi',
            'Azarbayjan-e Sharqi',
            'Bushehr',
            'Chahar Mahall va Bakhtiari',
            'Esfahan',
            'Fars',
            'Gilan',
            'Golestan',
            'Hamadan',
            'Hormozgan',
            'Ilam',
            'Kerman',
            'Kermanshah',
            'Khorasan-e Janubi',
            'Khorasan-e Razavi',
            'Khorasan-e Shemali',
            'Khuzestan',
            'Kohgiluyeh va Buyer Ahmad',
            'Kordestan',
            'Lorestan',
            'Markazi',
            'Mazandaran',
            'Qazvin',
            'Qom',
            'Semnan',
            'Sistan va Baluchestan',
            'Tehran',
            'Yazd',
            'Zanjan',
        ],
    },
    {
        country: 'Iraq',
        states: [
            'Al Anbar',
            'Al Basrah',
            'Al Muthanna',
            'Al Qadisiyah',
            'An Najaf',
            'Arbil',
            'As Sulaymaniyah',
            "At Ta'mim",
            'Babil',
            'Baghdad',
            'Dahuk',
            'Dhi Qar',
            'Diyala',
            "Karbala'",
            'Maysan',
            'Ninawa',
            'Salah ad Din',
            'Wasit',
        ],
    },
    {
        country: 'Ireland',
        states: [
            'Carlow',
            'Cavan',
            'Clare',
            'Cork',
            'Donegal',
            'Dublin',
            'Galway',
            'Kerry',
            'Kildare',
            'Kilkenny',
            'Laois',
            'Leitrim',
            'Limerick',
            'Longford',
            'Louth',
            'Mayo',
            'Meath',
            'Monaghan',
            'Offaly',
            'Roscommon',
            'Sligo',
            'Tipperary',
            'Waterford',
            'Westmeath',
            'Wexford',
            'Wicklow',
        ],
    },
    {
        country: 'Israel',
        states: ['Central', 'Haifa', 'Jerusalem', 'Northern', 'Southern', 'Tel Aviv'],
    },
    {
        country: 'Italy',
        states: [
            'Abruzzo',
            'Basilicata',
            'Calabria',
            'Campania',
            'Emilia-Romagna',
            'Friuli-Venezia Giulia',
            'Lazio',
            'Liguria',
            'Lombardia',
            'Marche',
            'Molise',
            'Piemonte',
            'Puglia',
            'Sardegna',
            'Sicilia',
            'Toscana',
            'Trentino-Alto Adige',
            'Umbria',
            "Valle d'Aosta",
            'Veneto',
        ],
    },
    {
        country: 'Jamaica',
        states: [
            'Clarendon',
            'Hanover',
            'Kingston',
            'Manchester',
            'Portland',
            'Saint Andrew',
            'Saint Ann',
            'Saint Catherine',
            'Saint Elizabeth',
            'Saint James',
            'Saint Mary',
            'Saint Thomas',
            'Trelawny',
            'Westmoreland',
        ],
    },
    {
        country: 'Japan',
        states: [
            'Aichi',
            'Akita',
            'Aomori',
            'Chiba',
            'Ehime',
            'Fukui',
            'Fukuoka',
            'Fukushima',
            'Gifu',
            'Gumma',
            'Hiroshima',
            'Hokkaido',
            'Hyogo',
            'Ibaraki',
            'Ishikawa',
            'Iwate',
            'Kagawa',
            'Kagoshima',
            'Kanagawa',
            'Kochi',
            'Kumamoto',
            'Kyoto',
            'Mie',
            'Miyagi',
            'Miyazaki',
            'Nagano',
            'Nagasaki',
            'Nara',
            'Niigata',
            'Oita',
            'Okayama',
            'Okinawa',
            'Osaka',
            'Saga',
            'Saitama',
            'Shiga',
            'Shimane',
            'Shizuoka',
            'Tochigi',
            'Tokushima',
            'Tokyo',
            'Tottori',
            'Toyama',
            'Wakayama',
            'Yamagata',
            'Yamaguchi',
            'Yamanashi',
        ],
    },
    {
        country: 'Jordan',
        states: ['Ajlun', "Al 'Aqabah", "Al Balqa'", 'Al Karak', 'Al Mafraq', "'Amman", 'At Tafilah', "Az Zarqa'", 'Irbid', 'Jarash', "Ma'an", 'Madaba'],
    },
    {
        country: 'Kazakhstan',
        states: [
            'Almaty Oblysy',
            'Almaty Qalasy',
            'Aqmola Oblysy',
            'Aqtobe Oblysy',
            'Astana Qalasy',
            'Atyrau Oblysy',
            'Batys Qazaqstan Oblysy',
            'Bayqongyr Qalasy',
            'Mangghystau Oblysy',
            'Ongtustik Qazaqstan Oblysy',
            'Pavlodar Oblysy',
            'Qaraghandy Oblysy',
            'Qostanay Oblysy',
            'Qyzylorda Oblysy',
            'Shyghys Qazaqstan Oblysy',
            'Soltustik Qazaqstan Oblysy',
            'Zhambyl Oblysy',
        ],
    },
    {
        country: 'Kenya',
        states: ['Central', 'Coast', 'Eastern', 'Nairobi Area', 'North Eastern', 'Nyanza', 'Rift Valley', 'Western'],
    },
    {
        country: 'Kiribati',
        states: [],
    },
    {
        country: 'Korea North',
        states: [
            'Chagang',
            'North Hamgyong',
            'South Hamgyong',
            'North Hwanghae',
            'South Hwanghae',
            'Kangwon',
            "North P'yongan",
            "South P'yongan",
            'Yanggang',
            'Kaesong',
            'Najin',
            "Namp'o",
            'Pyongyang',
        ],
    },
    {
        country: 'Korea South',
        states: [
            'Seoul',
            'Busan City',
            'Daegu City',
            'Incheon City',
            'Gwangju City',
            'Daejeon City',
            'Ulsan',
            'Gyeonggi Province',
            'Gangwon Province',
            'North Chungcheong Province',
            'South Chungcheong Province',
            'North Jeolla Province',
            'South Jeolla Province',
            'North Gyeongsang Province',
            'South Gyeongsang Province',
            'Jeju',
        ],
    },
    {
        country: 'Kuwait',
        states: ['Al Ahmadi', 'Al Farwaniyah', 'Al Asimah', 'Al Jahra', 'Hawalli', 'Mubarak Al-Kabeer'],
    },
    {
        country: 'Kyrgyzstan',
        states: [
            'Batken Oblasty',
            'Bishkek Shaary',
            'Chuy Oblasty',
            'Jalal-Abad Oblasty',
            'Naryn Oblasty',
            'Osh Oblasty',
            'Talas Oblasty',
            'Ysyk-Kol Oblasty',
        ],
    },
    {
        country: 'Laos',
        states: [
            'Attapu',
            'Bokeo',
            'Bolikhamxai',
            'Champasak',
            'Houaphan',
            'Khammouan',
            'Louangnamtha',
            'Louangphrabang',
            'Oudomxai',
            'Phongsali',
            'Salavan',
            'Savannakhet',
            'Viangchan',
            'Viangchan',
            'Xaignabouli',
            'Xaisomboun',
            'Xekong',
            'Xiangkhoang',
        ],
    },
    {
        country: 'Latvia',
        states: [
            'Aizkraukles Rajons',
            'Aluksnes Rajons',
            'Balvu Rajons',
            'Bauskas Rajons',
            'Cesu Rajons',
            'Daugavpils',
            'Daugavpils Rajons',
            'Dobeles Rajons',
            'Gulbenes Rajons',
            'Jekabpils Rajons',
            'Jelgava',
            'Jelgavas Rajons',
            'Jurmala',
            'Kraslavas Rajons',
            'Kuldigas Rajons',
            'Liepaja',
            'Liepajas Rajons',
            'Limbazu Rajons',
            'Ludzas Rajons',
            'Madonas Rajons',
            'Ogres Rajons',
            'Preilu Rajons',
            'Rezekne',
            'Rezeknes Rajons',
            'Riga',
            'Rigas Rajons',
            'Saldus Rajons',
            'Talsu Rajons',
            'Tukuma Rajons',
            'Valkas Rajons',
            'Valmieras Rajons',
            'Ventspils',
            'Ventspils Rajons',
        ],
    },
    {
        country: 'Lebanon',
        states: ['Beyrouth', 'Beqaa', 'Liban-Nord', 'Liban-Sud', 'Mont-Liban', 'Nabatiye'],
    },
    {
        country: 'Lesotho',
        states: ['Berea', 'Butha-Buthe', 'Leribe', 'Mafeteng', 'Maseru', "Mohale's Hoek", 'Mokhotlong', "Qacha's Nek", 'Quthing', 'Thaba-Tseka'],
    },
    {
        country: 'Liberia',
        states: [
            'Bomi',
            'Bong',
            'Gbarpolu',
            'Grand Bassa',
            'Grand Cape Mount',
            'Grand Gedeh',
            'Grand Kru',
            'Lofa',
            'Margibi',
            'Maryland',
            'Montserrado',
            'Nimba',
            'River Cess',
            'River Gee',
            'Sinoe',
        ],
    },
    {
        country: 'Libya',
        states: [
            'Ajdabiya',
            "Al 'Aziziyah",
            'Al Fatih',
            'Al Jabal al Akhdar',
            'Al Jufrah',
            'Al Khums',
            'Al Kufrah',
            'An Nuqat al Khams',
            "Ash Shati'",
            'Awbari',
            'Az Zawiyah',
            'Banghazi',
            'Darnah',
            'Ghadamis',
            'Gharyan',
            'Misratah',
            'Murzuq',
            'Sabha',
            'Sawfajjin',
            'Surt',
            'Tarabulus',
            'Tarhunah',
            'Tubruq',
            'Yafran',
            'Zlitan',
        ],
    },
    {
        country: 'Liechtenstein',
        states: ['Balzers', 'Eschen', 'Gamprin', 'Mauren', 'Planken', 'Ruggell', 'Schaan', 'Schellenberg', 'Triesen', 'Triesenberg', 'Vaduz'],
    },
    {
        country: 'Lithuania',
        states: ['Alytaus', 'Kauno', 'Klaipedos', 'Marijampoles', 'Panevezio', 'Siauliu', 'Taurages', 'Telsiu', 'Utenos', 'Vilniaus'],
    },
    {
        country: 'Luxembourg',
        states: ['Diekirch', 'Grevenmacher', 'Luxembourg'],
    },
    {
        country: 'Macedonia',
        states: [
            'Aerodrom',
            'Aracinovo',
            'Berovo',
            'Bitola',
            'Bogdanci',
            'Bogovinje',
            'Bosilovo',
            'Brvenica',
            'Butel',
            'Cair',
            'Caska',
            'Centar',
            'Centar Zupa',
            'Cesinovo',
            'Cucer-Sandevo',
            'Debar',
            'Debartsa',
            'Delcevo',
            'Demir Hisar',
            'Demir Kapija',
            'Dojran',
            'Dolneni',
            'Drugovo',
            'Gazi Baba',
            'Gevgelija',
            'Gjorce Petrov',
            'Gostivar',
            'Gradsko',
            'Ilinden',
            'Jegunovce',
            'Karbinci',
            'Karpos',
            'Kavadarci',
            'Kicevo',
            'Kisela Voda',
            'Kocani',
            'Konce',
            'Kratovo',
            'Kriva Palanka',
            'Krivogastani',
            'Krusevo',
            'Kumanovo',
            'Lipkovo',
            'Lozovo',
            'Makedonska Kamenica',
            'Makedonski Brod',
            'Mavrovo i Rastusa',
            'Mogila',
            'Negotino',
            'Novaci',
            'Novo Selo',
            'Ohrid',
            'Oslomej',
            'Pehcevo',
            'Petrovec',
            'Plasnica',
            'Prilep',
            'Probistip',
            'Radovis',
            'Rankovce',
            'Resen',
            'Rosoman',
            'Saraj',
            'Skopje',
            'Sopiste',
            'Staro Nagoricane',
            'Stip',
            'Struga',
            'Strumica',
            'Studenicani',
            'Suto Orizari',
            'Sveti Nikole',
            'Tearce',
            'Tetovo',
            'Valandovo',
            'Vasilevo',
            'Veles',
            'Vevcani',
            'Vinica',
            'Vranestica',
            'Vrapciste',
            'Zajas',
            'Zelenikovo',
            'Zelino',
            'Zrnovci',
        ],
    },
    {
        country: 'Madagascar',
        states: ['Antananarivo', 'Antsiranana', 'Fianarantsoa', 'Mahajanga', 'Toamasina', 'Toliara'],
    },
    {
        country: 'Malawi',
        states: [
            'Balaka',
            'Blantyre',
            'Chikwawa',
            'Chiradzulu',
            'Chitipa',
            'Dedza',
            'Dowa',
            'Karonga',
            'Kasungu',
            'Likoma',
            'Lilongwe',
            'Machinga',
            'Mangochi',
            'Mchinji',
            'Mulanje',
            'Mwanza',
            'Mzimba',
            'Ntcheu',
            'Nkhata Bay',
            'Nkhotakota',
            'Nsanje',
            'Ntchisi',
            'Phalombe',
            'Rumphi',
            'Salima',
            'Thyolo',
            'Zomba',
        ],
    },
    {
        country: 'Malaysia',
        states: [
            'Johor',
            'Kedah',
            'Kelantan',
            'Kuala Lumpur',
            'Labuan',
            'Malacca',
            'Negeri Sembilan',
            'Pahang',
            'Perak',
            'Perlis',
            'Penang',
            'Sabah',
            'Sarawak',
            'Selangor',
            'Terengganu',
        ],
    },
    {
        country: 'Maldives',
        states: [
            'Alifu',
            'Baa',
            'Dhaalu',
            'Faafu',
            'Gaafu Alifu',
            'Gaafu Dhaalu',
            'Gnaviyani',
            'Haa Alifu',
            'Haa Dhaalu',
            'Kaafu',
            'Laamu',
            'Lhaviyani',
            'Maale',
            'Meemu',
            'Noonu',
            'Raa',
            'Seenu',
            'Shaviyani',
            'Thaa',
            'Vaavu',
        ],
    },
    {
        country: 'Mali',
        states: ['Bamako (Capital)', 'Gao', 'Kayes', 'Kidal', 'Koulikoro', 'Mopti', 'Segou', 'Sikasso', 'Tombouctou'],
    },
    {
        country: 'Malta',
        states: [],
    },
    {
        country: 'Marshall Islands',
        states: [],
    },
    {
        country: 'Mauritania',
        states: [
            'Adrar',
            'Assaba',
            'Brakna',
            'Dakhlet Nouadhibou',
            'Gorgol',
            'Guidimaka',
            'Hodh Ech Chargui',
            'Hodh El Gharbi',
            'Inchiri',
            'Nouakchott',
            'Tagant',
            'Tiris Zemmour',
            'Trarza',
        ],
    },
    {
        country: 'Mauritius',
        states: [
            'Agalega Islands',
            'Black River',
            'Cargados Carajos Shoals',
            'Flacq',
            'Grand Port',
            'Moka',
            'Pamplemousses',
            'Plaines Wilhems',
            'Port Louis',
            'Riviere du Rempart',
            'Rodrigues',
            'Savanne',
        ],
    },
    {
        country: 'Mexico',
        states: [
            'Aguascalientes',
            'Baja California',
            'Baja California Sur',
            'Campeche',
            'Chiapas',
            'Chihuahua',
            'Coahuila de Zaragoza',
            'Colima',
            'Distrito Federal',
            'Durango',
            'Guanajuato',
            'Guerrero',
            'Hidalgo',
            'Jalisco',
            'Mexico',
            'Michoacan de Ocampo',
            'Morelos',
            'Nayarit',
            'Nuevo Leon',
            'Oaxaca',
            'Puebla',
            'Queretaro de Arteaga',
            'Quintana Roo',
            'San Luis Potosi',
            'Sinaloa',
            'Sonora',
            'Tabasco',
            'Tamaulipas',
            'Tlaxcala',
            'Veracruz-Llave',
            'Yucatan',
            'Zacatecas',
        ],
    },
    {
        country: 'Micronesia',
        states: [],
    },
    {
        country: 'Moldova',
        states: [
            'Anenii Noi',
            'Basarabeasca',
            'Briceni',
            'Cahul',
            'Cantemir',
            'Calarasi',
            'Causeni',
            'Cimislia',
            'Criuleni',
            'Donduseni',
            'Drochia',
            'Dubasari',
            'Edinet',
            'Falesti',
            'Floresti',
            'Glodeni',
            'Hincesti',
            'Ialoveni',
            'Leova',
            'Nisporeni',
            'Ocnita',
            'Orhei',
            'Rezina',
            'Riscani',
            'Singerei',
            'Soldanesti',
            'Soroca',
            'Stefan-Voda',
            'Straseni',
            'Taraclia',
            'Telenesti',
            'Ungheni',
            'Balti',
            'Bender',
            'Chisinau',
            'Gagauzia',
            'Stinga Nistrului',
        ],
    },
    {
        country: 'Mongolia',
        states: [
            'Arhangay',
            'Bayanhongor',
            'Bayan-Olgiy',
            'Bulgan',
            'Darhan Uul',
            'Dornod',
            'Dornogovi',
            'Dundgovi',
            'Dzavhan',
            'Govi-Altay',
            'Govi-Sumber',
            'Hentiy',
            'Hovd',
            'Hovsgol',
            'Omnogovi',
            'Orhon',
            'Ovorhangay',
            'Selenge',
            'Suhbaatar',
            'Tov',
            'Ulaanbaatar',
            'Uvs',
        ],
    },
    {
        country: 'Morocco',
        states: [
            'Agadir',
            'Al Hoceima',
            'Azilal',
            'Beni Mellal',
            'Ben Slimane',
            'Boulemane',
            'Casablanca',
            'Chaouen',
            'El Jadida',
            'El Kelaa des Sraghna',
            'Er Rachidia',
            'Essaouira',
            'Fes',
            'Figuig',
            'Guelmim',
            'Ifrane',
            'Kenitra',
            'Khemisset',
            'Khenifra',
            'Khouribga',
            'Laayoune',
            'Larache',
            'Marrakech',
            'Meknes',
            'Nador',
            'Ouarzazate',
            'Oujda',
            'Rabat-Sale',
            'Safi',
            'Settat',
            'Sidi Kacem',
            'Tangier',
            'Tan-Tan',
            'Taounate',
            'Taroudannt',
            'Tata',
            'Taza',
            'Tetouan',
            'Tiznit',
        ],
    },
    {
        country: 'Monaco',
        states: [],
    },
    {
        country: 'Mozambique',
        states: ['Cabo Delgado', 'Gaza', 'Inhambane', 'Manica', 'Maputo', 'Cidade de Maputo', 'Nampula', 'Niassa', 'Sofala', 'Tete', 'Zambezia'],
    },
    {
        country: 'Namibia',
        states: [
            'Caprivi',
            'Erongo',
            'Hardap',
            'Karas',
            'Khomas',
            'Kunene',
            'Ohangwena',
            'Okavango',
            'Omaheke',
            'Omusati',
            'Oshana',
            'Oshikoto',
            'Otjozondjupa',
        ],
    },
    {
        country: 'Nauru',
        states: [],
    },
    {
        country: 'Nepal',
        states: [
            'Bagmati',
            'Bheri',
            'Dhawalagiri',
            'Gandaki',
            'Janakpur',
            'Karnali',
            'Kosi',
            'Lumbini',
            'Mahakali',
            'Mechi',
            'Narayani',
            'Rapti',
            'Sagarmatha',
            'Seti',
        ],
    },
    {
        country: 'Netherlands',
        states: [
            'Drenthe',
            'Flevoland',
            'Friesland',
            'Gelderland',
            'Groningen',
            'Limburg',
            'Noord-Brabant',
            'Noord-Holland',
            'Overijssel',
            'Utrecht',
            'Zeeland',
            'Zuid-Holland',
        ],
    },
    {
        country: 'New Zealand',
        states: [
            'Auckland',
            'Bay of Plenty',
            'Canterbury',
            'Chatham Islands',
            'Gisborne',
            "Hawke's Bay",
            'Manawatu-Wanganui',
            'Marlborough',
            'Nelson',
            'Northland',
            'Otago',
            'Southland',
            'Taranaki',
            'Tasman',
            'Waikato',
            'Wellington',
            'West Coast',
        ],
    },
    {
        country: 'Nicaragua',
        states: [
            'Atlantico Norte',
            'Atlantico Sur',
            'Boaco',
            'Carazo',
            'Chinandega',
            'Chontales',
            'Esteli',
            'Granada',
            'Jinotega',
            'Leon',
            'Madriz',
            'Managua',
            'Masaya',
            'Matagalpa',
            'Nueva Segovia',
            'Rio San Juan',
            'Rivas',
        ],
    },
    {
        country: 'Niger',
        states: ['Agadez', 'Diffa', 'Dosso', 'Maradi', 'Niamey', 'Tahoua', 'Tillaberi', 'Zinder'],
    },
    {
        country: 'Nigeria',
        states: [
            'Abia',
            'Abuja Federal Capital',
            'Adamawa',
            'Akwa Ibom',
            'Anambra',
            'Bauchi',
            'Bayelsa',
            'Benue',
            'Borno',
            'Cross River',
            'Delta',
            'Ebonyi',
            'Edo',
            'Ekiti',
            'Enugu',
            'Gombe',
            'Imo',
            'Jigawa',
            'Kaduna',
            'Kano',
            'Katsina',
            'Kebbi',
            'Kogi',
            'Kwara',
            'Lagos',
            'Nassarawa',
            'Niger',
            'Ogun',
            'Ondo',
            'Osun',
            'Oyo',
            'Plateau',
            'Rivers',
            'Sokoto',
            'Taraba',
            'Yobe',
            'Zamfara',
        ],
    },
    {
        country: 'Norway',
        states: [
            'Akershus',
            'Aust-Agder',
            'Buskerud',
            'Finnmark',
            'Hedmark',
            'Hordaland',
            'More og Romsdal',
            'Nordland',
            'Nord-Trondelag',
            'Oppland',
            'Oslo',
            'Ostfold',
            'Rogaland',
            'Sogn og Fjordane',
            'Sor-Trondelag',
            'Telemark',
            'Troms',
            'Vest-Agder',
            'Vestfold',
        ],
    },
    {
        country: 'Oman',
        states: ['Ad Dakhiliyah', 'Al Batinah', 'Al Wusta', 'Ash Sharqiyah', 'Az Zahirah', 'Masqat', 'Musandam', 'Dhofar'],
    },
    {
        country: 'Pakistan',
        states: ['Balochistan', 'North-West Frontier Province', 'Punjab', 'Sindh', 'Islamabad Capital Territory', 'Federally Administered Tribal Areas'],
    },
    {
        country: 'Panama',
        states: ['Bocas del Toro', 'Chiriqui', 'Cocle', 'Colon', 'Darien', 'Herrera', 'Los Santos', 'Panama', 'San Blas', 'Veraguas'],
    },
    {
        country: 'Papua New Guinea',
        states: [
            'Bougainville',
            'Central',
            'Chimbu',
            'Eastern Highlands',
            'East New Britain',
            'East Sepik',
            'Enga',
            'Gulf',
            'Madang',
            'Manus',
            'Milne Bay',
            'Morobe',
            'National Capital',
            'New Ireland',
            'Northern',
            'Sandaun',
            'Southern Highlands',
            'Western',
            'Western Highlands',
            'West New Britain',
        ],
    },
    {
        country: 'Paraguay',
        states: [
            'Alto Paraguay',
            'Alto Parana',
            'Amambay',
            'Asuncion',
            'Boqueron',
            'Caaguazu',
            'Caazapa',
            'Canindeyu',
            'Central',
            'Concepcion',
            'Cordillera',
            'Guaira',
            'Itapua',
            'Misiones',
            'Neembucu',
            'Paraguari',
            'Presidente Hayes',
            'San Pedro',
        ],
    },
    {
        country: 'Peru',
        states: [
            'Amazonas',
            'Ancash',
            'Apurimac',
            'Arequipa',
            'Ayacucho',
            'Cajamarca',
            'Callao',
            'Cusco',
            'Huancavelica',
            'Huanuco',
            'Ica',
            'Junin',
            'La Libertad',
            'Lambayeque',
            'Lima',
            'Loreto',
            'Madre de Dios',
            'Moquegua',
            'Pasco',
            'Piura',
            'Puno',
            'San Martin',
            'Tacna',
            'Tumbes',
            'Ucayali',
        ],
    },
    {
        country: 'Philippines',
        states: [
            'Abra',
            'Agusan del Norte',
            'Agusan del Sur',
            'Aklan',
            'Albay',
            'Antique',
            'Apayao',
            'Aurora',
            'Basilan',
            'Bataan',
            'Batanes',
            'Batangas',
            'Biliran',
            'Benguet',
            'Bohol',
            'Bukidnon',
            'Bulacan',
            'Cagayan',
            'Camarines Norte',
            'Camarines Sur',
            'Camiguin',
            'Capiz',
            'Catanduanes',
            'Cavite',
            'Cebu',
            'Compostela',
            'Davao del Norte',
            'Davao del Sur',
            'Davao Oriental',
            'Eastern Samar',
            'Guimaras',
            'Ifugao',
            'Ilocos Norte',
            'Ilocos Sur',
            'Iloilo',
            'Isabela',
            'Kalinga',
            'Laguna',
            'Lanao del Norte',
            'Lanao del Sur',
            'La Union',
            'Leyte',
            'Maguindanao',
            'Marinduque',
            'Masbate',
            'Mindoro Occidental',
            'Mindoro Oriental',
            'Misamis Occidental',
            'Misamis Oriental',
            'Mountain Province',
            'Negros Occidental',
            'Negros Oriental',
            'North Cotabato',
            'Northern Samar',
            'Nueva Ecija',
            'Nueva Vizcaya',
            'Palawan',
            'Pampanga',
            'Pangasinan',
            'Quezon',
            'Quirino',
            'Rizal',
            'Romblon',
            'Samar',
            'Sarangani',
            'Siquijor',
            'Sorsogon',
            'South Cotabato',
            'Southern Leyte',
            'Sultan Kudarat',
            'Sulu',
            'Surigao del Norte',
            'Surigao del Sur',
            'Tarlac',
            'Tawi-Tawi',
            'Zambales',
            'Zamboanga del Norte',
            'Zamboanga del Sur',
            'Zamboanga Sibugay',
        ],
    },
    {
        country: 'Poland',
        states: [
            'Greater Poland (Wielkopolskie)',
            'Kuyavian-Pomeranian (Kujawsko-Pomorskie)',
            'Lesser Poland (Malopolskie)',
            'Lodz (Lodzkie)',
            'Lower Silesian (Dolnoslaskie)',
            'Lublin (Lubelskie)',
            'Lubusz (Lubuskie)',
            'Masovian (Mazowieckie)',
            'Opole (Opolskie)',
            'Podlasie (Podlaskie)',
            'Pomeranian (Pomorskie)',
            'Silesian (Slaskie)',
            'Subcarpathian (Podkarpackie)',
            'Swietokrzyskie (Swietokrzyskie)',
            'Warmian-Masurian (Warminsko-Mazurskie)',
            'West Pomeranian (Zachodniopomorskie)',
        ],
    },
    {
        country: 'Portugal',
        states: [
            'Aveiro',
            'Acores',
            'Beja',
            'Braga',
            'Braganca',
            'Castelo Branco',
            'Coimbra',
            'Evora',
            'Faro',
            'Guarda',
            'Leiria',
            'Lisboa',
            'Madeira',
            'Portalegre',
            'Porto',
            'Santarem',
            'Setubal',
            'Viana do Castelo',
            'Vila Real',
            'Viseu',
        ],
    },
    {
        country: 'Qatar',
        states: [
            'Ad Dawhah',
            'Al Ghuwayriyah',
            'Al Jumayliyah',
            'Al Khawr',
            'Al Wakrah',
            'Ar Rayyan',
            'Jarayan al Batinah',
            'Madinat ash Shamal',
            "Umm Sa'id",
            'Umm Salal',
        ],
    },
    {
        country: 'Romania',
        states: [
            'Alba',
            'Arad',
            'Arges',
            'Bacau',
            'Bihor',
            'Bistrita-Nasaud',
            'Botosani',
            'Braila',
            'Brasov',
            'Bucuresti',
            'Buzau',
            'Calarasi',
            'Caras-Severin',
            'Cluj',
            'Constanta',
            'Covasna',
            'Dimbovita',
            'Dolj',
            'Galati',
            'Gorj',
            'Giurgiu',
            'Harghita',
            'Hunedoara',
            'Ialomita',
            'Iasi',
            'Ilfov',
            'Maramures',
            'Mehedinti',
            'Mures',
            'Neamt',
            'Olt',
            'Prahova',
            'Salaj',
            'Satu Mare',
            'Sibiu',
            'Suceava',
            'Teleorman',
            'Timis',
            'Tulcea',
            'Vaslui',
            'Vilcea',
            'Vrancea',
        ],
    },
    {
        country: 'Russia',
        states: [
            'Amur',
            "Arkhangel'sk",
            "Astrakhan'",
            'Belgorod',
            'Bryansk',
            'Chelyabinsk',
            'Chita',
            'Irkutsk',
            'Ivanovo',
            'Kaliningrad',
            'Kaluga',
            'Kamchatka',
            'Kemerovo',
            'Kirov',
            'Kostroma',
            'Kurgan',
            'Kursk',
            'Leningrad',
            'Lipetsk',
            'Magadan',
            'Moscow',
            'Murmansk',
            'Nizhniy Novgorod',
            'Novgorod',
            'Novosibirsk',
            'Omsk',
            'Orenburg',
            'Orel',
            'Penza',
            "Perm'",
            'Pskov',
            'Rostov',
            "Ryazan'",
            'Sakhalin',
            'Samara',
            'Saratov',
            'Smolensk',
            'Sverdlovsk',
            'Tambov',
            'Tomsk',
            'Tula',
            "Tver'",
            "Tyumen'",
            "Ul'yanovsk",
            'Vladimir',
            'Volgograd',
            'Vologda',
            'Voronezh',
            "Yaroslavl'",
            'Adygeya',
            'Altay',
            'Bashkortostan',
            'Buryatiya',
            'Chechnya',
            'Chuvashiya',
            'Dagestan',
            'Ingushetiya',
            'Kabardino-Balkariya',
            'Kalmykiya',
            'Karachayevo-Cherkesiya',
            'Kareliya',
            'Khakasiya',
            'Komi',
            'Mariy-El',
            'Mordoviya',
            'Sakha',
            'North Ossetia',
            'Tatarstan',
            'Tyva',
            'Udmurtiya',
            'Aga Buryat',
            'Chukotka',
            'Evenk',
            'Khanty-Mansi',
            'Komi-Permyak',
            'Koryak',
            'Nenets',
            'Taymyr',
            "Ust'-Orda Buryat",
            'Yamalo-Nenets',
            'Altay',
            'Khabarovsk',
            'Krasnodar',
            'Krasnoyarsk',
            'Primorskiy',
            "Stavropol'",
            'Moscow',
            'St. Petersburg',
            'Yevrey',
        ],
    },
    {
        country: 'Rwanda',
        states: [
            'Butare',
            'Byumba',
            'Cyangugu',
            'Gikongoro',
            'Gisenyi',
            'Gitarama',
            'Kibungo',
            'Kibuye',
            'Kigali Rurale',
            'Kigali-ville',
            'Umutara',
            'Ruhengeri',
        ],
    },
    {
        country: 'Samoa',
        states: [
            "A'ana",
            'Aiga-i-le-Tai',
            'Atua',
            "Fa'asaleleaga",
            "Gaga'emauga",
            'Gagaifomauga',
            'Palauli',
            "Satupa'itea",
            'Tuamasaga',
            "Va'a-o-Fonoti",
            'Vaisigano',
        ],
    },
    {
        country: 'San Marino',
        states: ['Acquaviva', 'Borgo Maggiore', 'Chiesanuova', 'Domagnano', 'Faetano', 'Fiorentino', 'Montegiardino', 'San Marino Citta', 'Serravalle'],
    },
    {
        country: 'Sao Tome',
        states: [],
    },
    {
        country: 'Saudi Arabia',
        states: [
            'Al Bahah',
            'Al Hudud ash Shamaliyah',
            'Al Jawf',
            'Al Madinah',
            'Al Qasim',
            'Ar Riyad',
            'Ash Sharqiyah',
            "'Asir",
            "Ha'il",
            'Jizan',
            'Makkah',
            'Najran',
            'Tabuk',
        ],
    },
    {
        country: 'Senegal',
        states: ['Dakar', 'Diourbel', 'Fatick', 'Kaolack', 'Kolda', 'Louga', 'Matam', 'Saint-Louis', 'Tambacounda', 'Thies', 'Ziguinchor'],
    },
    {
        country: 'Serbia and Montenegro',
        states: ['Kosovo', 'Montenegro', 'Serbia', 'Vojvodina'],
    },
    {
        country: 'Seychelles',
        states: [
            'Anse aux Pins',
            'Anse Boileau',
            'Anse Etoile',
            'Anse Louis',
            'Anse Royale',
            'Baie Lazare',
            'Baie Sainte Anne',
            'Beau Vallon',
            'Bel Air',
            'Bel Ombre',
            'Cascade',
            'Glacis',
            "Grand' Anse",
            "Grand' Anse",
            'La Digue',
            'La Riviere Anglaise',
            'Mont Buxton',
            'Mont Fleuri',
            'Plaisance',
            'Pointe La Rue',
            'Port Glaud',
            'Saint Louis',
            'Takamaka',
        ],
    },
    {
        country: 'Sierra Leone',
        states: [],
    },
    {
        country: 'Singapore',
        states: [],
    },
    {
        country: 'Slovakia',
        states: ['Banskobystricky', 'Bratislavsky', 'Kosicky', 'Nitriansky', 'Presovsky', 'Trenciansky', 'Trnavsky', 'Zilinsky'],
    },
    {
        country: 'Slovenia',
        states: [
            'Ajdovscina',
            'Beltinci',
            'Benedikt',
            'Bistrica ob Sotli',
            'Bled',
            'Bloke',
            'Bohinj',
            'Borovnica',
            'Bovec',
            'Braslovce',
            'Brda',
            'Brezice',
            'Brezovica',
            'Cankova',
            'Celje',
            'Cerklje na Gorenjskem',
            'Cerknica',
            'Cerkno',
            'Cerkvenjak',
            'Crensovci',
            'Crna na Koroskem',
            'Crnomelj',
            'Destrnik',
            'Divaca',
            'Dobje',
            'Dobrepolje',
            'Dobrna',
            'Dobrova-Horjul-Polhov Gradec',
            'Dobrovnik-Dobronak',
            'Dolenjske Toplice',
            'Dol pri Ljubljani',
            'Domzale',
            'Dornava',
            'Dravograd',
            'Duplek',
            'Gorenja Vas-Poljane',
            'Gorisnica',
            'Gornja Radgona',
            'Gornji Grad',
            'Gornji Petrovci',
            'Grad',
            'Grosuplje',
            'Hajdina',
            'Hoce-Slivnica',
            'Hodos-Hodos',
            'Horjul',
            'Hrastnik',
            'Hrpelje-Kozina',
            'Idrija',
            'Ig',
            'Ilirska Bistrica',
            'Ivancna Gorica',
            'Izola-Isola',
            'Jesenice',
            'Jezersko',
            'Jursinci',
            'Kamnik',
            'Kanal',
            'Kidricevo',
            'Kobarid',
            'Kobilje',
            'Kocevje',
            'Komen',
            'Komenda',
            'Koper-Capodistria',
            'Kostel',
            'Kozje',
            'Kranj',
            'Kranjska Gora',
            'Krizevci',
            'Krsko',
            'Kungota',
            'Kuzma',
            'Lasko',
            'Lenart',
            'Lendava-Lendva',
            'Litija',
            'Ljubljana',
            'Ljubno',
            'Ljutomer',
            'Logatec',
            'Loska Dolina',
            'Loski Potok',
            'Lovrenc na Pohorju',
            'Luce',
            'Lukovica',
            'Majsperk',
            'Maribor',
            'Markovci',
            'Medvode',
            'Menges',
            'Metlika',
            'Mezica',
            'Miklavz na Dravskem Polju',
            'Miren-Kostanjevica',
            'Mirna Pec',
            'Mislinja',
            'Moravce',
            'Moravske Toplice',
            'Mozirje',
            'Murska Sobota',
            'Muta',
            'Naklo',
            'Nazarje',
            'Nova Gorica',
            'Novo Mesto',
            'Odranci',
            'Oplotnica',
            'Ormoz',
            'Osilnica',
            'Pesnica',
            'Piran-Pirano',
            'Pivka',
            'Podcetrtek',
            'Podlehnik',
            'Podvelka',
            'Polzela',
            'Postojna',
            'Prebold',
            'Preddvor',
            'Prevalje',
            'Ptuj',
            'Puconci',
            'Race-Fram',
            'Radece',
            'Radenci',
            'Radlje ob Dravi',
            'Radovljica',
            'Ravne na Koroskem',
            'Razkrizje',
            'Ribnica',
            'Ribnica na Pohorju',
            'Rogasovci',
            'Rogaska Slatina',
            'Rogatec',
            'Ruse',
            'Salovci',
            'Selnica ob Dravi',
            'Semic',
            'Sempeter-Vrtojba',
            'Sencur',
            'Sentilj',
            'Sentjernej',
            'Sentjur pri Celju',
            'Sevnica',
            'Sezana',
            'Skocjan',
            'Skofja Loka',
            'Skofljica',
            'Slovenj Gradec',
            'Slovenska Bistrica',
            'Slovenske Konjice',
            'Smarje pri Jelsah',
            'Smartno ob Paki',
            'Smartno pri Litiji',
            'Sodrazica',
            'Solcava',
            'Sostanj',
            'Starse',
            'Store',
            'Sveta Ana',
            'Sveti Andraz v Slovenskih Goricah',
            'Sveti Jurij',
            'Tabor',
            'Tisina',
            'Tolmin',
            'Trbovlje',
            'Trebnje',
            'Trnovska Vas',
            'Trzic',
            'Trzin',
            'Turnisce',
            'Velenje',
            'Velika Polana',
            'Velike Lasce',
            'Verzej',
            'Videm',
            'Vipava',
            'Vitanje',
            'Vodice',
            'Vojnik',
            'Vransko',
            'Vrhnika',
            'Vuzenica',
            'Zagorje ob Savi',
            'Zalec',
            'Zavrc',
            'Zelezniki',
            'Zetale',
            'Ziri',
            'Zirovnica',
            'Zuzemberk',
            'Zrece',
        ],
    },
    {
        country: 'Solomon Islands',
        states: ['Central', 'Choiseul', 'Guadalcanal', 'Honiara', 'Isabel', 'Makira', 'Malaita', 'Rennell and Bellona', 'Temotu', 'Western'],
    },
    {
        country: 'Somalia',
        states: [
            'Awdal',
            'Bakool',
            'Banaadir',
            'Bari',
            'Bay',
            'Galguduud',
            'Gedo',
            'Hiiraan',
            'Jubbada Dhexe',
            'Jubbada Hoose',
            'Mudug',
            'Nugaal',
            'Sanaag',
            'Shabeellaha Dhexe',
            'Shabeellaha Hoose',
            'Sool',
            'Togdheer',
            'Woqooyi Galbeed',
        ],
    },
    {
        country: 'South Africa',
        states: ['Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo', 'Mpumalanga', 'North-West', 'Northern Cape', 'Western Cape'],
    },
    {
        country: 'Spain',
        states: [
            'Andalucia',
            'Aragon',
            'Asturias',
            'Baleares',
            'Ceuta',
            'Canarias',
            'Cantabria',
            'Castilla-La Mancha',
            'Castilla y Leon',
            'Cataluna',
            'Comunidad Valenciana',
            'Extremadura',
            'Galicia',
            'La Rioja',
            'Madrid',
            'Melilla',
            'Murcia',
            'Navarra',
            'Pais Vasco',
        ],
    },
    {
        country: 'Sri Lanka',
        states: ['Central', 'North Central', 'North Eastern', 'North Western', 'Sabaragamuwa', 'Southern', 'Uva', 'Western'],
    },
    {
        country: 'Sudan',
        states: [
            "A'ali an Nil",
            'Al Bahr al Ahmar',
            'Al Buhayrat',
            'Al Jazirah',
            'Al Khartum',
            'Al Qadarif',
            'Al Wahdah',
            'An Nil al Abyad',
            'An Nil al Azraq',
            'Ash Shamaliyah',
            'Bahr al Jabal',
            "Gharb al Istiwa'iyah",
            'Gharb Bahr al Ghazal',
            'Gharb Darfur',
            'Gharb Kurdufan',
            'Janub Darfur',
            'Janub Kurdufan',
            'Junqali',
            'Kassala',
            'Nahr an Nil',
            'Shamal Bahr al Ghazal',
            'Shamal Darfur',
            'Shamal Kurdufan',
            "Sharq al Istiwa'iyah",
            'Sinnar',
            'Warab',
        ],
    },
    {
        country: 'Suriname',
        states: ['Brokopondo', 'Commewijne', 'Coronie', 'Marowijne', 'Nickerie', 'Para', 'Paramaribo', 'Saramacca', 'Sipaliwini', 'Wanica'],
    },
    {
        country: 'Swaziland',
        states: ['Hhohho', 'Lubombo', 'Manzini', 'Shiselweni'],
    },
    {
        country: 'Sweden',
        states: [
            'Blekinge',
            'Dalarnas',
            'Gavleborgs',
            'Gotlands',
            'Hallands',
            'Jamtlands',
            'Jonkopings',
            'Kalmar',
            'Kronobergs',
            'Norrbottens',
            'Orebro',
            'Ostergotlands',
            'Skane',
            'Sodermanlands',
            'Stockholms',
            'Uppsala',
            'Varmlands',
            'Vasterbottens',
            'Vasternorrlands',
            'Vastmanlands',
            'Vastra Gotalands',
        ],
    },
    {
        country: 'Switzerland',
        states: [
            'Aargau',
            'Appenzell Ausser-Rhoden',
            'Appenzell Inner-Rhoden',
            'Basel-Landschaft',
            'Basel-Stadt',
            'Bern',
            'Fribourg',
            'Geneve',
            'Glarus',
            'Graubunden',
            'Jura',
            'Luzern',
            'Neuchatel',
            'Nidwalden',
            'Obwalden',
            'Sankt Gallen',
            'Schaffhausen',
            'Schwyz',
            'Solothurn',
            'Thurgau',
            'Ticino',
            'Uri',
            'Valais',
            'Vaud',
            'Zug',
            'Zurich',
        ],
    },
    {
        country: 'Syria',
        states: [
            'Al Hasakah',
            'Al Ladhiqiyah',
            'Al Qunaytirah',
            'Ar Raqqah',
            "As Suwayda'",
            "Dar'a",
            'Dayr az Zawr',
            'Dimashq',
            'Halab',
            'Hamah',
            'Hims',
            'Idlib',
            'Rif Dimashq',
            'Tartus',
        ],
    },
    {
        country: 'Taiwan',
        states: [
            'Chang-hua',
            'Chia-i',
            'Hsin-chu',
            'Hua-lien',
            'I-lan',
            'Kao-hsiung',
            'Kin-men',
            'Lien-chiang',
            'Miao-li',
            "Nan-t'ou",
            "P'eng-hu",
            "P'ing-tung",
            "T'ai-chung",
            "T'ai-nan",
            "T'ai-pei",
            "T'ai-tung",
            "T'ao-yuan",
            'Yun-lin',
            'Chia-i',
            'Chi-lung',
            'Hsin-chu',
            "T'ai-chung",
            "T'ai-nan",
            'Kao-hsiung city',
            "T'ai-pei city",
        ],
    },
    {
        country: 'Tajikistan',
        states: [],
    },
    {
        country: 'Tanzania',
        states: [
            'Arusha',
            'Dar es Salaam',
            'Dodoma',
            'Iringa',
            'Kagera',
            'Kigoma',
            'Kilimanjaro',
            'Lindi',
            'Manyara',
            'Mara',
            'Mbeya',
            'Morogoro',
            'Mtwara',
            'Mwanza',
            'Pemba North',
            'Pemba South',
            'Pwani',
            'Rukwa',
            'Ruvuma',
            'Shinyanga',
            'Singida',
            'Tabora',
            'Tanga',
            'Zanzibar Central/South',
            'Zanzibar North',
            'Zanzibar Urban/West',
        ],
    },
    {
        country: 'Thailand',
        states: [
            'Amnat Charoen',
            'Ang Thong',
            'Buriram',
            'Chachoengsao',
            'Chai Nat',
            'Chaiyaphum',
            'Chanthaburi',
            'Chiang Mai',
            'Chiang Rai',
            'Chon Buri',
            'Chumphon',
            'Kalasin',
            'Kamphaeng Phet',
            'Kanchanaburi',
            'Khon Kaen',
            'Krabi',
            'Krung Thep Mahanakhon',
            'Lampang',
            'Lamphun',
            'Loei',
            'Lop Buri',
            'Mae Hong Son',
            'Maha Sarakham',
            'Mukdahan',
            'Nakhon Nayok',
            'Nakhon Pathom',
            'Nakhon Phanom',
            'Nakhon Ratchasima',
            'Nakhon Sawan',
            'Nakhon Si Thammarat',
            'Nan',
            'Narathiwat',
            'Nong Bua Lamphu',
            'Nong Khai',
            'Nonthaburi',
            'Pathum Thani',
            'Pattani',
            'Phangnga',
            'Phatthalung',
            'Phayao',
            'Phetchabun',
            'Phetchaburi',
            'Phichit',
            'Phitsanulok',
            'Phra Nakhon Si Ayutthaya',
            'Phrae',
            'Phuket',
            'Prachin Buri',
            'Prachuap Khiri Khan',
            'Ranong',
            'Ratchaburi',
            'Rayong',
            'Roi Et',
            'Sa Kaeo',
            'Sakon Nakhon',
            'Samut Prakan',
            'Samut Sakhon',
            'Samut Songkhram',
            'Sara Buri',
            'Satun',
            'Sing Buri',
            'Sisaket',
            'Songkhla',
            'Sukhothai',
            'Suphan Buri',
            'Surat Thani',
            'Surin',
            'Tak',
            'Trang',
            'Trat',
            'Ubon Ratchathani',
            'Udon Thani',
            'Uthai Thani',
            'Uttaradit',
            'Yala',
            'Yasothon',
        ],
    },
    {
        country: 'Togo',
        states: ['Kara', 'Plateaux', 'Savanes', 'Centrale', 'Maritime'],
    },
    {
        country: 'Tonga',
        states: [],
    },
    {
        country: 'Trinidad and Tobago',
        states: [
            'Couva',
            'Diego Martin',
            'Mayaro',
            'Penal',
            'Princes Town',
            'Sangre Grande',
            'San Juan',
            'Siparia',
            'Tunapuna',
            'Port-of-Spain',
            'San Fernando',
            'Arima',
            'Point Fortin',
            'Chaguanas',
            'Tobago',
        ],
    },
    {
        country: 'Tunisia',
        states: [
            'Ariana (Aryanah)',
            'Beja (Bajah)',
            "Ben Arous (Bin 'Arus)",
            'Bizerte (Banzart)',
            'Gabes (Qabis)',
            'Gafsa (Qafsah)',
            'Jendouba (Jundubah)',
            'Kairouan (Al Qayrawan)',
            'Kasserine (Al Qasrayn)',
            'Kebili (Qibili)',
            'Kef (Al Kaf)',
            'Mahdia (Al Mahdiyah)',
            'Manouba (Manubah)',
            'Medenine (Madanin)',
            'Monastir (Al Munastir)',
            'Nabeul (Nabul)',
            'Sfax (Safaqis)',
            'Sidi Bou Zid (Sidi Bu Zayd)',
            'Siliana (Silyanah)',
            'Sousse (Susah)',
            'Tataouine (Tatawin)',
            'Tozeur (Tawzar)',
            'Tunis',
            'Zaghouan (Zaghwan)',
        ],
    },
    {
        country: 'Turkey',
        states: [
            'Adana',
            'Adiyaman',
            'Afyonkarahisar',
            'Agri',
            'Aksaray',
            'Amasya',
            'Ankara',
            'Antalya',
            'Ardahan',
            'Artvin',
            'Aydin',
            'Balikesir',
            'Bartin',
            'Batman',
            'Bayburt',
            'Bilecik',
            'Bingol',
            'Bitlis',
            'Bolu',
            'Burdur',
            'Bursa',
            'Canakkale',
            'Cankiri',
            'Corum',
            'Denizli',
            'Diyarbakir',
            'Duzce',
            'Edirne',
            'Elazig',
            'Erzincan',
            'Erzurum',
            'Eskisehir',
            'Gaziantep',
            'Giresun',
            'Gumushane',
            'Hakkari',
            'Hatay',
            'Igdir',
            'Isparta',
            'Istanbul',
            'Izmir',
            'Kahramanmaras',
            'Karabuk',
            'Karaman',
            'Kars',
            'Kastamonu',
            'Kayseri',
            'Kilis',
            'Kirikkale',
            'Kirklareli',
            'Kirsehir',
            'Kocaeli',
            'Konya',
            'Kutahya',
            'Malatya',
            'Manisa',
            'Mardin',
            'Mersin',
            'Mugla',
            'Mus',
            'Nevsehir',
            'Nigde',
            'Ordu',
            'Osmaniye',
            'Rize',
            'Sakarya',
            'Samsun',
            'Sanliurfa',
            'Siirt',
            'Sinop',
            'Sirnak',
            'Sivas',
            'Tekirdag',
            'Tokat',
            'Trabzon',
            'Tunceli',
            'Usak',
            'Van',
            'Yalova',
            'Yozgat',
            'Zonguldak',
        ],
    },
    {
        country: 'Turkmenistan',
        states: ['Ahal Welayaty (Ashgabat)', 'Balkan Welayaty (Balkanabat)', 'Dashoguz Welayaty', 'Lebap Welayaty (Turkmenabat)', 'Mary Welayaty'],
    },
    {
        country: 'Uganda',
        states: [
            'Adjumani',
            'Apac',
            'Arua',
            'Bugiri',
            'Bundibugyo',
            'Bushenyi',
            'Busia',
            'Gulu',
            'Hoima',
            'Iganga',
            'Jinja',
            'Kabale',
            'Kabarole',
            'Kaberamaido',
            'Kalangala',
            'Kampala',
            'Kamuli',
            'Kamwenge',
            'Kanungu',
            'Kapchorwa',
            'Kasese',
            'Katakwi',
            'Kayunga',
            'Kibale',
            'Kiboga',
            'Kisoro',
            'Kitgum',
            'Kotido',
            'Kumi',
            'Kyenjojo',
            'Lira',
            'Luwero',
            'Masaka',
            'Masindi',
            'Mayuge',
            'Mbale',
            'Mbarara',
            'Moroto',
            'Moyo',
            'Mpigi',
            'Mubende',
            'Mukono',
            'Nakapiripirit',
            'Nakasongola',
            'Nebbi',
            'Ntungamo',
            'Pader',
            'Pallisa',
            'Rakai',
            'Rukungiri',
            'Sembabule',
            'Sironko',
            'Soroti',
            'Tororo',
            'Wakiso',
            'Yumbe',
        ],
    },
    {
        country: 'Ukraine',
        states: [
            'Cherkasy',
            'Chernihiv',
            'Chernivtsi',
            'Crimea',
            "Dnipropetrovs'k",
            "Donets'k",
            "Ivano-Frankivs'k",
            'Kharkiv',
            'Kherson',
            "Khmel'nyts'kyy",
            'Kirovohrad',
            'Kiev',
            'Kyyiv',
            "Luhans'k",
            "L'viv",
            'Mykolayiv',
            'Odesa',
            'Poltava',
            'Rivne',
            "Sevastopol'",
            'Sumy',
            "Ternopil'",
            'Vinnytsya',
            "Volyn'",
            'Zakarpattya',
            'Zaporizhzhya',
            'Zhytomyr',
        ],
    },
    {
        country: 'United Arab Emirates',
        states: ['Abu Dhabi', "'Ajman", 'Al Fujayrah', 'Sharjah', 'Dubai', "Ra's al Khaymah", 'Umm al Qaywayn'],
    },
    {
        country: 'United Kingdom',
        states: [],
    },
    {
        country: 'United States',
        states: [
            'Alabama',
            'Alaska',
            'Arizona',
            'Arkansas',
            'California',
            'Colorado',
            'Connecticut',
            'Delaware',
            'District of Columbia',
            'Florida',
            'Georgia',
            'Hawaii',
            'Idaho',
            'Illinois',
            'Indiana',
            'Iowa',
            'Kansas',
            'Kentucky',
            'Louisiana',
            'Maine',
            'Maryland',
            'Massachusetts',
            'Michigan',
            'Minnesota',
            'Mississippi',
            'Missouri',
            'Montana',
            'Nebraska',
            'Nevada',
            'New Hampshire',
            'New Jersey',
            'New Mexico',
            'New York',
            'North Carolina',
            'North Dakota',
            'Ohio',
            'Oklahoma',
            'Oregon',
            'Pennsylvania',
            'Rhode Island',
            'South Carolina',
            'South Dakota',
            'Tennessee',
            'Texas',
            'Utah',
            'Vermont',
            'Virginia',
            'Washington',
            'West Virginia',
            'Wisconsin',
            'Wyoming',
        ],
    },
    {
        country: 'Uruguay',
        states: [
            'Artigas',
            'Canelones',
            'Cerro Largo',
            'Colonia',
            'Durazno',
            'Flores',
            'Florida',
            'Lavalleja',
            'Maldonado',
            'Montevideo',
            'Paysandu',
            'Rio Negro',
            'Rivera',
            'Rocha',
            'Salto',
            'San Jose',
            'Soriano',
            'Tacuarembo',
            'Treinta y Tres',
        ],
    },
    {
        country: 'Uzbekistan',
        states: [
            'Andijon Viloyati',
            'Buxoro Viloyati',
            "Farg'ona Viloyati",
            'Jizzax Viloyati',
            'Namangan Viloyati',
            'Navoiy Viloyati',
            'Qashqadaryo Viloyati',
            "Qaraqalpog'iston Respublikasi",
            'Samarqand Viloyati',
            'Sirdaryo Viloyati',
            'Surxondaryo Viloyati',
            'Toshkent Shahri',
            'Toshkent Viloyati',
            'Xorazm Viloyati',
        ],
    },
    {
        country: 'Vanuatu',
        states: ['Malampa', 'Penama', 'Sanma', 'Shefa', 'Tafea', 'Torba'],
    },
    {
        country: 'Venezuela',
        states: [
            'Amazonas',
            'Anzoategui',
            'Apure',
            'Aragua',
            'Barinas',
            'Bolivar',
            'Carabobo',
            'Cojedes',
            'Delta Amacuro',
            'Dependencias Federales',
            'Distrito Federal',
            'Falcon',
            'Guarico',
            'Lara',
            'Merida',
            'Miranda',
            'Monagas',
            'Nueva Esparta',
            'Portuguesa',
            'Sucre',
            'Tachira',
            'Trujillo',
            'Vargas',
            'Yaracuy',
            'Zulia',
        ],
    },
    {
        country: 'Vietnam',
        states: [
            'An Giang',
            'Bac Giang',
            'Bac Kan',
            'Bac Lieu',
            'Bac Ninh',
            'Ba Ria-Vung Tau',
            'Ben Tre',
            'Binh Dinh',
            'Binh Duong',
            'Binh Phuoc',
            'Binh Thuan',
            'Ca Mau',
            'Cao Bang',
            'Dac Lak',
            'Dac Nong',
            'Dien Bien',
            'Dong Nai',
            'Dong Thap',
            'Gia Lai',
            'Ha Giang',
            'Hai Duong',
            'Ha Nam',
            'Ha Tay',
            'Ha Tinh',
            'Hau Giang',
            'Hoa Binh',
            'Hung Yen',
            'Khanh Hoa',
            'Kien Giang',
            'Kon Tum',
            'Lai Chau',
            'Lam Dong',
            'Lang Son',
            'Lao Cai',
            'Long An',
            'Nam Dinh',
            'Nghe An',
            'Ninh Binh',
            'Ninh Thuan',
            'Phu Tho',
            'Phu Yen',
            'Quang Binh',
            'Quang Nam',
            'Quang Ngai',
            'Quang Ninh',
            'Quang Tri',
            'Soc Trang',
            'Son La',
            'Tay Ninh',
            'Thai Binh',
            'Thai Nguyen',
            'Thanh Hoa',
            'Thua Thien-Hue',
            'Tien Giang',
            'Tra Vinh',
            'Tuyen Quang',
            'Vinh Long',
            'Vinh Phuc',
            'Yen Bai',
            'Can Tho',
            'Da Nang',
            'Hai Phong',
            'Hanoi',
            'Ho Chi Minh',
        ],
    },
    {
        country: 'Yemen',
        states: [
            'Abyan',
            "'Adan",
            "Ad Dali'",
            "Al Bayda'",
            'Al Hudaydah',
            'Al Jawf',
            'Al Mahrah',
            'Al Mahwit',
            "'Amran",
            'Dhamar',
            'Hadramawt',
            'Hajjah',
            'Ibb',
            'Lahij',
            "Ma'rib",
            "Sa'dah",
            "San'a'",
            'Shabwah',
            "Ta'izz",
        ],
    },
    {
        country: 'Zambia',
        states: ['Central', 'Copperbelt', 'Eastern', 'Luapula', 'Lusaka', 'Northern', 'North-Western', 'Southern', 'Western'],
    },
    {
        country: 'Zimbabwe',
        states: [
            'Bulawayo',
            'Harare',
            'Manicaland',
            'Mashonaland Central',
            'Mashonaland East',
            'Mashonaland West',
            'Masvingo',
            'Matabeleland North',
            'Matabeleland South',
            'Midlands',
        ],
    },
];
const TIMEZONE_NAMES = [
    'Africa/Abidjan',
    'Africa/Accra',
    'Africa/Addis_Ababa',
    'Africa/Algiers',
    'Africa/Asmara',
    'Africa/Bamako',
    'Africa/Bangui',
    'Africa/Banjul',
    'Africa/Bissau',
    'Africa/Blantyre',
    'Africa/Brazzaville',
    'Africa/Bujumbura',
    'Africa/Cairo',
    'Africa/Casablanca',
    'Africa/Ceuta',
    'Africa/Conakry',
    'Africa/Dakar',
    'Africa/Dar_es_Salaam',
    'Africa/Djibouti',
    'Africa/Douala',
    'Africa/El_Aaiun',
    'Africa/Freetown',
    'Africa/Gaborone',
    'Africa/Harare',
    'Africa/Johannesburg',
    'Africa/Juba',
    'Africa/Kampala',
    'Africa/Khartoum',
    'Africa/Kigali',
    'Africa/Kinshasa',
    'Africa/Lagos',
    'Africa/Libreville',
    'Africa/Lome',
    'Africa/Luanda',
    'Africa/Lubumbashi',
    'Africa/Lusaka',
    'Africa/Malabo',
    'Africa/Maputo',
    'Africa/Maseru',
    'Africa/Mbabane',
    'Africa/Mogadishu',
    'Africa/Monrovia',
    'Africa/Nairobi',
    'Africa/Ndjamena',
    'Africa/Niamey',
    'Africa/Nouakchott',
    'Africa/Ouagadougou',
    'Africa/Porto-Novo',
    'Africa/Sao_Tome',
    'Africa/Tripoli',
    'Africa/Tunis',
    'Africa/Windhoek',
    'America/Adak',
    'America/Anchorage',
    'America/Anguilla',
    'America/Antigua',
    'America/Araguaina',
    'America/Argentina/Buenos_Aires',
    'America/Argentina/Catamarca',
    'America/Argentina/Cordoba',
    'America/Argentina/Jujuy',
    'America/Argentina/La_Rioja',
    'America/Argentina/Mendoza',
    'America/Argentina/Rio_Gallegos',
    'America/Argentina/Salta',
    'America/Argentina/San_Juan',
    'America/Argentina/San_Luis',
    'America/Argentina/Tucuman',
    'America/Argentina/Ushuaia',
    'America/Aruba',
    'America/Asuncion',
    'America/Atikokan',
    'America/Bahia',
    'America/Bahia_Banderas',
    'America/Barbados',
    'America/Belem',
    'America/Belize',
    'America/Blanc-Sablon',
    'America/Boa_Vista',
    'America/Bogota',
    'America/Boise',
    'America/Cambridge_Bay',
    'America/Campo_Grande',
    'America/Cancun',
    'America/Caracas',
    'America/Cayenne',
    'America/Cayman',
    'America/Chicago',
    'America/Chihuahua',
    'America/Costa_Rica',
    'America/Creston',
    'America/Cuiaba',
    'America/Curacao',
    'America/Danmarkshavn',
    'America/Dawson',
    'America/Dawson_Creek',
    'America/Denver',
    'America/Detroit',
    'America/Dominica',
    'America/Edmonton',
    'America/Eirunepe',
    'America/El_Salvador',
    'America/Fort_Nelson',
    'America/Fortaleza',
    'America/Glace_Bay',
    'America/Goose_Bay',
    'America/Grand_Turk',
    'America/Grenada',
    'America/Guadeloupe',
    'America/Guatemala',
    'America/Guayaquil',
    'America/Guyana',
    'America/Halifax',
    'America/Havana',
    'America/Hermosillo',
    'America/Indiana/Indianapolis',
    'America/Indiana/Knox',
    'America/Indiana/Marengo',
    'America/Indiana/Petersburg',
    'America/Indiana/Tell_City',
    'America/Indiana/Vevay',
    'America/Indiana/Vincennes',
    'America/Indiana/Winamac',
    'America/Inuvik',
    'America/Iqaluit',
    'America/Jamaica',
    'America/Juneau',
    'America/Kentucky/Louisville',
    'America/Kentucky/Monticello',
    'America/Kralendijk',
    'America/La_Paz',
    'America/Lima',
    'America/Los_Angeles',
    'America/Lower_Princes',
    'America/Maceio',
    'America/Managua',
    'America/Manaus',
    'America/Marigot',
    'America/Martinique',
    'America/Matamoros',
    'America/Mazatlan',
    'America/Menominee',
    'America/Merida',
    'America/Metlakatla',
    'America/Mexico_City',
    'America/Miquelon',
    'America/Moncton',
    'America/Monterrey',
    'America/Montevideo',
    'America/Montserrat',
    'America/Nassau',
    'America/New_York',
    'America/Nipigon',
    'America/Nome',
    'America/Noronha',
    'America/North_Dakota/Beulah',
    'America/North_Dakota/Center',
    'America/North_Dakota/New_Salem',
    'America/Nuuk',
    'America/Ojinaga',
    'America/Panama',
    'America/Pangnirtung',
    'America/Paramaribo',
    'America/Phoenix',
    'America/Port-au-Prince',
    'America/Port_of_Spain',
    'America/Porto_Velho',
    'America/Puerto_Rico',
    'America/Punta_Arenas',
    'America/Rainy_River',
    'America/Rankin_Inlet',
    'America/Recife',
    'America/Regina',
    'America/Resolute',
    'America/Rio_Branco',
    'America/Santarem',
    'America/Santiago',
    'America/Santo_Domingo',
    'America/Sao_Paulo',
    'America/Scoresbysund',
    'America/Sitka',
    'America/St_Barthelemy',
    'America/St_Johns',
    'America/St_Kitts',
    'America/St_Lucia',
    'America/St_Thomas',
    'America/St_Vincent',
    'America/Swift_Current',
    'America/Tegucigalpa',
    'America/Thule',
    'America/Thunder_Bay',
    'America/Tijuana',
    'America/Toronto',
    'America/Tortola',
    'America/Vancouver',
    'America/Whitehorse',
    'America/Winnipeg',
    'America/Yakutat',
    'America/Yellowknife',
    'Antarctica/Casey',
    'Antarctica/Davis',
    'Antarctica/DumontDUrville',
    'Antarctica/Macquarie',
    'Antarctica/Mawson',
    'Antarctica/McMurdo',
    'Antarctica/Palmer',
    'Antarctica/Rothera',
    'Antarctica/Syowa',
    'Antarctica/Troll',
    'Antarctica/Vostok',
    'Arctic/Longyearbyen',
    'Asia/Aden',
    'Asia/Almaty',
    'Asia/Amman',
    'Asia/Anadyr',
    'Asia/Aqtau',
    'Asia/Aqtobe',
    'Asia/Ashgabat',
    'Asia/Atyrau',
    'Asia/Baghdad',
    'Asia/Bahrain',
    'Asia/Baku',
    'Asia/Bangkok',
    'Asia/Barnaul',
    'Asia/Beirut',
    'Asia/Bishkek',
    'Asia/Brunei',
    'Asia/Chita',
    'Asia/Choibalsan',
    'Asia/Colombo',
    'Asia/Damascus',
    'Asia/Dhaka',
    'Asia/Dili',
    'Asia/Dubai',
    'Asia/Dushanbe',
    'Asia/Famagusta',
    'Asia/Gaza',
    'Asia/Hebron',
    'Asia/Ho_Chi_Minh',
    'Asia/Hong_Kong',
    'Asia/Hovd',
    'Asia/Irkutsk',
    'Asia/Jakarta',
    'Asia/Jayapura',
    'Asia/Jerusalem',
    'Asia/Kabul',
    'Asia/Kamchatka',
    'Asia/Karachi',
    'Asia/Kathmandu',
    'Asia/Khandyga',
    'Asia/Kolkata',
    'Asia/Krasnoyarsk',
    'Asia/Kuala_Lumpur',
    'Asia/Kuching',
    'Asia/Kuwait',
    'Asia/Macau',
    'Asia/Magadan',
    'Asia/Makassar',
    'Asia/Manila',
    'Asia/Muscat',
    'Asia/Nicosia',
    'Asia/Novokuznetsk',
    'Asia/Novosibirsk',
    'Asia/Omsk',
    'Asia/Oral',
    'Asia/Phnom_Penh',
    'Asia/Pontianak',
    'Asia/Pyongyang',
    'Asia/Qatar',
    'Asia/Qostanay',
    'Asia/Qyzylorda',
    'Asia/Riyadh',
    'Asia/Sakhalin',
    'Asia/Samarkand',
    'Asia/Seoul',
    'Asia/Shanghai',
    'Asia/Singapore',
    'Asia/Srednekolymsk',
    'Asia/Taipei',
    'Asia/Tashkent',
    'Asia/Tbilisi',
    'Asia/Tehran',
    'Asia/Thimphu',
    'Asia/Tokyo',
    'Asia/Tomsk',
    'Asia/Ulaanbaatar',
    'Asia/Urumqi',
    'Asia/Ust-Nera',
    'Asia/Vientiane',
    'Asia/Vladivostok',
    'Asia/Yakutsk',
    'Asia/Yangon',
    'Asia/Yekaterinburg',
    'Asia/Yerevan',
    'Atlantic/Azores',
    'Atlantic/Bermuda',
    'Atlantic/Canary',
    'Atlantic/Cape_Verde',
    'Atlantic/Faroe',
    'Atlantic/Madeira',
    'Atlantic/Reykjavik',
    'Atlantic/South_Georgia',
    'Atlantic/St_Helena',
    'Atlantic/Stanley',
    'Australia/Adelaide',
    'Australia/Brisbane',
    'Australia/Broken_Hill',
    'Australia/Darwin',
    'Australia/Eucla',
    'Australia/Hobart',
    'Australia/Lindeman',
    'Australia/Lord_Howe',
    'Australia/Melbourne',
    'Australia/Perth',
    'Australia/Sydney',
    'Europe/Amsterdam',
    'Europe/Andorra',
    'Europe/Astrakhan',
    'Europe/Athens',
    'Europe/Belgrade',
    'Europe/Berlin',
    'Europe/Bratislava',
    'Europe/Brussels',
    'Europe/Bucharest',
    'Europe/Budapest',
    'Europe/Busingen',
    'Europe/Chisinau',
    'Europe/Copenhagen',
    'Europe/Dublin',
    'Europe/Gibraltar',
    'Europe/Guernsey',
    'Europe/Helsinki',
    'Europe/Isle_of_Man',
    'Europe/Istanbul',
    'Europe/Jersey',
    'Europe/Kaliningrad',
    'Europe/Kiev',
    'Europe/Kirov',
    'Europe/Lisbon',
    'Europe/Ljubljana',
    'Europe/London',
    'Europe/Luxembourg',
    'Europe/Madrid',
    'Europe/Malta',
    'Europe/Mariehamn',
    'Europe/Minsk',
    'Europe/Monaco',
    'Europe/Moscow',
    'Europe/Oslo',
    'Europe/Paris',
    'Europe/Podgorica',
    'Europe/Prague',
    'Europe/Riga',
    'Europe/Rome',
    'Europe/Samara',
    'Europe/San_Marino',
    'Europe/Sarajevo',
    'Europe/Saratov',
    'Europe/Simferopol',
    'Europe/Skopje',
    'Europe/Sofia',
    'Europe/Stockholm',
    'Europe/Tallinn',
    'Europe/Tirane',
    'Europe/Ulyanovsk',
    'Europe/Uzhgorod',
    'Europe/Vaduz',
    'Europe/Vatican',
    'Europe/Vienna',
    'Europe/Vilnius',
    'Europe/Volgograd',
    'Europe/Warsaw',
    'Europe/Zagreb',
    'Europe/Zaporozhye',
    'Europe/Zurich',
    'Indian/Antananarivo',
    'Indian/Chagos',
    'Indian/Christmas',
    'Indian/Cocos',
    'Indian/Comoro',
    'Indian/Kerguelen',
    'Indian/Mahe',
    'Indian/Maldives',
    'Indian/Mauritius',
    'Indian/Mayotte',
    'Indian/Reunion',
    'Pacific/Apia',
    'Pacific/Auckland',
    'Pacific/Bougainville',
    'Pacific/Chatham',
    'Pacific/Chuuk',
    'Pacific/Easter',
    'Pacific/Efate',
    'Pacific/Fakaofo',
    'Pacific/Fiji',
    'Pacific/Funafuti',
    'Pacific/Galapagos',
    'Pacific/Gambier',
    'Pacific/Guadalcanal',
    'Pacific/Guam',
    'Pacific/Honolulu',
    'Pacific/Kanton',
    'Pacific/Kiritimati',
    'Pacific/Kosrae',
    'Pacific/Kwajalein',
    'Pacific/Majuro',
    'Pacific/Marquesas',
    'Pacific/Midway',
    'Pacific/Nauru',
    'Pacific/Niue',
    'Pacific/Norfolk',
    'Pacific/Noumea',
    'Pacific/Pago_Pago',
    'Pacific/Palau',
    'Pacific/Pitcairn',
    'Pacific/Pohnpei',
    'Pacific/Port_Moresby',
    'Pacific/Rarotonga',
    'Pacific/Saipan',
    'Pacific/Tahiti',
    'Pacific/Tarawa',
    'Pacific/Tongatapu',
    'Pacific/Wake',
    'Pacific/Wallis',
];
const LANGUAGES = [
    {
        code: 'af',
        language: 'Afrikaans',
        dateFormat: 'yyyy/MM/dd',
    },
    {
        code: 'af-ZA',
        language: 'Afrikaans (South Africa)',
        dateFormat: 'yyyy/MM/dd',
    },
    {
        code: 'sq',
        language: 'Albanian',
        dateFormat: '',
    },
    {
        code: 'sq-AL',
        language: 'Albanian (Albania)',
        dateFormat: '',
    },
    {
        code: 'gsw',
        language: 'Alsatian',
        dateFormat: '',
    },
    {
        code: 'gsw-FR',
        language: 'Alsatian (France)',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'am',
        language: 'Amharic',
        dateFormat: 'd/M/yyyy',
    },
    {
        code: 'am-ET',
        language: 'Amharic (Ethiopia)',
        dateFormat: 'd/M/yyyy',
    },
    {
        code: 'ar',
        language: 'Arabic',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'ar-DZ',
        language: 'Arabic (Algeria){',
        dateFormat: 'dd-MM-yyyy',
    },
    {
        code: 'ar-BH',
        language: 'Arabic (Bahrain)',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'ar-EG',
        language: 'Arabic (Egypt)',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'ar-IQ',
        language: 'Arabic (Iraq)',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'ar-JO',
        language: 'Arabic (Jordan)',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'ar-KW',
        language: 'Arabic (Kuwait)',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'ar-LB',
        language: 'Arabic (Lebanon)',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'ar-LY',
        language: 'Arabic (Libya)',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'ar-MA',
        language: 'Arabic (Morocco)',
        dateFormat: 'dd-MM-yyyy',
    },
    {
        code: 'ar-OM',
        language: 'Arabic (Oman)',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'ar-QA',
        language: 'Arabic (Qatar)',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'ar-SA',
        language: 'Arabic (Saudi Arabia)',
        dateFormat: 'dd/MM/yy',
    },
    {
        code: 'ar-SY',
        language: 'Arabic (Syria)',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'ar-TN',
        language: 'Arabic (Tunisia)',
        dateFormat: 'dd-MM-yyyy',
    },
    {
        code: 'ar-AE',
        language: 'Arabic (U.A.E.)',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'ar-YE',
        language: 'Arabic (Yemen)',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'hy',
        language: 'Armenian',
        dateFormat: '',
    },
    {
        code: 'hy-AM',
        language: 'Armenian (Armenia)',
        dateFormat: 'dd.MM.yyyy',
    },
    {
        code: 'as',
        language: 'Assamese',
        dateFormat: 'dd-MM-yyyy',
    },
    {
        code: 'as-IN',
        language: 'Assamese (India)',
        dateFormat: 'dd-MM-yyyy',
    },
    {
        code: 'az',
        language: 'Azerbaijani',
        dateFormat: 'dd.MM.yyyy',
    },
    {
        code: 'az-Cyrl',
        language: 'Azerbaijani (Cyrillic)',
        dateFormat: 'dd.MM.yyyy',
    },
    {
        code: 'az-Cyrl-AZ',
        language: 'Azerbaijani (Cyrillic, Azerbaijan)',
        dateFormat: 'dd.MM.yyyy',
    },
    {
        code: 'az-Latn',
        language: 'Azerbaijani (Latin)',
        dateFormat: 'dd.MM.yyyy',
    },
    {
        code: 'az-Latn-AZ',
        language: 'Azerbaijani (Latin, Azerbaijan)',
        dateFormat: 'dd.MM.yyyy',
    },
    {
        code: 'bn',
        language: 'Bangla',
        dateFormat: 'dd-MM-yy',
    },
    {
        code: 'bn-BD',
        language: 'Bangla (Bangladesh)',
        dateFormat: 'dd-MM-yy',
    },
    {
        code: 'bn-IN',
        language: 'Bangla (India)',
        dateFormat: 'dd-MM-yy',
    },
    {
        code: 'ba',
        language: 'Bashkir',
        dateFormat: 'dd.MM.yy',
    },
    {
        code: 'ba-RU',
        language: 'Bashkir (Russia)',
        dateFormat: 'dd.MM.yy',
    },
    {
        code: 'eu',
        language: 'Basque',
        dateFormat: 'yyyy/MM/dd',
    },
    {
        code: 'eu-ES',
        language: 'Basque (Basque)',
        dateFormat: 'yyyy/MM/dd',
    },
    {
        code: 'be',
        language: 'Belarusian',
        dateFormat: 'dd.MM.yyyy',
    },
    {
        code: 'be-BY',
        language: 'Belarusian (Belarus)',
        dateFormat: 'dd.MM.yyyy',
    },
    {
        code: 'bs',
        language: 'Bosnian',
        dateFormat: 'd.M.yyyy',
    },
    {
        code: 'bs-Cyrl',
        language: 'Bosnian (Cyrillic)',
        dateFormat: 'd.M.yyyy',
    },
    {
        code: 'bs-Cyrl-BA',
        language: 'Bosnian (Cyrillic, Bosnia and Herzegovina)',
        dateFormat: 'd.M.yyyy',
    },
    {
        code: 'bs-Latn',
        language: 'Bosnian (Latin)',
        dateFormat: 'd.M.yyyy',
    },
    {
        code: 'bs-Latn-BA',
        language: 'Bosnian (Latin, Bosnia and Herzegovina)',
        dateFormat: 'd.M.yyyy',
    },
    {
        code: 'br',
        language: 'Breton',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'br-FR',
        language: 'Breton (France)',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'bg',
        language: 'Bulgarian',
        dateFormat: 'dd.M.yyyy',
    },
    {
        code: 'bg-BG',
        language: 'Bulgarian (Bulgaria)',
        dateFormat: 'dd.M.yyyy',
    },
    {
        code: 'ca',
        language: 'Catalan',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'ca-ES',
        language: 'Catalan',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'tzm-Arab-MA',
        language: 'Central Atlas Tamazight (Arabic, Morocco)',
        dateFormat: '',
    },
    {
        code: 'tzm-Tfng-MA',
        language: 'Central Atlas Tamazight (Tifinagh, Morocco)',
        dateFormat: '',
    },
    {
        code: 'chr',
        language: 'Cherokee',
        dateFormat: '',
    },
    {
        code: 'chr-Cher',
        language: 'Cherokee (Cherokee)',
        dateFormat: '',
    },
    {
        code: 'chr-Cher-US',
        language: 'Cherokee (Cherokee)',
        dateFormat: '',
    },
    {
        code: 'zh',
        language: 'Chinese',
        dateFormat: '',
    },
    {
        code: 'zh-Hans',
        language: 'Chinese (Simplified)',
        dateFormat: '',
    },
    {
        code: 'zh-CHS',
        language: 'Chinese (Simplified) Legacy',
        dateFormat: '',
    },
    {
        code: 'zh-CN',
        language: 'Chinese (Simplified, PRC)',
        dateFormat: 'yyyy/M/d',
    },
    {
        code: 'zh-SG',
        language: 'Chinese (Simplified, Singapore)',
        dateFormat: 'd/M/yyyy',
    },
    {
        code: 'zh-Hant',
        language: 'Chinese (Traditional)',
        dateFormat: '',
    },
    {
        code: 'zh-CHT',
        language: 'Chinese (Traditional) Legacy',
        dateFormat: '',
    },
    {
        code: 'zh-HK',
        language: 'Chinese (Traditional, Hong Kong S.A.R.)',
        dateFormat: 'd/M/yyyy',
    },
    {
        code: 'zh-MO',
        language: 'Chinese (Traditional, Macao S.A.R.)',
        dateFormat: 'd/M/yyyy',
    },
    {
        code: 'zh-TW',
        language: 'Chinese (Traditional, Taiwan)',
        dateFormat: 'yyyy/M/d',
    },
    {
        code: 'co',
        language: 'Corsican',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'co-FR',
        language: 'Corsican (France)',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'hr',
        language: 'Croatian',
        dateFormat: '',
    },
    {
        code: 'hr-HR',
        language: 'Croatian (Croatia)',
        dateFormat: 'd.M.yyyy',
    },
    {
        code: 'hr-BA',
        language: 'Croatian (Latin, Bosnia and Herzegovina)',
        dateFormat: 'd.M.yyyy',
    },
    {
        code: 'cs',
        language: 'Czech',
        dateFormat: 'd.M.yyyy',
    },
    {
        code: 'cs-CZ',
        language: 'Czech (Czech Republic)',
        dateFormat: 'd.M.yyyy',
    },
    {
        code: 'da',
        language: 'Danish',
        dateFormat: 'dd-MM-yyyy',
    },
    {
        code: 'da-DK',
        language: 'Danish (Denmark)',
        dateFormat: 'dd-MM-yyyy',
    },
    {
        code: 'prs',
        language: 'Dari',
        dateFormat: '',
    },
    {
        code: 'prs-AF',
        language: 'Dari (Afghanistan)',
        dateFormat: 'dd/MM/yy',
    },
    {
        code: 'dv',
        language: 'Divehi',
        dateFormat: 'dd/MM/yy',
    },
    {
        code: 'dv-MV',
        language: 'Divehi (Maldives)',
        dateFormat: 'dd/MM/yy',
    },
    {
        code: 'nl',
        language: 'Dutch',
        dateFormat: '',
    },
    {
        code: 'nl-BE',
        language: 'Dutch (Belgium)',
        dateFormat: 'd/MM/yyyy',
    },
    {
        code: 'nl-NL',
        language: 'Dutch (Netherlands)',
        dateFormat: 'd-M-yyyy',
    },
    {
        code: 'dz-BT',
        language: 'Dzongkha (Bhutan)',
        dateFormat: '',
    },
    {
        code: 'bin',
        language: 'Edo',
        dateFormat: '',
    },
    {
        code: 'bin-NG',
        language: 'Edo (Nigeria)',
        dateFormat: '',
    },
    {
        code: 'en',
        language: 'English',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'en-AU',
        language: 'English (Australia)',
        dateFormat: 'd/MM/yyyy',
    },
    {
        code: 'en-BZ',
        language: 'English (Belize)',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'en-CA',
        language: 'English (Canada)',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'en-029',
        language: 'English (Caribbean)',
        dateFormat: 'MM/dd/yyyy',
    },
    {
        code: 'en-IN',
        language: 'English (India)',
        dateFormat: 'dd-MM-yyyy',
    },
    {
        code: 'en-IE',
        language: 'English (Ireland)',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'en-JM',
        language: 'English (Jamaica)',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'en-MY',
        language: 'English (Malaysia)',
        dateFormat: 'd/M/yyyy',
    },
    {
        code: 'en-NZ',
        language: 'English (New Zealand)',
        dateFormat: 'd/MM/yyyy',
    },
    {
        code: 'en-PH',
        language: 'English (Republic of the Philippines)',
        dateFormat: 'M/d/yyyy',
    },
    {
        code: 'en-SG',
        language: 'English (Singapore)',
        dateFormat: 'd/M/yyyy',
    },
    {
        code: 'en-ZA',
        language: 'English (South Africa)',
        dateFormat: 'yyyy/MM/dd',
    },
    {
        code: 'en-TT',
        language: 'English (Trinidad and Tobago)',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'en-GB',
        language: 'English (United Kingdom)',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'en-US',
        language: 'English (United States)',
        dateFormat: 'M/d/yyyy',
    },
    {
        code: 'en-ZW',
        language: 'English (Zimbabwe)',
        dateFormat: 'M/d/yyyy',
    },
    {
        code: 'et',
        language: 'Estonian',
        dateFormat: 'd.MM.yyyy',
    },
    {
        code: 'et-EE',
        language: 'Estonian (Estonia)',
        dateFormat: 'd.MM.yyyy',
    },
    {
        code: 'fo',
        language: 'Faroese',
        dateFormat: '',
    },
    {
        code: 'fo-FO',
        language: 'Faroese (Faroe Islands)',
        dateFormat: 'dd-MM-yyyy',
    },
    {
        code: 'fil',
        language: 'Filipino',
        dateFormat: '',
    },
    {
        code: 'fil-PH',
        language: 'Filipino (Philippines)',
        dateFormat: 'M/d/yyyy',
    },
    {
        code: 'fi',
        language: 'Finnish',
        dateFormat: '',
    },
    {
        code: 'fi-FI',
        language: 'Finnish (Finland)',
        dateFormat: 'd.M.yyyy',
    },
    {
        code: 'fr',
        language: 'French',
        dateFormat: '',
    },
    {
        code: 'fr-BE',
        language: 'French (Belgium)',
        dateFormat: 'd/MM/yyyy',
    },
    {
        code: 'fr-CA',
        language: 'French (Canada)',
        dateFormat: 'yyyy-MM-dd',
    },
    {
        code: 'fr-FR',
        language: 'French (France)',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'fr-LU',
        language: 'French (Luxembourg)',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'fr-MC',
        language: 'French (Monaco)',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'fr-CH',
        language: 'French (Switzerland)',
        dateFormat: 'dd.MM.yyyy',
    },
    {
        code: 'fy',
        language: 'Frisian',
        dateFormat: '',
    },
    {
        code: 'fy-NL',
        language: 'Frisian (Netherlands)',
        dateFormat: 'd-M-yyyy',
    },
    {
        code: 'gl',
        language: 'Galician',
        dateFormat: '',
    },
    {
        code: 'gl-ES',
        language: 'Galician (Galician)',
        dateFormat: 'dd/MM/yy',
    },
    {
        code: 'ka',
        language: 'Georgian',
        dateFormat: '',
    },
    {
        code: 'ka-GE',
        language: 'Georgian (Georgia)',
        dateFormat: 'dd.MM.yyyy',
    },
    {
        code: 'de',
        language: 'German',
        dateFormat: 'dd.MM.yyyy',
    },
    {
        code: 'de-AT',
        language: 'German (Austria)',
        dateFormat: 'dd.MM.yyyy',
    },
    {
        code: 'de-DE',
        language: 'German (Germany)',
        dateFormat: 'dd.MM.yyyy',
    },
    {
        code: 'de-LI',
        language: 'German (Liechtenstein)',
        dateFormat: 'dd.MM.yyyy',
    },
    {
        code: 'de-LU',
        language: 'German (Luxembourg)',
        dateFormat: 'dd.MM.yyyy',
    },
    {
        code: 'de-CH',
        language: 'German (Switzerland)',
        dateFormat: 'dd.MM.yyyy',
    },
    {
        code: 'el',
        language: 'Greek',
        dateFormat: 'd/M/yyyy',
    },
    {
        code: 'el-GR',
        language: 'Greek (Greece)',
        dateFormat: 'd/M/yyyy',
    },
    {
        code: 'kl',
        language: 'Greenlandic',
        dateFormat: '',
    },
    {
        code: 'kl-GL',
        language: 'Greenlandic (Greenland)',
        dateFormat: 'dd-MM-yyyy',
    },
    {
        code: 'gu',
        language: 'Gujarati',
        dateFormat: '',
    },
    {
        code: 'gu-IN',
        language: 'Gujarati (India)',
        dateFormat: 'dd-MM-yy',
    },
    {
        code: 'ha',
        language: 'Hausa',
        dateFormat: '',
    },
    {
        code: 'ha-Latn',
        language: 'Hausa (Latin)',
        dateFormat: 'd/M/yyyy',
    },
    {
        code: 'ha-Latn-NG',
        language: 'Hausa (Latin, Nigeria)',
        dateFormat: 'd/M/yyyy',
    },
    {
        code: 'he',
        language: 'Hebrew',
        dateFormat: '',
    },
    {
        code: 'he-IL',
        language: 'Hebrew (Israel)',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'hi',
        language: 'Hindi',
        dateFormat: '',
    },
    {
        code: 'hi-IN',
        language: 'Hindi (India)',
        dateFormat: 'dd-MM-yyyy',
    },
    {
        code: 'hu',
        language: 'Hungarian',
        dateFormat: '',
    },
    {
        code: 'hu-HU',
        language: 'Hungarian (Hungary)',
        dateFormat: 'yyyy. MM. dd.',
    },
    {
        code: 'is',
        language: 'Icelandic',
        dateFormat: '',
    },
    {
        code: 'is-IS',
        language: 'Icelandic (Iceland)',
        dateFormat: 'd.M.yyyy',
    },
    {
        code: 'ig',
        language: 'Igbo',
        dateFormat: '',
    },
    {
        code: 'ig-NG',
        language: 'Igbo (Nigeria)',
        dateFormat: 'd/M/yyyy',
    },
    {
        code: 'id',
        language: 'Indonesian',
        dateFormat: '',
    },
    {
        code: 'id-ID',
        language: 'Indonesian (Indonesia)',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'iu',
        language: 'Inuktitut',
        dateFormat: '',
    },
    {
        code: 'iu-Latn',
        language: 'Inuktitut (Latin)',
        dateFormat: '',
    },
    {
        code: 'iu-Latn-CA',
        language: 'Inuktitut (Latin, Canada)',
        dateFormat: 'd/MM/yyyy',
    },
    {
        code: 'iu-Cans',
        language: 'Inuktitut (Syllabics)',
        dateFormat: 'd/M/yyyy',
    },
    {
        code: 'iu-Cans-CA',
        language: 'Inuktitut (Syllabics, Canada)',
        dateFormat: 'd/M/yyyy',
    },
    {
        code: 'ga',
        language: 'Irish',
        dateFormat: '',
    },
    {
        code: 'ga-IE',
        language: 'Irish (Ireland)',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'it',
        language: 'Italian',
        dateFormat: '',
    },
    {
        code: 'it-IT',
        language: 'Italian (Italy)',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'it-CH',
        language: 'Italian (Switzerland)',
        dateFormat: 'dd.MM.yyyy',
    },
    {
        code: 'ja',
        language: 'Japanese',
        dateFormat: '',
    },
    {
        code: 'ja-JP',
        language: 'Japanese (Japan)',
        dateFormat: 'yyyy/MM/dd',
    },
    {
        code: 'kn',
        language: 'Kannada',
        dateFormat: '',
    },
    {
        code: 'kn-IN',
        language: 'Kannada (India)',
        dateFormat: 'dd-MM-yy',
    },
    {
        code: 'kk',
        language: 'Kazakh',
        dateFormat: '',
    },
    {
        code: 'kk-KZ',
        language: 'Kazakh (Kazakhstan)',
        dateFormat: 'dd.MM.yyyy',
    },
    {
        code: 'km',
        language: 'Khmer',
        dateFormat: '',
    },
    {
        code: 'km-KH',
        language: 'Khmer (Cambodia)',
        dateFormat: 'yyyy-MM-dd',
    },
    {
        code: 'rw',
        language: 'Kinyarwanda',
        dateFormat: '',
    },
    {
        code: 'rw-RW',
        language: 'Kinyarwanda (Rwanda)',
        dateFormat: 'M/d/yyyy',
    },
    {
        code: 'sw',
        language: 'Kiswahili',
        dateFormat: '',
    },
    {
        code: 'sw-KE',
        language: 'Kiswahili (Kenya)',
        dateFormat: 'M/d/yyyy',
    },
    {
        code: 'kok',
        language: 'Konkani',
        dateFormat: '',
    },
    {
        code: 'kok-IN',
        language: 'Konkani (India)',
        dateFormat: 'dd-MM-yyyy',
    },
    {
        code: 'ko',
        language: 'Korean',
        dateFormat: '',
    },
    {
        code: 'ko-KR',
        language: 'Korean (Korea)',
        dateFormat: 'yyyy. MM. dd',
    },
    {
        code: 'ky',
        language: 'Kyrgyz',
        dateFormat: '',
    },
    {
        code: 'ky-KG',
        language: 'Kyrgyz (Kyrgyzstan)',
        dateFormat: 'dd.MM.yy',
    },
    {
        code: 'lo',
        language: 'Lao',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'lv',
        language: 'Latvian',
        dateFormat: '',
    },
    {
        code: 'lv-LV',
        language: 'Latvian (Latvia)',
        dateFormat: 'yyyy.MM.dd.',
    },
    {
        code: 'lt',
        language: 'Lithuanian',
        dateFormat: '',
    },
    {
        code: 'lt-LT',
        language: 'Lithuanian (Lithuania)',
        dateFormat: 'yyyy.MM.dd',
    },
    {
        code: 'dsb',
        language: 'Lower Sorbian',
        dateFormat: 'd.M.yyyy',
    },
    {
        code: 'dsb-DE',
        language: 'Lower Sorbian (Germany)',
        dateFormat: 'd.M.yyyy',
    },
    {
        code: 'lb',
        language: 'Luxembourgish',
        dateFormat: '',
    },
    {
        code: 'lb-LU',
        language: 'Luxembourgish (Luxembourg)',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'mk',
        language: 'Macedonian (FYROM)',
        dateFormat: '',
    },
    {
        code: 'mk-MK',
        language: 'Macedonian (Former Yugoslav Republic of Macedonia)',
        dateFormat: 'dd.MM.yyyy',
    },
    {
        code: 'ms',
        language: 'Malay',
        dateFormat: '',
    },
    {
        code: 'ms-BN',
        language: 'Malay (Brunei Darussalam)',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'ms-MY',
        language: 'Malay (Malaysia)',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'ml',
        language: 'Malayalam',
        dateFormat: '',
    },
    {
        code: 'ml-IN',
        language: 'Malayalam (India)',
        dateFormat: 'dd-MM-yy',
    },
    {
        code: 'mt',
        language: 'Maltese',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'mt-MT',
        language: 'Maltese (Malta)',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'mni',
        language: 'Manipuri',
        dateFormat: '',
    },
    {
        code: 'mni-IN',
        language: 'Manipuri (India)',
        dateFormat: '',
    },
    {
        code: 'mi',
        language: 'Maori',
        dateFormat: '',
    },
    {
        code: 'mi-NZ',
        language: 'Maori (New Zealand)',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'arn',
        language: 'Mapudungun',
        dateFormat: 'dd-MM-yyyy',
    },
    {
        code: 'arn-CL',
        language: 'Mapudungun (Chile)',
        dateFormat: 'dd-MM-yyyy',
    },
    {
        code: 'mr',
        language: 'Marathi',
        dateFormat: '',
    },
    {
        code: 'mr-IN',
        language: 'Marathi (India)',
        dateFormat: 'dd-MM-yyyy',
    },
    {
        code: 'moh',
        language: 'Mohawk',
        dateFormat: '',
    },
    {
        code: 'moh-CA',
        language: 'Mohawk (Mohawk)',
        dateFormat: 'M/d/yyyy',
    },
    {
        code: 'mn',
        language: 'Mongolian',
        dateFormat: '',
    },
    {
        code: 'mn-Cyrl',
        language: 'Mongolian (Cyrillic)',
        dateFormat: '',
    },
    {
        code: 'mn-MN',
        language: 'Mongolian (Cyrillic, Mongolia)',
        dateFormat: 'yy.MM.dd',
    },
    {
        code: 'mn-Mong',
        language: 'Mongolian (Traditional Mongolian)',
        dateFormat: '',
    },
    {
        code: 'mn-Mong-MN',
        language: 'Mongolian (Traditional Mongolian, Mongolia)',
        dateFormat: '',
    },
    {
        code: 'mn-Mong-CN',
        language: 'Mongolian (Traditional Mongolian, PRC)',
        dateFormat: 'yyyy/M/d',
    },
    {
        code: 'ne',
        language: 'Nepali',
        dateFormat: '',
    },
    {
        code: 'ne-IN',
        language: 'Nepali (India)',
        dateFormat: '',
    },
    {
        code: 'ne-NP',
        language: 'Nepali (Nepal)',
        dateFormat: 'M/d/yyyy',
    },
    {
        code: 'no',
        language: 'Norwegian',
        dateFormat: '',
    },
    {
        code: 'nb',
        language: 'Norwegian (Bokmål)',
        dateFormat: '',
    },
    {
        code: 'nn',
        language: 'Norwegian (Nynorsk)',
        dateFormat: '',
    },
    {
        code: 'nb-NO',
        language: 'Norwegian, Bokmål (Norway)',
        dateFormat: 'dd.MM.yyyy',
    },
    {
        code: 'nn-NO',
        language: 'Norwegian, Nynorsk (Norway)',
        dateFormat: 'dd.MM.yyyy',
    },
    {
        code: 'oc',
        language: 'Occitan',
        dateFormat: '',
    },
    {
        code: 'oc-FR',
        language: 'Occitan (France)',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'or',
        language: 'Odia',
        dateFormat: '',
    },
    {
        code: 'or-IN',
        language: 'Odia (India)',
        dateFormat: 'dd-MM-yy',
    },
    {
        code: 'om',
        language: 'Oromo',
        dateFormat: '',
    },
    {
        code: 'om-ET',
        language: 'Oromo (Ethiopia)',
        dateFormat: '',
    },
    {
        code: 'pap',
        language: 'Papiamento',
        dateFormat: '',
    },
    {
        code: 'pap-029',
        language: 'Papiamento (Caribbean)',
        dateFormat: '',
    },
    {
        code: 'ps',
        language: 'Pashto',
        dateFormat: '',
    },
    {
        code: 'ps-AF',
        language: 'Pashto (Afghanistan)',
        dateFormat: 'dd/MM/yy',
    },
    {
        code: 'fa',
        language: 'Persian',
        dateFormat: 'MM/dd/yyyy',
    },
    {
        code: 'fa-IR',
        language: 'Persian (Iran)',
        dateFormat: 'MM/dd/yyyy',
    },
    {
        code: 'pl',
        language: 'Polish',
        dateFormat: '',
    },
    {
        code: 'pl-PL',
        language: 'Polish (Poland)',
        dateFormat: 'dd.MM.yyyy',
    },
    {
        code: 'pt',
        language: 'Portuguese',
        dateFormat: '',
    },
    {
        code: 'pt-BR',
        language: 'Portuguese (Brazil)',
        dateFormat: 'd/M/yyyy',
    },
    {
        code: 'pt-PT',
        language: 'Portuguese (Portugal)',
        dateFormat: 'dd-MM-yyyy',
    },
    {
        code: 'pa',
        language: 'Punjabi',
        dateFormat: '',
    },
    {
        code: 'pa-Arab',
        language: 'Punjabi (Arabic)',
        dateFormat: '',
    },
    {
        code: 'pa-IN',
        language: 'Punjabi (India)',
        dateFormat: 'dd-MM-yy',
    },
    {
        code: 'pa-Arab-PK',
        language: 'Punjabi (Islamic Republic of Pakistan)',
        dateFormat: '',
    },
    {
        code: 'quz',
        language: 'Quechua',
        dateFormat: '',
    },
    {
        code: 'quz-BO',
        language: 'Quechua (Bolivia)',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'quz-EC',
        language: 'Quechua (Ecuador)',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'quz-PE',
        language: 'Quechua (Peru)',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'ro',
        language: 'Romanian',
        dateFormat: '',
    },
    {
        code: 'ro-MD',
        language: 'Romanian (Moldova)',
        dateFormat: 'dd.MM.yyyy',
    },
    {
        code: 'ro-RO',
        language: 'Romanian (Romania)',
        dateFormat: 'dd.MM.yyyy',
    },
    {
        code: 'rm',
        language: 'Romansh',
        dateFormat: '',
    },
    {
        code: 'rm-CH',
        language: 'Romansh (Switzerland)',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'ru',
        language: 'Russian',
        dateFormat: '',
    },
    {
        code: 'ru-MD',
        language: 'Russian (Moldova)',
        dateFormat: '',
    },
    {
        code: 'ru-RU',
        language: 'Russian (Russia)',
        dateFormat: 'dd.MM.yyyy',
    },
    {
        code: 'sah',
        language: 'Sakha',
        dateFormat: '',
    },
    {
        code: 'sah-RU',
        language: 'Sakha (Russia)',
        dateFormat: 'MM.dd.yyyy',
    },
    {
        code: 'smn',
        language: 'Sami (Inari)',
        dateFormat: '',
    },
    {
        code: 'smj',
        language: 'Sami (Lule)',
        dateFormat: '',
    },
    {
        code: 'se',
        language: 'Sami (Northern)',
        dateFormat: '',
    },
    {
        code: 'sms',
        language: 'Sami (Skolt)',
        dateFormat: '',
    },
    {
        code: 'sma',
        language: 'Sami (Southern)',
        dateFormat: '',
    },
    {
        code: 'smn-FI',
        language: 'Sami, Inari (Finland)',
        dateFormat: 'd.M.yyyy',
    },
    {
        code: 'smj-NO',
        language: 'Sami, Lule (Norway)',
        dateFormat: 'dd.MM.yyyy',
    },
    {
        code: 'smj-SE',
        language: 'Sami, Lule (Sweden)',
        dateFormat: 'yyyy-MM-dd',
    },
    {
        code: 'se-FI',
        language: 'Sami, Northern (Finland)',
        dateFormat: 'd.M.yyyy',
    },
    {
        code: 'se-NO',
        language: 'Sami, Northern (Norway)',
        dateFormat: 'dd.MM.yyyy',
    },
    {
        code: 'se-SE',
        language: 'Sami, Northern (Sweden)',
        dateFormat: 'yyyy-MM-dd',
    },
    {
        code: 'sms-FI',
        language: 'Sami, Skolt (Finland)',
        dateFormat: '',
    },
    {
        code: 'sma-NO',
        language: 'Sami, Southern (Norway)',
        dateFormat: 'dd.MM.yyyy',
    },
    {
        code: 'sma-SE',
        language: 'Sami, Southern (Sweden)',
        dateFormat: 'yyyy-MM-dd',
    },
    {
        code: 'sa',
        language: 'Sanskrit',
        dateFormat: '',
    },
    {
        code: 'sa-IN',
        language: 'Sanskrit (India)',
        dateFormat: 'dd-MM-yyyy',
    },
    {
        code: 'gd',
        language: 'Scottish Gaelic',
        dateFormat: '',
    },
    {
        code: 'gd-GB',
        language: 'Scottish Gaelic (United Kingdom)',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'sr',
        language: 'Serbian',
        dateFormat: '',
    },
    {
        code: 'sr-Cyrl',
        language: 'Serbian (Cyrillic)',
        dateFormat: '',
    },
    {
        code: 'sr-Cyrl-BA',
        language: 'Serbian (Cyrillic, Bosnia and Herzegovina)',
        dateFormat: 'd.M.yyyy',
    },
    {
        code: 'sr-Cyrl-ME',
        language: 'Serbian (Cyrillic, Montenegro)',
        dateFormat: 'd.M.yyyy',
    },
    {
        code: 'sr-Cyrl-RS',
        language: 'Serbian (Cyrillic, Serbia)',
        dateFormat: 'd.M.yyyy',
    },
    {
        code: 'sr-Latn',
        language: 'Serbian (Latin)',
        dateFormat: 'd.M.yyyy',
    },
    {
        code: 'sr-Latn-BA',
        language: 'Serbian (Latin, Bosnia and Herzegovina)',
        dateFormat: 'd.M.yyyy',
    },
    {
        code: 'sr-Latn-ME',
        language: 'Serbian (Latin, Montenegro)',
        dateFormat: '',
    },
    {
        code: 'sr-Latn-RS',
        language: 'Serbian (Latin, Serbia)',
        dateFormat: 'd.M.yyyy',
    },
    {
        code: 'nso',
        language: 'Sesotho sa Leboa',
        dateFormat: '',
    },
    {
        code: 'nso-ZA',
        language: 'Sesotho sa Leboa (South Africa)',
        dateFormat: 'yyyy/MM/dd',
    },
    {
        code: 'tn',
        language: 'Setswana',
        dateFormat: '',
    },
    {
        code: 'tn-BW',
        language: 'Setswana (Botswana)',
        dateFormat: '',
    },
    {
        code: 'tn-ZA',
        language: 'Setswana (South Africa)',
        dateFormat: 'yyyy/MM/dd',
    },
    {
        code: 'sd',
        language: 'Sindhi',
        dateFormat: '',
    },
    {
        code: 'sd-Arab',
        language: 'Sindhi (Arabic)',
        dateFormat: '',
    },
    {
        code: 'sd-Deva-IN',
        language: 'Sindhi (Devanagari, India)',
        dateFormat: '',
    },
    {
        code: 'sd-Arab-PK',
        language: 'Sindhi (Islamic Republic of Pakistan)',
        dateFormat: '',
    },
    {
        code: 'si',
        language: 'Sinhala',
        dateFormat: '',
    },
    {
        code: 'si-LK',
        language: 'Sinhala (Sri Lanka)',
        dateFormat: 'yyyy-MM-dd',
    },
    {
        code: 'sk',
        language: 'Slovak',
        dateFormat: '',
    },
    {
        code: 'sk-SK',
        language: 'Slovak (Slovakia)',
        dateFormat: 'd. M. yyyy',
    },
    {
        code: 'sl',
        language: 'Slovenian',
        dateFormat: '',
    },
    {
        code: 'sl-SI',
        language: 'Slovenian (Slovenia)',
        dateFormat: 'd.M.yyyy',
    },
    {
        code: 'so',
        language: 'Somali',
        dateFormat: '',
    },
    {
        code: 'so-SO',
        language: 'Somali (Somalia)',
        dateFormat: '',
    },
    {
        code: 'es',
        language: 'Spanish',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'es-AR',
        language: 'Spanish (Argentina)',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'es-VE',
        language: 'Spanish (Bolivarian Republic of Venezuela)',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'es-BO',
        language: 'Spanish (Bolivia)',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'es-CL',
        language: 'Spanish (Chile)',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'es-CO',
        language: 'Spanish (Colombia)',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'es-CR',
        language: 'Spanish (Costa Rica)',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'es-CU',
        language: 'Spanish (Cuba)',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'es-DO',
        language: 'Spanish (Dominican Republic)',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'es-EC',
        language: 'Spanish (Ecuador)',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'es-SV',
        language: 'Spanish (El Salvador)',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'es-GT',
        language: 'Spanish (Guatemala)',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'es-HN',
        language: 'Spanish (Honduras)',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'es-419',
        language: 'Spanish (Latin America)',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'es-MX',
        language: 'Spanish (Mexico)',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'es-NI',
        language: 'Spanish (Nicaragua)',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'es-PA',
        language: 'Spanish (Panama)',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'es-PY',
        language: 'Spanish (Paraguay)',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'es-PE',
        language: 'Spanish (Peru)',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'es-PR',
        language: 'Spanish (Puerto Rico)',
        dateFormat: '',
    },
    {
        code: 'es-ES',
        language: 'Spanish (Spain)',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'es-US',
        language: 'Spanish (United States)',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'es-UY',
        language: 'Spanish (Uruguay)',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'sv',
        language: 'Swedish',
        dateFormat: '',
    },
    {
        code: 'sv-FI',
        language: 'Swedish (Finland)',
        dateFormat: 'd.M.yyyy',
    },
    {
        code: 'sv-SE',
        language: 'Swedish (Sweden)',
        dateFormat: 'yyyy-MM-dd',
    },
    {
        code: 'syr',
        language: 'Syriac',
        dateFormat: '',
    },
    {
        code: 'syr-SY',
        language: 'Syriac (Syria)',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'tg',
        language: 'Tajik',
        dateFormat: '',
    },
    {
        code: 'tg-Cyrl',
        language: 'Tajik (Cyrillic)',
        dateFormat: '',
    },
    {
        code: 'tg-Cyrl-TJ',
        language: 'Tajik (Cyrillic, Tajikistan)',
        dateFormat: 'dd.MM.yy',
    },
    {
        code: 'tzm',
        language: 'Tamazight',
        dateFormat: '',
    },
    {
        code: 'tzm-Latn',
        language: 'Tamazight (Latin)',
        dateFormat: '',
    },
    {
        code: 'tzm-Latn-DZ',
        language: 'Tamazight (Latin, Algeria)',
        dateFormat: 'dd-MM-yyyy',
    },
    {
        code: 'tzm-Tfng',
        language: 'Tamazight (Tifinagh)',
        dateFormat: '',
    },
    {
        code: 'ta',
        language: 'Tamil',
        dateFormat: '',
    },
    {
        code: 'ta-IN',
        language: 'Tamil (India)',
        dateFormat: 'dd-MM-yyyy',
    },
    {
        code: 'tt',
        language: 'Tatar',
        dateFormat: '',
    },
    {
        code: 'tt-RU',
        language: 'Tatar (Russia)',
        dateFormat: 'dd.MM.yyyy',
    },
    {
        code: 'te',
        language: 'Telugu',
        dateFormat: '',
    },
    {
        code: 'te-IN',
        language: 'Telugu (India)',
        dateFormat: 'dd-MM-yy',
    },
    {
        code: 'th',
        language: 'Thai',
        dateFormat: '',
    },
    {
        code: 'th-TH',
        language: 'Thai (Thailand)',
        dateFormat: 'd/M/yyyy',
    },
    {
        code: 'bo',
        language: 'Tibetan',
        dateFormat: 'yyyy/M/d',
    },
    {
        code: 'bo-CN',
        language: 'Tibetan (PRC)',
        dateFormat: 'yyyy/M/d',
    },
    {
        code: 'ti',
        language: 'Tigrinya',
        dateFormat: '',
    },
    {
        code: 'ti-ER',
        language: 'Tigrinya (Eritrea)',
        dateFormat: '',
    },
    {
        code: 'ti-ET',
        language: 'Tigrinya (Ethiopia)',
        dateFormat: '',
    },
    {
        code: 'ts',
        language: 'Tsonga',
        dateFormat: '',
    },
    {
        code: 'ts-ZA',
        language: 'Tsonga (South Africa)',
        dateFormat: '',
    },
    {
        code: 'tr',
        language: 'Turkish',
        dateFormat: '',
    },
    {
        code: 'tr-TR',
        language: 'Turkish (Turkey)',
        dateFormat: 'dd.MM.yyyy',
    },
    {
        code: 'tk',
        language: 'Turkmen',
        dateFormat: '',
    },
    {
        code: 'tk-TM',
        language: 'Turkmen (Turkmenistan)',
        dateFormat: 'dd.MM.yy',
    },
    {
        code: 'uk',
        language: 'Ukrainian',
        dateFormat: '',
    },
    {
        code: 'uk-UA',
        language: 'Ukrainian (Ukraine)',
        dateFormat: 'dd.MM.yyyy',
    },
    {
        code: 'hsb',
        language: 'Upper Sorbian',
        dateFormat: '',
    },
    {
        code: 'hsb-DE',
        language: 'Upper Sorbian (Germany)',
        dateFormat: 'd.M.yyyy',
    },
    {
        code: 'ur',
        language: 'Urdu',
        dateFormat: '',
    },
    {
        code: 'ur-IN',
        language: 'Urdu (India)',
        dateFormat: '',
    },
    {
        code: 'ur-PK',
        language: 'Urdu (Islamic Republic of Pakistan)',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'ug',
        language: 'Uyghur',
        dateFormat: '',
    },
    {
        code: 'ug-CN',
        language: 'Uyghur (PRC)',
        dateFormat: 'yyyy-M-d',
    },
    {
        code: 'uz',
        language: 'Uzbek',
        dateFormat: '',
    },
    {
        code: 'uz-Cyrl',
        language: 'Uzbek (Cyrillic)',
        dateFormat: '',
    },
    {
        code: 'uz-Cyrl-UZ',
        language: 'Uzbek (Cyrillic, Uzbekistan)',
        dateFormat: 'dd.MM.yyyy',
    },
    {
        code: 'uz-Latn',
        language: 'Uzbek (Latin)',
        dateFormat: '',
    },
    {
        code: 'uz-Latn-UZ',
        language: 'Uzbek (Latin, Uzbekistan)',
        dateFormat: 'dd/MM yyyy',
    },
    {
        code: 've',
        language: 'Venda',
        dateFormat: '',
    },
    {
        code: 've-ZA',
        language: 'Venda (South Africa)',
        dateFormat: '',
    },
    {
        code: 'vi',
        language: 'Vietnamese',
        dateFormat: '',
    },
    {
        code: 'vi-VN',
        language: 'Vietnamese (Vietnam)',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'cy',
        language: 'Welsh',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'cy-GB',
        language: 'Welsh (United Kingdom)',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'wo',
        language: 'Wolof',
        dateFormat: '',
    },
    {
        code: 'wo-SN',
        language: 'Wolof (Senegal)',
        dateFormat: 'dd/MM/yyyy',
    },
    {
        code: 'ii',
        language: 'Yi',
        dateFormat: '',
    },
    {
        code: 'ii-CN',
        language: 'Yi (PRC)',
        dateFormat: 'yyyy/M/d',
    },
    {
        code: 'yi',
        language: 'Yiddish',
        dateFormat: '',
    },
    {
        code: 'yi-001',
        language: 'Yiddish (World)',
        dateFormat: '',
    },
    {
        code: 'yo',
        language: 'Yoruba',
        dateFormat: '',
    },
    {
        code: 'yo-NG',
        language: 'Yoruba (Nigeria)',
        dateFormat: 'd/M/yyyy',
    },
    {
        code: 'xh',
        language: 'isiXhosa',
        dateFormat: '',
    },
    {
        code: 'xh-ZA',
        language: 'isiXhosa (South Africa)',
        dateFormat: 'yyyy/MM/dd',
    },
    {
        code: 'zu',
        language: 'isiZulu',
        dateFormat: '',
    },
    {
        code: 'zu-ZA',
        language: 'isiZulu (South Africa)',
        dateFormat: 'yyyy/MM/dd',
    },
];

const VALID_TASK_INPUT_AUDIO = ['audio/wave', 'audio/x-wave', 'audio/wav', 'audio/x-wav', 'audio/vnd.wave', 'application/json', 'text/plain'];
function isValidTaskInputAudioFile(mimetype) {
    return VALID_TASK_INPUT_AUDIO.includes(mimetype);
}
function isURL(url) {
    if (url === undefined || url === null) {
        return false;
    }
    const matches = /^https?:\/\//g.exec(url);
    return matches !== null && matches.length > 0;
}
function joinURL(...args) {
    return args
        .map((a) => {
        const httpsArr = /(https?:\/\/)/g.exec(a);
        const https = httpsArr ? httpsArr[1] : '';
        const result = https + a.replace(/https?:\/\//g, '').replace(/(^\/+)|(\/$)/g, '');
        return result;
    })
        .filter((a) => a !== null && a !== undefined && a !== '')
        .join('/');
}
function escapeRegex(regexStr) {
    // escape special chars in regex
    return regexStr.replace(/[-/\\^$*+?ß%.()|[\]{}]/g, '\\$&');
}
function convertToUnixPath(path) {
    return path.replace(/\\+/g, '/');
}
function convertToWindowsPath(path) {
    return path.replace(/\/+/g, '\\');
}
function sum(array) {
    let result = 0;
    array.map((a) => {
        result += a;
        return a;
    });
    return result;
}

class AccountFieldDefinition2 {
}
class AccountFieldHeadline extends AccountFieldDefinition2 {
    constructor(partial) {
        super();
        Object.assign(this, partial);
    }
}
class AccountFieldControl extends AccountFieldDefinition2 {
    constructor(partial) {
        super();
        this.isRequired = false;
        Object.assign(this, partial);
    }
}
class AccountFieldRadio extends AccountFieldControl {
    constructor(partial) {
        super(partial);
        Object.assign(this, partial);
    }
}
class AccountFieldInlineText extends AccountFieldControl {
    constructor(partial) {
        super(partial);
        Object.assign(this, partial);
    }
}
class AccountFieldTextArea extends AccountFieldControl {
    constructor(partial) {
        super(partial);
        Object.assign(this, partial);
    }
}
class AccountCategorySelection extends AccountFieldControl {
    constructor(partial) {
        super(partial);
        this.multipleResults = false;
        Object.assign(this, partial);
    }
}
class AccountFieldMultipleChoice extends AccountFieldControl {
    constructor(partial) {
        super(partial);
        Object.assign(this, partial);
    }
}
class AccountFieldValue {
    constructor(partial) {
        Object.assign(this, partial);
    }
}
function generateLanguageOptions() {
    return LANGUAGES.map((a) => ({
        label: {
            en: a.language,
        },
        value: a.language,
    }));
}

const LANGUAGE_SKILL_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const OctraDefaultToolConfiguration = {
    version: '1.1.0',
    logging: {
        forced: true,
    },
    navigation: {
        export: true,
        interfaces: true,
        help_url: 'https://www.phonetik.uni-muenchen.de/apps/octra/manual/',
    },
    responsive: {
        enabled: true,
        fixedwidth: 1200,
    },
    agreement: {
        enabled: false,
        text: {
            de: "<p>Ich erkläre, dass ich die Probandeninformation zur Studie <b>'Optimale Webbasierte Transkription langer Audiodateien'</b> und diese Einverständniserklärung zur Studienteilnahme erhalten habe.</p><ul><li>Ich wurde für mich ausreichend mündlich und/oder schriftlich über die wissenschaftliche Untersuchunginformiert.</li><li>Ich erkläre mich bereit, dass ihm Rahmen der Studie Daten über mein Anwenderverhalten gesammelt unddiese anonymisiert aufgezeichnet werden. Es wird gewährleistet, dass meine personenbezogenen Daten nichtan Dritte außerhalb der LMU weitergegeben werden. In anonymisierter Form dürfen die Daten fürwissenschaftliche Untersuchungen, Publikationen und in der Lehre verwendet werden. Meine persönlichenDaten unterliegen dem Datenschutzgesetz.</li><li>Ich weiß, dass ich jederzeit meine Einverständniserklärung, ohne Angabe von Gründen, widerrufen kann,ohne dass dies für mich nachteilige Folgen hat.</li><li>Mit der vorstehend geschilderten Vorgehensweise bin ich einverstanden und bestätige dies mit dem Klick auf Akzeptieren'</li></ul>",
        },
    },
    plugins: {
        pdfexport: {
            url: 'https://www.phonetik.uni-muenchen.de/apps/octra/pdfconverter/',
        },
    },
    languages: ['de', 'en'],
    interfaces: ['Dictaphone Editor', 'Linear Editor', '2D-Editor', 'TRN-Editor'],
    feedback_form: [
        {
            title: {
                de: 'Sprachverständlichkeit des Sprechers',
            },
            name: 'quality-speaker',
            controls: [
                {
                    type: 'radiobutton',
                    label: {
                        de: 'unverständlich',
                        en: 'incomprehensible',
                    },
                    value: 'incomprehensible',
                    custom: {},
                    required: true,
                },
                {
                    type: 'radiobutton',
                    label: {
                        de: 'weniger verständlich',
                        en: 'unclear',
                    },
                    value: 'unclear',
                    custom: {},
                    required: true,
                },
                {
                    type: 'radiobutton',
                    label: {
                        de: 'verständlich',
                        en: 'clear',
                    },
                    value: 'clear',
                    custom: {},
                    required: true,
                },
                {
                    type: 'radiobutton',
                    label: {
                        de: 'keine Sprache',
                        en: 'no speech',
                    },
                    value: 'no speech',
                    custom: {},
                    required: true,
                },
            ],
        },
        {
            title: {
                de: 'Qualität des Audiosignals',
            },
            name: 'quality-audio',
            controls: [
                {
                    type: 'radiobutton',
                    label: {
                        de: 'starke Störgeräusche',
                        en: 'very noisy',
                    },
                    value: 'very noisy',
                    custom: {},
                    required: true,
                },
                {
                    type: 'radiobutton',
                    label: {
                        de: 'leichte Störgeräusche',
                        en: 'some noise',
                    },
                    value: 'some noise',
                    custom: {},
                    required: true,
                },
                {
                    type: 'radiobutton',
                    label: {
                        de: 'keine Störgeräusche',
                        en: 'no noise',
                    },
                    value: 'no noise',
                    custom: {},
                    required: true,
                },
                {
                    type: 'radiobutton',
                    label: {
                        de: 'kein Signal',
                        en: 'no signal',
                    },
                    value: 'no signal',
                    custom: {},
                    required: true,
                },
            ],
        },
    ],
    octra: {
        validationEnabled: true,
        sendValidatedTranscriptionOnly: false,
        showOverviewIfTranscriptNotValid: false,
        theme: 'shortAudioFiles',
    },
    guidelines: {
        showExampleNumbers: false,
        showExampleHeader: false,
    },
};

export { AccountBatchAction, AccountBatchActionDto, AccountCategorySelection, AccountChangeDto, AccountCreateRequestDto, AccountDto, AccountFieldContext, AccountFieldControl, AccountFieldDefinition, AccountFieldDefinition2, AccountFieldDefinitionCreateDto, AccountFieldDefinitionCreateDtoDefinition, AccountFieldDefinitionDto, AccountFieldDefinitionType, AccountFieldHeadline, AccountFieldInlineText, AccountFieldMultipleChoice, AccountFieldRadio, AccountFieldTextArea, AccountFieldValue, AccountFieldValueDefinitionDto, AccountLoginMethod, AccountMinimalDto, AccountPersonGender, AccountProjectRoleDto, AccountProjectRoleDto2, AccountRegisterRequestDto, AccountRole, AccountRoleScope, AccountSearchResultDto, AccountSettingsDto, AccountStatisticItemDto, AllAccountStatistics, AllAccountStatisticsRoles, AllAccountsGenderStatistics, AllAccountsSystemRolesStatistics, AllProjectsStatistics, AllStatisticsDto, AllStatisticsTasksDto, AppTokenChangeDto, AppTokenCreateDto, AppTokenDto, AuthDto, AuthDtoMe, COUNTRYSTATES, ChangeAccountInformationDto, ChangeMyPassword400Response, ChangePasswordDto, ChangeTaskData404Response, ContentType, CurrentAccountDto, CurrentAccountDtoSystemRole, FileProjectDto, GeneralSettingsDto, GetAccountInformation404Response, GetProject404Response, GlobalUserRole, LANGUAGES, LANGUAGE_SKILL_LEVELS, ListRoles401Response, ListRoles403Response, Login401Response, LoginRequest, LoginRequestOneOf, LoginRequestOneOf1, OctraDefaultToolConfiguration, PolicyChangeRequestDto, PolicyCreateRequestDto, PolicyCreateTranslationDto, PolicyDto, PolicyMinimalDto, PolicyPublishRequestDto, PolicyPublishRequestItemDto, PolicyTranslationDto, PolicyTranslationViewDto, PolicyType, ProjectAccountDto, ProjectAssignRoleDto, ProjectDto, ProjectDtoStatistics, ProjectDtoStatusStatistics, ProjectDtoTasksStatistics, ProjectFieldDefinitionDto, ProjectFileUploadDto, ProjectRemoveRequestDto, ProjectRequestDto, ProjectRoleDto, ProjectRoleResultDto, ProjectStatisticsDto, ProjectStatisticsDtoTasks, ProjectTempFileEntryDto, ProjectUserRole, ProjectVisibility, Properties, ResetPasswordRequestDto, RoleBadgeSettings, RoleCreateDto, RoleDto, RunBatchAction400Response, StatisticsProjectRoleDto, SupportedTaskDto, SupportedTaskDtoStyle, SupportedTaskTypeSetDefinition, SupportedTaskTypeStatement, SupportedTaskTypesConstraints, SystemRoleDto, TIMEZONE_NAMES, TaskBatchSessionDto, TaskBatchTransactionDto, TaskBatchUploadDto, TaskChangeDto, TaskChangeDtoProperties, TaskDto, TaskInputOutputCreatorType, TaskInputOutputDto, TaskListInputOutputDto, TaskListItemDto, TaskProperties, TaskSaveDto, TaskSaveDtoProperties, TaskSaveProperties, TaskStartActionDto, TaskStatus, TaskUploadDto, ToolChangeRequestDto, ToolConfigurationAssetChangeDto, ToolConfigurationAssetDto, ToolConfigurationChangeDto, ToolConfigurationCreateDto, ToolConfigurationDto, ToolConfigurationMinimalDto, ToolDto, ToolMinimalDto, ToolProcessingType, ToolType, VALID_TASK_INPUT_AUDIO, convertToUnixPath, convertToWindowsPath, escapeRegex, generateLanguageOptions, isURL, isValidTaskInputAudioFile, joinURL, sum };
