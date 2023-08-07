import { HttpClient, HttpEvent } from '@angular/common/http';
import { AccountBatchActionDto, AccountChangeDto, AccountCreateRequestDto, AccountDto, AccountFieldValueDefinitionDto, AccountLoginMethod, AccountMinimalDto, AccountSearchResultDto, AccountSettingsDto, AllStatisticsDto, AppTokenChangeDto, AppTokenCreateDto, AppTokenDto, AuthDto, ChangeAccountInformationDto, CurrentAccountDto, PolicyCreateRequestDto, PolicyCreateTranslationDto, PolicyDto, PolicyMinimalDto, PolicyPublishRequestDto, PolicyTranslationDto, ProjectDto, ProjectRequestDto, ProjectRoleDto, ProjectRoleResultDto, ProjectStatisticsDto, ProjectTempFileEntryDto, ResetPasswordRequestDto, RoleCreateDto, RoleDto, TaskBatchSessionDto, TaskDto, TaskProperties, TaskSaveDtoProperties, TaskStartActionDto, ToolChangeRequestDto, ToolConfigurationChangeDto, ToolConfigurationCreateDto, ToolConfigurationDto, ToolDto } from '@octra/api-types';
import { Observable } from 'rxjs';
import * as i0 from "@angular/core";
export declare class OctraAPIService {
    private http;
    get apiURL(): string;
    get authType(): AccountLoginMethod | undefined;
    get authenticated(): boolean;
    set webToken(value: string | undefined);
    private appToken;
    private useCookieStrategy;
    private _webToken?;
    private _apiURL;
    get initialized(): boolean;
    private _initialized;
    private _authenticated;
    private _authType?;
    constructor(http: HttpClient);
    init(apiURL: string, appToken: string, webToken: string | undefined, useCookieStrategy: boolean): void;
    login(type: AccountLoginMethod, usernameOrEmail?: string, password?: string): Observable<AuthDto>;
    /**
     * does logout process
     */
    logout(): Observable<unknown>;
    /***
     * lists the app tokens.
     */
    listAppTokens(): Observable<AppTokenDto[]>;
    /***
     * returns one specific apptoken.
     */
    getAppToken(id: string): Observable<AppTokenDto>;
    getTask(projectID: string, taskID: string): Observable<TaskDto>;
    listTasks(projectID: string, order?: 'desc' | 'asc', start?: number, length?: number): Observable<TaskDto[]>;
    listToolConfigurations(projectID: string): Observable<ToolConfigurationDto[]>;
    changeToolConfiguration(projectId: string, configId: string, dto: ToolConfigurationChangeDto): Observable<ToolConfigurationDto>;
    deleteToolConfiguration(projectId: string, configId: string): Observable<void>;
    createToolConfiguration(projectId: string, dto: ToolConfigurationCreateDto): Observable<ToolConfigurationDto>;
    removeAppToken(id: string): Observable<void>;
    getProject(id: string): Observable<ProjectDto>;
    listAccounts(): Observable<AccountMinimalDto[]>;
    listProjects(manageable?: boolean): Observable<ProjectDto[]>;
    listTools(): Observable<ToolDto[]>;
    getTool(id: string): Observable<ToolDto>;
    installTool(folder: string): Observable<ToolDto>;
    changeTool(id: string, dto: ToolChangeRequestDto): Observable<ToolDto>;
    removeTool(id: string): Observable<void>;
    listProjectRoles(projectID: string): Observable<ProjectRoleDto[]>;
    listProjectTempFiles(projectID: string, path?: string): Observable<ProjectTempFileEntryDto[]>;
    createProject(projectData: ProjectRequestDto): Observable<ProjectDto>;
    removeProject(id: string, reqData: {
        removeProjectFiles?: boolean;
    }): Observable<void>;
    removeAccount(id: string): Observable<void>;
    changeMyPassword(oldPassword: string, newPassword: string): Observable<void>;
    getMyAccountInformation(): Observable<CurrentAccountDto>;
    getMyAccountPersonalInformation(): Observable<AccountDto>;
    createLocalAccount(dto: AccountCreateRequestDto): Observable<AccountDto>;
    changeProject(id: string, requestData: ProjectRequestDto): Observable<void>;
    createAppToken(tokenData: AppTokenCreateDto): Observable<boolean>;
    changeAppToken(id: string, tokenData: AppTokenChangeDto): Observable<AppTokenDto>;
    refreshAppToken(id: string): Observable<AppTokenDto>;
    getAllStatistics(): Observable<AllStatisticsDto>;
    startTask(projectID: string, data: TaskStartActionDto): Observable<TaskDto>;
    saveTask(projectID: string, taskID: string, properties: TaskSaveDtoProperties, outputs?: File[]): Observable<TaskDto>;
    freeTask(projectID: string, taskID: string): Observable<TaskDto>;
    uploadTaskData(project_id: string, properties: TaskProperties, inputs: File[], outputs?: File[]): Observable<HttpEvent<unknown>>;
    uploadTaskArchive(project_id: string, files: File[]): Observable<HttpEvent<unknown>>;
    startBatchSession(project_id: string): Observable<TaskBatchSessionDto>;
    cancelBatchSession(project_id: string, session_id: string, session_timestamp: number): Observable<void>;
    submitBatchSession(project_id: string, session_id: string, session_timestamp: number): Observable<void>;
    addBatchUploadTaskData(session_timestamp: number, session_id: string, project_id: string, properties: TaskProperties, inputs: File[], outputs?: File[]): Observable<HttpEvent<unknown>>;
    removeTask(project_id: string, task_id: string): Observable<void>;
    listMyAccountFields(): Observable<AccountFieldValueDefinitionDto[]>;
    getProjectStatistics(id: string): Observable<ProjectStatisticsDto>;
    saveMyAccountFieldValues(data: Record<string, any>): Observable<void>;
    saveMyAccountSettings(data: AccountSettingsDto): Observable<void>;
    listRoles(): Observable<RoleDto[]>;
    getRole(id: string): Observable<RoleDto>;
    requestPasswordReset(dto: ResetPasswordRequestDto): Observable<any>;
    runAccountBatchAction(dto: AccountBatchActionDto): Observable<void>;
    createRole(dto: RoleCreateDto): Observable<RoleDto>;
    changeRole(id: string, dto: RoleCreateDto): Observable<RoleDto>;
    removeRole(id: string): Observable<void>;
    searchAccounts(keyword: string): Observable<AccountSearchResultDto[]>;
    assignProjectRoles(project_id: string, dto: any[]): Observable<any[]>;
    saveMyPersonalAccountInformation(data: ChangeAccountInformationDto): Observable<void>;
    changeProjectRole(project_id: string, role_id: string, data: any): Observable<ProjectRoleResultDto>;
    removeProjectRole(project_id: string, account_id: string): Observable<void>;
    getAccountInformation(id: string): Observable<AccountDto>;
    saveAccountInformation(id: string, dto: AccountChangeDto): Observable<AccountDto>;
    listPolicies(): Observable<PolicyMinimalDto[]>;
    createPolicy(dto: PolicyCreateRequestDto): Observable<PolicyDto>;
    getPolicy(id: number): Observable<PolicyDto>;
    updatePolicy(id: number, dto: any): Observable<PolicyDto>;
    createPolicyTranslation(policy_id: number, dto: PolicyCreateTranslationDto): Observable<PolicyTranslationDto>;
    changePolicyTranslation(policy_id: number, policy_translation_id: number, dto: PolicyCreateTranslationDto): Observable<PolicyTranslationDto>;
    removePolicy(policy_id: number): Observable<void>;
    publishPolicies(dto: PolicyPublishRequestDto): Observable<unknown>;
    removePolicyTranslation(policy_id: number, translation_id: number): Observable<void>;
    private get;
    private post;
    private put;
    private del;
    private getHeaders;
    getCookie(cname: string): string | undefined;
    prepareFileURL(fileURL: string): string;
    postOnNewTab(partURL: string, data: any): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<OctraAPIService, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<OctraAPIService>;
}
