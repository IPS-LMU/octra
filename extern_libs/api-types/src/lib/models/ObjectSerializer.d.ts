export * from '../models/AccountBatchActionDto';
export * from '../models/AccountChangeDto';
export * from '../models/AccountCreateRequestDto';
export * from '../models/AccountDto';
export * from '../models/AccountFieldDefinition';
export * from '../models/AccountFieldDefinitionCreateDto';
export * from '../models/AccountFieldDefinitionCreateDtoDefinition';
export * from '../models/AccountFieldDefinitionDto';
export * from '../models/AccountFieldValueDefinitionDto';
export * from '../models/AccountMinimalDto';
export * from '../models/AccountProjectRoleDto';
export * from '../models/AccountProjectRoleDto2';
export * from '../models/AccountRegisterRequestDto';
export * from '../models/AccountSearchResultDto';
export * from '../models/AccountSettingsDto';
export * from '../models/AccountStatisticItemDto';
export * from '../models/AllAccountsGenderStatistics';
export * from '../models/AllAccountsSystemRolesStatistics';
export * from '../models/AllAccountStatistics';
export * from '../models/AllAccountStatisticsRoles';
export * from '../models/AllProjectsStatistics';
export * from '../models/AllStatisticsDto';
export * from '../models/AllStatisticsTasksDto';
export * from '../models/AppTokenChangeDto';
export * from '../models/AppTokenCreateDto';
export * from '../models/AppTokenDto';
export * from '../models/AuthDto';
export * from '../models/AuthDtoMe';
export * from '../models/ChangeAccountInformationDto';
export * from '../models/ChangeMyPassword400Response';
export * from '../models/ChangePasswordDto';
export * from '../models/ChangeTaskData404Response';
export * from '../models/CurrentAccountDto';
export * from '../models/CurrentAccountDtoSystemRole';
export * from '../models/FileProjectDto';
export * from '../models/GeneralSettingsDto';
export * from '../models/GetAccountInformation404Response';
export * from '../models/GetProject404Response';
export * from '../models/ListRoles401Response';
export * from '../models/ListRoles403Response';
export * from '../models/Login401Response';
export * from '../models/LoginRequest';
export * from '../models/LoginRequestOneOf';
export * from '../models/LoginRequestOneOf1';
export * from '../models/PolicyChangeRequestDto';
export * from '../models/PolicyCreateRequestDto';
export * from '../models/PolicyCreateTranslationDto';
export * from '../models/PolicyDto';
export * from '../models/PolicyMinimalDto';
export * from '../models/PolicyPublishRequestDto';
export * from '../models/PolicyPublishRequestItemDto';
export * from '../models/PolicyTranslationDto';
export * from '../models/PolicyTranslationViewDto';
export * from '../models/ProjectAccountDto';
export * from '../models/ProjectAssignRoleDto';
export * from '../models/ProjectDto';
export * from '../models/ProjectDtoStatistics';
export * from '../models/ProjectDtoStatusStatistics';
export * from '../models/ProjectDtoTasksStatistics';
export * from '../models/ProjectFieldDefinitionDto';
export * from '../models/ProjectFileUploadDto';
export * from '../models/ProjectRemoveRequestDto';
export * from '../models/ProjectRequestDto';
export * from '../models/ProjectRoleDto';
export * from '../models/ProjectRoleResultDto';
export * from '../models/ProjectStatisticsDto';
export * from '../models/ProjectStatisticsDtoTasks';
export * from '../models/ProjectTempFileEntryDto';
export * from '../models/Properties';
export * from '../models/ResetPasswordRequestDto';
export * from '../models/RoleCreateDto';
export * from '../models/RoleDto';
export * from '../models/RunBatchAction400Response';
export * from '../models/StatisticsProjectRoleDto';
export * from '../models/SupportedTaskDto';
export * from '../models/SupportedTaskDtoStyle';
export * from '../models/SupportedTaskTypesConstraints';
export * from '../models/SupportedTaskTypeSetDefinition';
export * from '../models/SupportedTaskTypeStatement';
export * from '../models/SystemRoleDto';
export * from '../models/TaskBatchSessionDto';
export * from '../models/TaskBatchTransactionDto';
export * from '../models/TaskBatchUploadDto';
export * from '../models/TaskChangeDto';
export * from '../models/TaskChangeDtoProperties';
export * from '../models/TaskDto';
export * from '../models/TaskInputOutputDto';
export * from '../models/TaskListInputOutputDto';
export * from '../models/TaskListItemDto';
export * from '../models/TaskProperties';
export * from '../models/TaskSaveDto';
export * from '../models/TaskSaveDtoProperties';
export * from '../models/TaskSaveProperties';
export * from '../models/TaskStartActionDto';
export * from '../models/TaskUploadDto';
export * from '../models/ToolChangeRequestDto';
export * from '../models/ToolConfigurationAssetChangeDto';
export * from '../models/ToolConfigurationAssetDto';
export * from '../models/ToolConfigurationChangeDto';
export * from '../models/ToolConfigurationCreateDto';
export * from '../models/ToolConfigurationDto';
export * from '../models/ToolConfigurationMinimalDto';
export * from '../models/ToolDto';
export * from '../models/ToolMinimalDto';
export declare class ObjectSerializer {
    static findCorrectType(data: any, expectedType: string): any;
    static serialize(data: any, type: string, format: string): any;
    static deserialize(data: any, type: string, format: string): any;
    /**
     * Normalize media type
     *
     * We currently do not handle any media types attributes, i.e. anything
     * after a semicolon. All content is assumed to be UTF-8 compatible.
     */
    static normalizeMediaType(mediaType: string | undefined): string | undefined;
    /**
     * From a list of possible media types, choose the one we can handle best.
     *
     * The order of the given media types does not have any impact on the choice
     * made.
     */
    static getPreferredMediaType(mediaTypes: Array<string>): string;
    /**
     * Convert data to a string according the given media type
     */
    static stringify(data: any, mediaType: string): string;
    /**
     * Parse data from a string according to the given media type
     */
    static parse(rawData: string, mediaType: string | undefined): any;
}
