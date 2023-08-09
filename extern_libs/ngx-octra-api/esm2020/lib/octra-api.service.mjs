import * as i0 from '@angular/core';
import {Injectable} from '@angular/core';
import * as i1 from '@angular/common/http';
import {exhaustMap, map, of, throwError} from 'rxjs';
import {removeNullAttributes} from './functions';

export class OctraAPIService {
    get apiURL() {
        return this._apiURL;
    }
    get authType() {
        return this._authType;
    }
    get authenticated() {
        return this._authenticated;
    }
    set webToken(value) {
        this._webToken = value;
    }
    get initialized() {
        return this._initialized;
    }
    constructor(http) {
        this.http = http;
        this.appToken = '';
        this.useCookieStrategy = false;
        this._webToken = '';
        this._apiURL = '';
        this._initialized = false;
        this._authenticated = false;
    }
    init(apiURL, appToken, webToken, useCookieStrategy) {
        this._apiURL = apiURL;
        this.appToken = appToken;
        this.useCookieStrategy = useCookieStrategy;
        this._authenticated = this.getCookie('ocb_authenticated') !== undefined;
        this._authType = this.getCookie('ocb_authenticated');
        this._webToken = webToken;
        this._initialized = true;
    }
    login(type, usernameOrEmail, password) {
        let data = {
            type,
            usernameOrEmail,
            password,
            useCookies: this.useCookieStrategy,
        };
        data = removeNullAttributes(data);
        return this.http
            .post(`${this._apiURL}/auth/login`, data, {
            headers: this.getHeaders(false),
        })
            .pipe(exhaustMap((dto) => {
            if (!dto.openURL && dto.accessToken) {
                if (!this.useCookieStrategy) {
                    this._webToken = dto.accessToken;
                }
                this._authenticated = true;
                return of(dto);
            }
            else if (dto.openURL && dto.openURL.trim() !== '') {
                return of(dto);
            }
            return throwError(() => new Error("Can't read login response"));
        }));
    }
    /**
     * does logout process
     */
    logout() {
        return this.post(`/auth/logout`, undefined, true);
    }
    /***
     * lists the app tokens.
     */
    listAppTokens() {
        return this.get('/app/tokens', true);
    }
    /***
     * returns one specific apptoken.
     */
    getAppToken(id) {
        return this.get(`/app/tokens/${id}`, true);
    }
    getTask(projectID, taskID) {
        return this.get(`/projects/${projectID}/tasks/${taskID}`, true);
    }
    listTasks(projectID, order, start, length) {
        const query = [];
        if (order) {
            query.push(`order=${order}`);
        }
        if (start) {
            query.push(`start=${start}`);
        }
        if (length) {
            query.push(`length=${length}`);
        }
        const queryString = query.length > 0 ? `?${query.join('&')}` : '';
        return this.get(`/projects/${projectID}/tasks${queryString}`, true);
    }
    listToolConfigurations(projectID) {
        return this.get(`/projects/${projectID}/configurations`, true);
    }
    changeToolConfiguration(projectId, configId, dto) {
        return this.put(`/projects/${projectId}/configurations/${configId}`, dto, true);
    }
    deleteToolConfiguration(projectId, configId) {
        return this.del(`/projects/${projectId}/configurations/${configId}`, true);
    }
    createToolConfiguration(projectId, dto) {
        return this.post(`/projects/${projectId}/configurations`, dto, true);
    }
    removeAppToken(id) {
        return this.del(`/app/tokens/${id}`, true);
    }
    getProject(id) {
        return this.get(`/projects/${id}`, true);
    }
    listAccounts() {
        return this.get('/accounts/', true);
    }
    listProjects(manageable = false) {
        let query = '';
        if (manageable) {
            query = `?manageable=true`;
        }
        return this.get(`/projects${query}`, true);
    }
    listTools() {
        return this.get(`/app/tools/`, true);
    }
    getTool(id) {
        return this.get(`/app/tools/${id}`, true);
    }
    installTool(folder) {
        return this.post(`/app/tools/folders/${folder}`, undefined, true);
    }
    changeTool(id, dto) {
        return this.put(`/app/tools/${id}`, dto, true);
    }
    removeTool(id) {
        return this.del(`/app/tools/${id}`, true);
    }
    listProjectRoles(projectID) {
        return this.get(`/projects/${projectID}/roles`, true);
    }
    listProjectTempFiles(projectID, path = '') {
        return this.get(`/projects/${projectID}/files/temp?path=${path}`, true);
    }
    createProject(projectData) {
        return this.post(`/projects`, projectData, true);
    }
    /*
      public async getGuidelines(id: string): Promise<GuidelinesDto[]> {
      return this.get(`/projects/${id}/guidelines`, true);
    }

    public async saveGuidelines(projectID: string, requestData: GuidelinesDto[]): Promise<void> {
      return this.put(`/projects/${projectID}/guidelines`, requestData, true);
    }
     */
    removeProject(id, reqData) {
        return this.del(`/projects/${id}/`, true, reqData);
    }
    removeAccount(id) {
        return this.del(`/accounts/${id}/`, true);
    }
    changeMyPassword(oldPassword, newPassword) {
        return this.put('/accounts/me/password', {
            oldPassword,
            newPassword,
        }, true);
    }
    getMyAccountInformation() {
        return this.get('/accounts/me', true);
    }
    getMyAccountPersonalInformation() {
        return this.get('/accounts/me/personal-information', true);
    }
    createLocalAccount(dto) {
        return this.post('/accounts', {
            ...dto,
        }, true);
    }
    changeProject(id, requestData) {
        return this.put(`/projects/${id}`, requestData, true);
    }
    createAppToken(tokenData) {
        return this.post(`/app/tokens`, tokenData, true);
    }
    changeAppToken(id, tokenData) {
        return this.put(`/app/tokens/${id}`, tokenData, true);
    }
    refreshAppToken(id) {
        return this.put(`/app/tokens/${id}/refresh`, {}, true);
    }
    getAllStatistics() {
        return this.get(`/statistics/all`, true);
    }
    startTask(projectID, data) {
        return this.put(`/projects/${projectID}/tasks/start`, data, true);
    }
    /*

    public async freeAnnotation(projectID: string, annotationID: number): Promise<any> {
      return this.post(`/projects/${projectID}/annotations/${annotationID}/free`, {}, true);
    }
     */
    saveTask(projectID, taskID, properties, outputs = []) {
        const formData = new FormData();
        formData.append('properties', JSON.stringify(properties));
        for (const output of outputs) {
            formData.append('outputs[]', output, output.name);
        }
        return this.put(`/projects/${projectID}/tasks/${taskID}/save`, formData, true);
    }
    freeTask(projectID, taskID) {
        return this.put(`/projects/${projectID}/tasks/${taskID}/free`, undefined, true);
    }
    uploadTaskData(project_id, properties, inputs, outputs = []) {
        const formData = new FormData();
        for (const input of inputs) {
            formData.append('inputs[]', input, input.name);
        }
        for (const output of outputs) {
            formData.append('outputs[]', output, output.name);
        }
        formData.append('properties', JSON.stringify(properties));
        return this.post(`/projects/${project_id}/tasks`, formData, true, {
            reportProgress: true,
            observe: 'events',
        });
    }
    uploadTaskArchive(project_id, files) {
        const formData = new FormData();
        if (files) {
            for (const file of files) {
                formData.append('files[]', file, file.name);
            }
        }
        return this.post(`/projects/${project_id}/tasks/upload/archive`, formData, true, {
            reportProgress: true,
            observe: 'events',
        });
    }
    startBatchSession(project_id) {
        return this.post(`/projects/${project_id}/tasks/batch/start`, undefined, true);
    }
    cancelBatchSession(project_id, session_id, session_timestamp) {
        return this.del(`/projects/${project_id}/tasks/batch/cancel`, true, {
            session_id,
            session_timestamp,
        });
    }
    submitBatchSession(project_id, session_id, session_timestamp) {
        return this.post(`/projects/${project_id}/tasks/batch/submit`, {
            session_id,
            session_timestamp,
        }, true);
    }
    addBatchUploadTaskData(session_timestamp, session_id, project_id, properties, inputs, outputs = []) {
        const formData = new FormData();
        formData.append('properties', JSON.stringify(properties));
        for (const input of inputs) {
            formData.append('inputs[]', input, input.name);
        }
        for (const output of outputs) {
            formData.append('outputs[]', output, output.name);
        }
        formData.append('session_id', session_id);
        formData.append('session_timestamp', session_timestamp.toString());
        return this.post(`/projects/${project_id}/tasks/batch/upload`, formData, true, {
            reportProgress: true,
            observe: 'events',
        });
    }
    removeTask(project_id, task_id) {
        return this.del(`/projects/${project_id}/tasks/${task_id}`, true);
    }
    listMyAccountFields() {
        return this.get('/accounts/me/fields', true);
    }
    getProjectStatistics(id) {
        return this.get(`/projects/${id}/statistics`, true);
    }
    saveMyAccountFieldValues(data) {
        return this.post('/accounts/me/fields', data, true);
    }
    saveMyAccountSettings(data) {
        return this.put('/accounts/me/settings', data, true);
    }
    listRoles() {
        return this.get('/app/roles', true);
    }
    getRole(id) {
        return this.get(`/app/roles/${id}`, true);
    }
    requestPasswordReset(dto) {
        return this.post(`/accounts/request-password-reset`, dto, false);
    }
    runAccountBatchAction(dto) {
        return this.post(`/accounts/batch/runAction`, dto, true);
    }
    createRole(dto) {
        return this.post(`/app/roles`, dto, true);
    }
    changeRole(id, dto) {
        return this.put(`/app/roles/${id}`, dto, true);
    }
    removeRole(id) {
        return this.del(`/app/roles/${id}`, true);
    }
    searchAccounts(keyword) {
        return this.get('/accounts/search?keyword=' + keyword, true);
    }
    // TODO fix issue with project assign dto
    assignProjectRoles(project_id, dto) {
        return this.post(`/projects/${project_id}/roles`, dto, true);
    }
    saveMyPersonalAccountInformation(data) {
        return this.put('/accounts/me/personal-information', data, true);
    }
    changeProjectRole(project_id, role_id, data) {
        return this.put(`/projects/${project_id}/roles/${role_id}`, data, true);
    }
    removeProjectRole(project_id, account_id) {
        return this.del(`/projects/${project_id}/roles/${account_id}`, true);
    }
    getAccountInformation(id) {
        return this.get(`accounts/${id}`, true);
    }
    saveAccountInformation(id, dto) {
        return this.put(`accounts/${id}`, dto, true);
    }
    listPolicies() {
        return this.get(`app/policies`, true);
    }
    createPolicy(dto) {
        return this.post(`app/policies`, dto, true);
    }
    getPolicy(id) {
        return this.get(`app/policies/${id}`, true);
    }
    updatePolicy(id, dto) {
        return this.put(`app/policies/${id}`, dto, true);
    }
    createPolicyTranslation(policy_id, dto) {
        const formData = new FormData();
        if (dto.files) {
            for (const input of dto.files) {
                formData.append('files[]', input, input.name);
            }
        }
        if (dto.url) {
            formData.append('url', dto.url);
        }
        if (dto.text) {
            formData.append('text', dto.text);
        }
        formData.append('locale', dto.locale);
        return this.post(`/app/policies/${policy_id}/translations`, formData, true);
    }
    changePolicyTranslation(policy_id, policy_translation_id, dto) {
        const formData = new FormData();
        if (dto.files) {
            for (const input of dto.files) {
                formData.append('files[]', input, input.name);
            }
        }
        if (dto.url) {
            formData.append('url', dto.url);
        }
        if (dto.text) {
            formData.append('text', dto.text);
        }
        formData.append('locale', dto.locale);
        return this.put(`/app/policies/${policy_id}/translations/${policy_translation_id}`, formData, true);
    }
    removePolicy(policy_id) {
        return this.del(`app/policies/${policy_id}`, true);
    }
    publishPolicies(dto) {
        return this.put(`app/policies/publish`, dto, true);
    }
    removePolicyTranslation(policy_id, translation_id) {
        return this.del(`app/policies/${policy_id}/translations/${translation_id}`, true);
    }
    get(partURL, needsJWT) {
        const headers = this.getHeaders(needsJWT);
        partURL = partURL.indexOf('/') === 0 ? partURL.substring(1) : partURL;
        return this.http.get(`${this._apiURL}/${partURL}`, {
            responseType: 'json',
            headers,
        });
    }
    post(partURL, data, needsJWT, options) {
        const headers = this.getHeaders(needsJWT);
        partURL = partURL.indexOf('/') === 0 ? partURL.substring(1) : partURL;
        return this.http.post(`${this._apiURL}/${partURL}`, data, {
            ...options,
            responseType: 'json',
            headers,
        });
    }
    put(partURL, data, needsJWT) {
        const headers = this.getHeaders(needsJWT);
        partURL = partURL.indexOf('/') === 0 ? partURL.substring(1) : partURL;
        return this.http.put(`${this._apiURL}/${partURL}`, data, {
            responseType: 'json',
            headers,
        });
    }
    del(partURL, needsJWT, data = undefined) {
        const headers = this.getHeaders(needsJWT);
        partURL = partURL.indexOf('/') === 0 ? partURL.substring(1) : partURL;
        const options = {
            responseType: 'json',
            headers,
            body: data,
        };
        if (!data) {
            delete options.body;
        }
        return this.http.delete(`${this._apiURL}/${partURL}`, options).pipe(map((a) => {
            return;
        }));
    }
    getHeaders(needsJWT) {
        let headers = {
            'X-App-Token': this.appToken,
        };
        if (needsJWT && !this.useCookieStrategy) {
            headers = {
                ...headers,
                Authorization: `Bearer ${this._webToken}`,
            };
        }
        return headers;
    }
    getCookie(cname) {
        const name = cname + '=';
        const decodedCookie = decodeURIComponent(document.cookie);
        const ca = decodedCookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }
        return undefined;
    }
    prepareFileURL(fileURL) {
        if (!this.useCookieStrategy) {
            // append query params
            return `${fileURL}?session_token=${this._webToken}`;
        }
        return fileURL;
    }
    postOnNewTab(partURL, data) {
        partURL = partURL.indexOf('/') === 0 ? partURL.substring(1) : partURL;
        const temporaryForm = document.createElement('form');
        temporaryForm.setAttribute('id', 'temporaryForm');
        temporaryForm.setAttribute('method', 'post');
        temporaryForm.setAttribute('action', this._apiURL + `/${partURL}`);
        temporaryForm.setAttribute('target', '_blank');
        for (const key of Object.keys(data)) {
            if (data[key] !== undefined && data[key] !== null) {
                const hidden = document.createElement('input');
                hidden.setAttribute('style', 'display:none');
                hidden.setAttribute('type', 'hidden');
                hidden.setAttribute('name', key);
                hidden.value = data['' + key];
                temporaryForm.appendChild(hidden);
            }
        }
        document.body.appendChild(temporaryForm);
        temporaryForm.submit();
    }
}
OctraAPIService.ɵfac = function OctraAPIService_Factory(t) { return new (t || OctraAPIService)(i0.ɵɵinject(i1.HttpClient)); };
OctraAPIService.ɵprov = /*@__PURE__*/ i0.ɵɵdefineInjectable({ token: OctraAPIService, factory: OctraAPIService.ɵfac, providedIn: 'root' });
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(OctraAPIService, [{
        type: Injectable,
        args: [{
                providedIn: 'root',
            }]
    }], function () { return [{ type: i1.HttpClient }]; }, null); })();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib2N0cmEtYXBpLnNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9saWJzL25neC1vY3RyYS1hcGkvc3JjL2xpYi9vY3RyYS1hcGkuc2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBQzNDLE9BQU8sRUFBRSxVQUFVLEVBQW1ELE1BQU0sc0JBQXNCLENBQUM7QUE0Q25HLE9BQU8sRUFBRSxVQUFVLEVBQUUsR0FBRyxFQUFjLEVBQUUsRUFBRSxVQUFVLEVBQUUsTUFBTSxNQUFNLENBQUM7QUFDbkUsT0FBTyxFQUFFLG9CQUFvQixFQUFFLE1BQU0sYUFBYSxDQUFDOzs7QUFLbkQsTUFBTSxPQUFPLGVBQWU7SUFDMUIsSUFBSSxNQUFNO1FBQ1IsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDO0lBQ3RCLENBQUM7SUFFRCxJQUFJLFFBQVE7UUFDVixPQUFPLElBQUksQ0FBQyxTQUFTLENBQUM7SUFDeEIsQ0FBQztJQUVELElBQUksYUFBYTtRQUNmLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQztJQUM3QixDQUFDO0lBRUQsSUFBSSxRQUFRLENBQUMsS0FBeUI7UUFDcEMsSUFBSSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7SUFDekIsQ0FBQztJQU9ELElBQUksV0FBVztRQUNiLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQztJQUMzQixDQUFDO0lBTUQsWUFBb0IsSUFBZ0I7UUFBaEIsU0FBSSxHQUFKLElBQUksQ0FBWTtRQWI1QixhQUFRLEdBQUcsRUFBRSxDQUFDO1FBQ2Qsc0JBQWlCLEdBQUcsS0FBSyxDQUFDO1FBQzFCLGNBQVMsR0FBWSxFQUFFLENBQUM7UUFDeEIsWUFBTyxHQUFHLEVBQUUsQ0FBQztRQU1iLGlCQUFZLEdBQUcsS0FBSyxDQUFDO1FBQ3JCLG1CQUFjLEdBQUcsS0FBSyxDQUFDO0lBR1EsQ0FBQztJQUVqQyxJQUFJ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QUN6QixDQUFDOzs4RUExbkJVLGVBQWU7cUVBQWYsZUFBZSxXQUFmLGVBQWUsbUJBRmQsTUFBTTt1RkFFUCxlQUFlO2NBSDNCLFVBQVU7ZUFBQztnQkFDVixVQUFVLEVBQUUsTUFBTTthQUNuQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEluamVjdGFibGUgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IEh0dHBDbGllbnQsIEh0dHBDb250ZXh0LCBIdHRwRXZlbnQsIEh0dHBIZWFkZXJzLCBIdHRwUGFyYW1zIH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uL2h0dHAnO1xuaW1wb3J0IHtcbiAgQWNjb3VudEJhdGNoQWN0aW9uRHRvLFxuICBBY2NvdW50Q2hhbmdlRHRvLFxuICBBY2NvdW50Q3JlYXRlUmVxdWVzdER0byxcbiAgQWNjb3VudER0byxcbiAgQWNjb3VudEZpZWxkVmFsdWVEZWZpbml0aW9uRHRvLFxuICBBY2NvdW50TG9naW5NZXRob2QsXG4gIEFjY291bnRNaW5pbWFsRHRvLFxuICBBY2NvdW50U2VhcmNoUmVzdWx0RHRvLFxuICBBY2NvdW50U2V0dGluZ3NEdG8sXG4gIEFsbFN0YXRpc3RpY3NEdG8sXG4gIEFwcFRva2VuQ2hhbmdlRHRvLFxuICBBcHBUb2tlbkNyZWF0ZUR0byxcbiAgQXBwVG9rZW5EdG8sXG4gIEF1dGhEdG8sXG4gIENoYW5nZUFjY291bnRJbmZvcm1hdGlvbkR0byxcbiAgQ3VycmVudEFjY291bnREdG8sXG4gIFBvbGljeUNyZWF0ZVJlcXVlc3REdG8sXG4gIFBvbGljeUNyZWF0ZVRyYW5zbGF0aW9uRHRvLFxuICBQb2xpY3lEdG8sXG4gIFBvbGljeU1pbmltYWxEdG8sXG4gIFBvbGljeVB1Ymxpc2hSZXF1ZXN0RHRvLFxuICBQb2xpY3lUcmFuc2xhdGlvbkR0byxcbiAgUHJvamVjdER0byxcbiAgUHJvamVjdFJlcXVlc3REdG8sXG4gIFByb2plY3RSb2xlRHRvLFxuICBQcm9qZWN0Um9sZVJlc3VsdER0byxcbiAgUHJvamVjdFN0YXRpc3RpY3NEdG8sXG4gIFByb2plY3RUZW1wRmlsZUVudHJ5RHRvLFxuICBSZXNldFBhc3N3b3JkUmVxdWVzdER0byxcbiAgUm9sZUNyZWF0ZUR0byxcbiAgUm9sZUR0byxcbiAgVGFza0JhdGNoU2Vzc2lvbkR0byxcbiAgVGFza0R0byxcbiAgVGFza1Byb3BlcnRpZXMsXG4gIFRhc2tTYXZlRHRvUHJvcGVydGllcyxcbiAgVGFza1N0YXJ0QWN0aW9uRHRvLFxuICBUb29sQ2hhbmdlUmVxdWVzdER0byxcbiAgVG9vbENvbmZpZ3VyYXRpb25DaGFuZ2VEdG8sXG4gIFRvb2xDb25maWd1cmF0aW9uQ3JlYXRlRHRvLFxuICBUb29sQ29uZmlndXJhdGlvbkR0byxcbiAgVG9vbER0byxcbn0gZnJvbSAnQG9jdHJhL2FwaS10eXBlcyc7XG5pbXBvcnQgeyBleGhhdXN0TWFwLCBtYXAsIE9ic2VydmFibGUsIG9mLCB0aHJvd0Vycm9yIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyByZW1vdmVOdWxsQXR0cmlidXRlcyB9IGZyb20gJy4vZnVuY3Rpb25zJztcblxuQEluamVjdGFibGUoe1xuICBwcm92aWRlZEluOiAncm9vdCcsXG59KVxuZXhwb3J0IGNsYXNzIE9jdHJhQVBJU2VydmljZSB7XG4gIGdldCBhcGlVUkwoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5fYXBpVVJMO1xuICB9XG5cbiAgZ2V0IGF1dGhUeXBlKCk6IEFjY291bnRMb2dpbk1ldGhvZCB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuX2F1dGhUeXBlO1xuICB9XG5cbiAgZ2V0IGF1dGhlbnRpY2F0ZWQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2F1dGhlbnRpY2F0ZWQ7XG4gIH1cblxuICBzZXQgd2ViVG9rZW4odmFsdWU6IHN0cmluZyB8IHVuZGVmaW5lZCkge1xuICAgIHRoaXMuX3dlYlRva2VuID0gdmFsdWU7XG4gIH1cblxuICBwcml2YXRlIGFwcFRva2VuID0gJyc7XG4gIHByaXZhdGUgdXNlQ29va2llU3RyYXRlZ3kgPSBmYWxzZTtcbiAgcHJpdmF0ZSBfd2ViVG9rZW4/OiBzdHJpbmcgPSAnJztcbiAgcHJpdmF0ZSBfYXBpVVJMID0gJyc7XG5cbiAgZ2V0IGluaXRpYWxpemVkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9pbml0aWFsaXplZDtcbiAgfVxuXG4gIHByaXZhdGUgX2luaXRpYWxpemVkID0gZmFsc2U7XG4gIHByaXZhdGUgX2F1dGhlbnRpY2F0ZWQgPSBmYWxzZTtcbiAgcHJpdmF0ZSBfYXV0aFR5cGU/OiBBY2NvdW50TG9naW5NZXRob2Q7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBodHRwOiBIdHRwQ2xpZW50KSB7fVxuXG4gIHB1YmxpYyBpbml0KGFwaVVSTDogc3RyaW5nLCBhcHBUb2tlbjogc3RyaW5nLCB3ZWJUb2tlbjogc3RyaW5nIHwgdW5kZWZpbmVkLCB1c2VDb29raWVTdHJhdGVneTogYm9vbGVhbikge1xuICAgIHRoaXMuX2FwaVVSTCA9IGFwaVVSTDtcbiAgICB0aGlzLmFwcFRva2VuID0gYXBwVG9rZW47XG4gICAgdGhpcy51c2VDb29raWVTdHJhdGVneSA9IHVzZUNvb2tpZVN0cmF0ZWd5O1xuICAgIHRoaXMuX2F1dGhlbnRpY2F0ZWQgPSB0aGlzLmdldENvb2tpZSgnb2NiX2F1dGhlbnRpY2F0ZWQnKSAhPT0gdW5kZWZpbmVkO1xuICAgIHRoaXMuX2F1dGhUeXBlID0gdGhpcy5nZXRDb29raWUoJ29jYl9hdXRoZW50aWNhdGVkJykgYXMgQWNjb3VudExvZ2luTWV0aG9kO1xuICAgIHRoaXMuX3dlYlRva2VuID0gd2ViVG9rZW47XG4gICAgdGhpcy5faW5pdGlhbGl6ZWQgPSB0cnVlO1xuICB9XG5cbiAgcHVibGljIGxvZ2luKHR5cGU6IEFjY291bnRMb2dpbk1ldGhvZCwgdXNlcm5hbWVPckVtYWlsPzogc3RyaW5nLCBwYXNzd29yZD86IHN0cmluZyk6IE9ic2VydmFibGU8QXV0aER0bz4ge1xuICAgIGxldCBkYXRhOiBhbnkgPSB7XG4gICAgICB0eXBlLFxuICAgICAgdXNlcm5hbWVPckVtYWlsLFxuICAgICAgcGFzc3dvcmQsXG4gICAgICB1c2VDb29raWVzOiB0aGlzLnVzZUNvb2tpZVN0cmF0ZWd5LFxuICAgIH07XG4gICAgZGF0YSA9IHJlbW92ZU51bGxBdHRyaWJ1dGVzKGRhdGEpO1xuICAgIHJldHVybiB0aGlzLmh0dHBcbiAgICAgIC5wb3N0PGFueT4oYCR7dGhpcy5fYXBpVVJMfS9hdXRoL2xvZ2luYCwgZGF0YSwge1xuICAgICAgICBoZWFkZXJzOiB0aGlzLmdldEhlYWRlcnMoZmFsc2UpLFxuICAgICAgfSlcbiAgICAgIC5waXBlKFxuICAgICAgICBleGhhdXN0TWFwKChkdG86IEF1dGhEdG8pID0+IHtcbiAgICAgICAgICBpZiAoIWR0by5vcGVuVVJMICYmIGR0by5hY2Nlc3NUb2tlbikge1xuICAgICAgICAgICAgaWYgKCF0aGlzLnVzZUNvb2tpZVN0cmF0ZWd5KSB7XG4gICAgICAgICAgICAgIHRoaXMuX3dlYlRva2VuID0gZHRvLmFjY2Vzc1Rva2VuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fYXV0aGVudGljYXRlZCA9IHRydWU7XG4gICAgICAgICAgICByZXR1cm4gb2YoZHRvKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKGR0by5vcGVuVVJMICYmIGR0by5vcGVuVVJMLnRyaW0oKSAhPT0gJycpIHtcbiAgICAgICAgICAgIHJldHVybiBvZihkdG8pO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gdGhyb3dFcnJvcigoKSA9PiBuZXcgRXJyb3IoXCJDYW4ndCByZWFkIGxvZ2luIHJlc3BvbnNlXCIpKTtcbiAgICAgICAgfSlcbiAgICAgICk7XG4gIH1cblxuICAvKipcbiAgICogZG9lcyBsb2dvdXQgcHJvY2Vzc1xuICAgKi9cbiAgcHVibGljIGxvZ291dCgpIHtcbiAgICByZXR1cm4gdGhpcy5wb3N0KGAvYXV0aC9sb2dvdXRgLCB1bmRlZmluZWQsIHRydWUpO1xuICB9XG5cbiAgLyoqKlxuICAgKiBsaXN0cyB0aGUgYXBwIHRva2Vucy5cbiAgICovXG4gIHB1YmxpYyBsaXN0QXBwVG9rZW5zKCk6IE9ic2VydmFibGU8QXBwVG9rZW5EdG9bXT4ge1xuICAgIHJldHVybiB0aGlzLmdldCgnL2FwcC90b2tlbnMnLCB0cnVlKTtcbiAgfVxuXG4gIC8qKipcbiAgICogcmV0dXJucyBvbmUgc3BlY2lmaWMgYXBwdG9rZW4uXG4gICAqL1xuICBwdWJsaWMgZ2V0QXBwVG9rZW4oaWQ6IHN0cmluZyk6IE9ic2VydmFibGU8QXBwVG9rZW5EdG8+IHtcbiAgICByZXR1cm4gdGhpcy5nZXQoYC9hcHAvdG9rZW5zLyR7aWR9YCwgdHJ1ZSk7XG4gIH1cblxuICBwdWJsaWMgZ2V0VGFzayhwcm9qZWN0SUQ6IHN0cmluZywgdGFza0lEOiBzdHJpbmcpOiBPYnNlcnZhYmxlPFRhc2tEdG8+IHtcbiAgICByZXR1cm4gdGhpcy5nZXQoYC9wcm9qZWN0cy8ke3Byb2plY3RJRH0vdGFza3MvJHt0YXNrSUR9YCwgdHJ1ZSk7XG4gIH1cblxuICBwdWJsaWMgbGlzdFRhc2tzKHByb2plY3RJRDogc3RyaW5nLCBvcmRlcj86ICdkZXNjJyB8ICdhc2MnLCBzdGFydD86IG51bWJlciwgbGVuZ3RoPzogbnVtYmVyKTogT2JzZXJ2YWJsZTxUYXNrRHRvW10+IHtcbiAgICBjb25zdCBxdWVyeTogc3RyaW5nW10gPSBbXTtcbiAgICBpZiAob3JkZXIpIHtcbiAgICAgIHF1ZXJ5LnB1c2goYG9yZGVyPSR7b3JkZXJ9YCk7XG4gICAgfVxuICAgIGlmIChzdGFydCkge1xuICAgICAgcXVlcnkucHVzaChgc3RhcnQ9JHtzdGFydH1gKTtcbiAgICB9XG4gICAgaWYgKGxlbmd0aCkge1xuICAgICAgcXVlcnkucHVzaChgbGVuZ3RoPSR7bGVuZ3RofWApO1xuICAgIH1cblxuICAgIGNvbnN0IHF1ZXJ5U3RyaW5nID0gcXVlcnkubGVuZ3RoID4gMCA/IGA/JHtxdWVyeS5qb2luKCcmJyl9YCA6ICcnO1xuXG4gICAgcmV0dXJuIHRoaXMuZ2V0KGAvcHJvamVjdHMvJHtwcm9qZWN0SUR9L3Rhc2tzJHtxdWVyeVN0cmluZ31gLCB0cnVlKTtcbiAgfVxuXG4gIHB1YmxpYyBsaXN0VG9vbENvbmZpZ3VyYXRpb25zKHByb2plY3RJRDogc3RyaW5nKTogT2JzZXJ2YWJsZTxUb29sQ29uZmlndXJhdGlvbkR0b1tdPiB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0KGAvcHJvamVjdHMvJHtwcm9qZWN0SUR9L2NvbmZpZ3VyYXRpb25zYCwgdHJ1ZSk7XG4gIH1cblxuICBwdWJsaWMgY2hhbmdlVG9vbENvbmZpZ3VyYXRpb24ocHJvamVjdElkOiBzdHJpbmcsIGNvbmZpZ0lkOiBzdHJpbmcsIGR0bzogVG9vbENvbmZpZ3VyYXRpb25DaGFuZ2VEdG8pOiBPYnNlcnZhYmxlPFRvb2xDb25maWd1cmF0aW9uRHRvPiB7XG4gICAgcmV0dXJuIHRoaXMucHV0KGAvcHJvamVjdHMvJHtwcm9qZWN0SWR9L2NvbmZpZ3VyYXRpb25zLyR7Y29uZmlnSWR9YCwgZHRvLCB0cnVlKTtcbiAgfVxuXG4gIHB1YmxpYyBkZWxldGVUb29sQ29uZmlndXJhdGlvbihwcm9qZWN0SWQ6IHN0cmluZywgY29uZmlnSWQ6IHN0cmluZyk6IE9ic2VydmFibGU8dm9pZD4ge1xuICAgIHJldHVybiB0aGlzLmRlbChgL3Byb2plY3RzLyR7cHJvamVjdElkfS9jb25maWd1cmF0aW9ucy8ke2NvbmZpZ0lkfWAsIHRydWUpO1xuICB9XG5cbiAgcHVibGljIGNyZWF0ZVRvb2xDb25maWd1cmF0aW9uKHByb2plY3RJZDogc3RyaW5nLCBkdG86IFRvb2xDb25maWd1cmF0aW9uQ3JlYXRlRHRvKTogT2JzZXJ2YWJsZTxUb29sQ29uZmlndXJhdGlvbkR0bz4ge1xuICAgIHJldHVybiB0aGlzLnBvc3QoYC9wcm9qZWN0cy8ke3Byb2plY3RJZH0vY29uZmlndXJhdGlvbnNgLCBkdG8sIHRydWUpO1xuICB9XG5cbiAgcHVibGljIHJlbW92ZUFwcFRva2VuKGlkOiBzdHJpbmcpOiBPYnNlcnZhYmxlPHZvaWQ+IHtcbiAgICByZXR1cm4gdGhpcy5kZWwoYC9hcHAvdG9rZW5zLyR7aWR9YCwgdHJ1ZSk7XG4gIH1cblxuICBwdWJsaWMgZ2V0UHJvamVjdChpZDogc3RyaW5nKTogT2JzZXJ2YWJsZTxQcm9qZWN0RHRvPiB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0KGAvcHJvamVjdHMvJHtpZH1gLCB0cnVlKTtcbiAgfVxuXG4gIHB1YmxpYyBsaXN0QWNjb3VudHMoKTogT2JzZXJ2YWJsZTxBY2NvdW50TWluaW1hbER0b1tdPiB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0KCcvYWNjb3VudHMvJywgdHJ1ZSk7XG4gIH1cblxuICBwdWJsaWMgbGlzdFByb2plY3RzKG1hbmFnZWFibGU6IGJvb2xlYW4gPSBmYWxzZSk6IE9ic2VydmFibGU8UHJvamVjdER0b1tdPiB7XG4gICAgbGV0IHF1ZXJ5ID0gJyc7XG4gICAgaWYgKG1hbmFnZWFibGUpIHtcbiAgICAgIHF1ZXJ5ID0gYD9tYW5hZ2VhYmxlPXRydWVgO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5nZXQoYC9wcm9qZWN0cyR7cXVlcnl9YCwgdHJ1ZSk7XG4gIH1cblxuICBwdWJsaWMgbGlzdFRvb2xzKCk6IE9ic2VydmFibGU8VG9vbER0b1tdPiB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0KGAvYXBwL3Rvb2xzL2AsIHRydWUpO1xuICB9XG5cbiAgcHVibGljIGdldFRvb2woaWQ6IHN0cmluZyk6IE9ic2VydmFibGU8VG9vbER0bz4ge1xuICAgIHJldHVybiB0aGlzLmdldChgL2FwcC90b29scy8ke2lkfWAsIHRydWUpO1xuICB9XG5cbiAgcHVibGljIGluc3RhbGxUb29sKGZvbGRlcjogc3RyaW5nKTogT2JzZXJ2YWJsZTxUb29sRHRvPiB7XG4gICAgcmV0dXJuIHRoaXMucG9zdChgL2FwcC90b29scy9mb2xkZXJzLyR7Zm9sZGVyfWAsIHVuZGVmaW5lZCwgdHJ1ZSk7XG4gIH1cblxuICBwdWJsaWMgY2hhbmdlVG9vbChpZDogc3RyaW5nLCBkdG86IFRvb2xDaGFuZ2VSZXF1ZXN0RHRvKTogT2JzZXJ2YWJsZTxUb29sRHRvPiB7XG4gICAgcmV0dXJuIHRoaXMucHV0KGAvYXBwL3Rvb2xzLyR7aWR9YCwgZHRvLCB0cnVlKTtcbiAgfVxuXG4gIHB1YmxpYyByZW1vdmVUb29sKGlkOiBzdHJpbmcpOiBPYnNlcnZhYmxlPHZvaWQ+IHtcbiAgICByZXR1cm4gdGhpcy5kZWwoYC9hcHAvdG9vbHMvJHtpZH1gLCB0cnVlKTtcbiAgfVxuXG4gIHB1YmxpYyBsaXN0UHJvamVjdFJvbGVzKHByb2plY3RJRDogc3RyaW5nKTogT2JzZXJ2YWJsZTxQcm9qZWN0Um9sZUR0b1tdPiB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0PFByb2plY3RSb2xlRHRvW10+KGAvcHJvamVjdHMvJHtwcm9qZWN0SUR9L3JvbGVzYCwgdHJ1ZSk7XG4gIH1cblxuICBwdWJsaWMgbGlzdFByb2plY3RUZW1wRmlsZXMocHJvamVjdElEOiBzdHJpbmcsIHBhdGg6IHN0cmluZyA9ICcnKTogT2JzZXJ2YWJsZTxQcm9qZWN0VGVtcEZpbGVFbnRyeUR0b1tdPiB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0PFByb2plY3RUZW1wRmlsZUVudHJ5RHRvW10+KGAvcHJvamVjdHMvJHtwcm9qZWN0SUR9L2ZpbGVzL3RlbXA/cGF0aD0ke3BhdGh9YCwgdHJ1ZSk7XG4gIH1cblxuICBwdWJsaWMgY3JlYXRlUHJvamVjdChwcm9qZWN0RGF0YTogUHJvamVjdFJlcXVlc3REdG8pOiBPYnNlcnZhYmxlPFByb2plY3REdG8+IHtcbiAgICByZXR1cm4gdGhpcy5wb3N0KGAvcHJvamVjdHNgLCBwcm9qZWN0RGF0YSwgdHJ1ZSk7XG4gIH1cblxuICAvKlxuICAgIHB1YmxpYyBhc3luYyBnZXRHdWlkZWxpbmVzKGlkOiBzdHJpbmcpOiBQcm9taXNlPEd1aWRlbGluZXNEdG9bXT4ge1xuICAgIHJldHVybiB0aGlzLmdldChgL3Byb2plY3RzLyR7aWR9L2d1aWRlbGluZXNgLCB0cnVlKTtcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBzYXZlR3VpZGVsaW5lcyhwcm9qZWN0SUQ6IHN0cmluZywgcmVxdWVzdERhdGE6IEd1aWRlbGluZXNEdG9bXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiB0aGlzLnB1dChgL3Byb2plY3RzLyR7cHJvamVjdElEfS9ndWlkZWxpbmVzYCwgcmVxdWVzdERhdGEsIHRydWUpO1xuICB9XG4gICAqL1xuXG4gIHB1YmxpYyByZW1vdmVQcm9qZWN0KFxuICAgIGlkOiBzdHJpbmcsXG4gICAgcmVxRGF0YToge1xuICAgICAgcmVtb3ZlUHJvamVjdEZpbGVzPzogYm9vbGVhbjtcbiAgICB9XG4gICk6IE9ic2VydmFibGU8dm9pZD4ge1xuICAgIHJldHVybiB0aGlzLmRlbChgL3Byb2plY3RzLyR7aWR9L2AsIHRydWUsIHJlcURhdGEpO1xuICB9XG5cbiAgcHVibGljIHJlbW92ZUFjY291bnQoaWQ6IHN0cmluZyk6IE9ic2VydmFibGU8dm9pZD4ge1xuICAgIHJldHVybiB0aGlzLmRlbChgL2FjY291bnRzLyR7aWR9L2AsIHRydWUpO1xuICB9XG5cbiAgcHVibGljIGNoYW5nZU15UGFzc3dvcmQob2xkUGFzc3dvcmQ6IHN0cmluZywgbmV3UGFzc3dvcmQ6IHN0cmluZyk6IE9ic2VydmFibGU8dm9pZD4ge1xuICAgIHJldHVybiB0aGlzLnB1dChcbiAgICAgICcvYWNjb3VudHMvbWUvcGFzc3dvcmQnLFxuICAgICAge1xuICAgICAgICBvbGRQYXNzd29yZCxcbiAgICAgICAgbmV3UGFzc3dvcmQsXG4gICAgICB9LFxuICAgICAgdHJ1ZVxuICAgICk7XG4gIH1cblxuICBwdWJsaWMgZ2V0TXlBY2NvdW50SW5mb3JtYXRpb24oKTogT2JzZXJ2YWJsZTxDdXJyZW50QWNjb3VudER0bz4ge1xuICAgIHJldHVybiB0aGlzLmdldCgnL2FjY291bnRzL21lJywgdHJ1ZSk7XG4gIH1cblxuICBwdWJsaWMgZ2V0TXlBY2NvdW50UGVyc29uYWxJbmZvcm1hdGlvbigpOiBPYnNlcnZhYmxlPEFjY291bnREdG8+IHtcbiAgICByZXR1cm4gdGhpcy5nZXQoJy9hY2NvdW50cy9tZS9wZXJzb25hbC1pbmZvcm1hdGlvbicsIHRydWUpO1xuICB9XG5cbiAgcHVibGljIGNyZWF0ZUxvY2FsQWNjb3VudChkdG86IEFjY291bnRDcmVhdGVSZXF1ZXN0RHRvKTogT2JzZXJ2YWJsZTxBY2NvdW50RHRvPiB7XG4gICAgcmV0dXJuIHRoaXMucG9zdChcbiAgICAgICcvYWNjb3VudHMnLFxuICAgICAge1xuICAgICAgICAuLi5kdG8sXG4gICAgICB9IGFzIEFjY291bnRDcmVhdGVSZXF1ZXN0RHRvLFxuICAgICAgdHJ1ZVxuICAgICk7XG4gIH1cblxuICBwdWJsaWMgY2hhbmdlUHJvamVjdChpZDogc3RyaW5nLCByZXF1ZXN0RGF0YTogUHJvamVjdFJlcXVlc3REdG8pOiBPYnNlcnZhYmxlPHZvaWQ+IHtcbiAgICByZXR1cm4gdGhpcy5wdXQoYC9wcm9qZWN0cy8ke2lkfWAsIHJlcXVlc3REYXRhLCB0cnVlKTtcbiAgfVxuXG4gIHB1YmxpYyBjcmVhdGVBcHBUb2tlbih0b2tlbkRhdGE6IEFwcFRva2VuQ3JlYXRlRHRvKTogT2JzZXJ2YWJsZTxib29sZWFuPiB7XG4gICAgcmV0dXJuIHRoaXMucG9zdDxhbnk+KGAvYXBwL3Rva2Vuc2AsIHRva2VuRGF0YSwgdHJ1ZSk7XG4gIH1cblxuICBwdWJsaWMgY2hhbmdlQXBwVG9rZW4oaWQ6IHN0cmluZywgdG9rZW5EYXRhOiBBcHBUb2tlbkNoYW5nZUR0byk6IE9ic2VydmFibGU8QXBwVG9rZW5EdG8+IHtcbiAgICByZXR1cm4gdGhpcy5wdXQoYC9hcHAvdG9rZW5zLyR7aWR9YCwgdG9rZW5EYXRhLCB0cnVlKTtcbiAgfVxuXG4gIHB1YmxpYyByZWZyZXNoQXBwVG9rZW4oaWQ6IHN0cmluZyk6IE9ic2VydmFibGU8QXBwVG9rZW5EdG8+IHtcbiAgICByZXR1cm4gdGhpcy5wdXQoYC9hcHAvdG9rZW5zLyR7aWR9L3JlZnJlc2hgLCB7fSwgdHJ1ZSk7XG4gIH1cblxuICBwdWJsaWMgZ2V0QWxsU3RhdGlzdGljcygpOiBPYnNlcnZhYmxlPEFsbFN0YXRpc3RpY3NEdG8+IHtcbiAgICByZXR1cm4gdGhpcy5nZXQoYC9zdGF0aXN0aWNzL2FsbGAsIHRydWUpO1xuICB9XG5cbiAgcHVibGljIHN0YXJ0VGFzayhwcm9qZWN0SUQ6IHN0cmluZywgZGF0YTogVGFza1N0YXJ0QWN0aW9uRHRvKTogT2JzZXJ2YWJsZTxUYXNrRHRvPiB7XG4gICAgcmV0dXJuIHRoaXMucHV0PFRhc2tEdG8+KGAvcHJvamVjdHMvJHtwcm9qZWN0SUR9L3Rhc2tzL3N0YXJ0YCwgZGF0YSwgdHJ1ZSk7XG4gIH1cblxuICAvKlxuXG4gIHB1YmxpYyBhc3luYyBmcmVlQW5ub3RhdGlvbihwcm9qZWN0SUQ6IHN0cmluZywgYW5ub3RhdGlvbklEOiBudW1iZXIpOiBQcm9taXNlPGFueT4ge1xuICAgIHJldHVybiB0aGlzLnBvc3QoYC9wcm9qZWN0cy8ke3Byb2plY3RJRH0vYW5ub3RhdGlvbnMvJHthbm5vdGF0aW9uSUR9L2ZyZWVgLCB7fSwgdHJ1ZSk7XG4gIH1cbiAgICovXG5cbiAgcHVibGljIHNhdmVUYXNrKHByb2plY3RJRDogc3RyaW5nLCB0YXNrSUQ6IHN0cmluZywgcHJvcGVydGllczogVGFza1NhdmVEdG9Qcm9wZXJ0aWVzLCBvdXRwdXRzOiBGaWxlW10gPSBbXSk6IE9ic2VydmFibGU8VGFza0R0bz4ge1xuICAgIGNvbnN0IGZvcm1EYXRhID0gbmV3IEZvcm1EYXRhKCk7XG4gICAgZm9ybURhdGEuYXBwZW5kKCdwcm9wZXJ0aWVzJywgSlNPTi5zdHJpbmdpZnkocHJvcGVydGllcykpO1xuICAgIGZvciAoY29uc3Qgb3V0cHV0IG9mIG91dHB1dHMpIHtcbiAgICAgIGZvcm1EYXRhLmFwcGVuZCgnb3V0cHV0c1tdJywgb3V0cHV0LCBvdXRwdXQubmFtZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMucHV0PFRhc2tEdG8+KGAvcHJvamVjdHMvJHtwcm9qZWN0SUR9L3Rhc2tzLyR7dGFza0lEfS9zYXZlYCwgZm9ybURhdGEsIHRydWUpO1xuICB9XG5cbiAgcHVibGljIGZyZWVUYXNrKHByb2plY3RJRDogc3RyaW5nLCB0YXNrSUQ6IHN0cmluZykge1xuICAgIHJldHVybiB0aGlzLnB1dDxUYXNrRHRvPihgL3Byb2plY3RzLyR7cHJvamVjdElEfS90YXNrcy8ke3Rhc2tJRH0vZnJlZWAsIHVuZGVmaW5lZCwgdHJ1ZSk7XG4gIH1cblxuICBwdWJsaWMgdXBsb2FkVGFza0RhdGEocHJvamVjdF9pZDogc3RyaW5nLCBwcm9wZXJ0aWVzOiBUYXNrUHJvcGVydGllcywgaW5wdXRzOiBGaWxlW10sIG91dHB1dHM6IEZpbGVbXSA9IFtdKTogT2JzZXJ2YWJsZTxIdHRwRXZlbnQ8dW5rbm93bj4+IHtcbiAgICBjb25zdCBmb3JtRGF0YSA9IG5ldyBGb3JtRGF0YSgpO1xuICAgIGZvciAoY29uc3QgaW5wdXQgb2YgaW5wdXRzKSB7XG4gICAgICBmb3JtRGF0YS5hcHBlbmQoJ2lucHV0c1tdJywgaW5wdXQsIGlucHV0Lm5hbWUpO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IG91dHB1dCBvZiBvdXRwdXRzKSB7XG4gICAgICBmb3JtRGF0YS5hcHBlbmQoJ291dHB1dHNbXScsIG91dHB1dCwgb3V0cHV0Lm5hbWUpO1xuICAgIH1cblxuICAgIGZvcm1EYXRhLmFwcGVuZCgncHJvcGVydGllcycsIEpTT04uc3RyaW5naWZ5KHByb3BlcnRpZXMpKTtcblxuICAgIHJldHVybiB0aGlzLnBvc3Q8SHR0cEV2ZW50PHVua25vd24+PihgL3Byb2plY3RzLyR7cHJvamVjdF9pZH0vdGFza3NgLCBmb3JtRGF0YSwgdHJ1ZSwge1xuICAgICAgcmVwb3J0UHJvZ3Jlc3M6IHRydWUsXG4gICAgICBvYnNlcnZlOiAnZXZlbnRzJyBhcyBhbnksXG4gICAgfSk7XG4gIH1cblxuICBwdWJsaWMgdXBsb2FkVGFza0FyY2hpdmUocHJvamVjdF9pZDogc3RyaW5nLCBmaWxlczogRmlsZVtdKSB7XG4gICAgY29uc3QgZm9ybURhdGEgPSBuZXcgRm9ybURhdGEoKTtcbiAgICBpZiAoZmlsZXMpIHtcbiAgICAgIGZvciAoY29uc3QgZmlsZSBvZiBmaWxlcykge1xuICAgICAgICBmb3JtRGF0YS5hcHBlbmQoJ2ZpbGVzW10nLCBmaWxlLCBmaWxlLm5hbWUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzLnBvc3Q8SHR0cEV2ZW50PHVua25vd24+PihgL3Byb2plY3RzLyR7cHJvamVjdF9pZH0vdGFza3MvdXBsb2FkL2FyY2hpdmVgLCBmb3JtRGF0YSwgdHJ1ZSwge1xuICAgICAgcmVwb3J0UHJvZ3Jlc3M6IHRydWUsXG4gICAgICBvYnNlcnZlOiAnZXZlbnRzJyBhcyBhbnksXG4gICAgfSk7XG4gIH1cblxuICBwdWJsaWMgc3RhcnRCYXRjaFNlc3Npb24ocHJvamVjdF9pZDogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMucG9zdDxUYXNrQmF0Y2hTZXNzaW9uRHRvPihgL3Byb2plY3RzLyR7cHJvamVjdF9pZH0vdGFza3MvYmF0Y2gvc3RhcnRgLCB1bmRlZmluZWQsIHRydWUpO1xuICB9XG5cbiAgcHVibGljIGNhbmNlbEJhdGNoU2Vzc2lvbihwcm9qZWN0X2lkOiBzdHJpbmcsIHNlc3Npb25faWQ6IHN0cmluZywgc2Vzc2lvbl90aW1lc3RhbXA6IG51bWJlcikge1xuICAgIHJldHVybiB0aGlzLmRlbChgL3Byb2plY3RzLyR7cHJvamVjdF9pZH0vdGFza3MvYmF0Y2gvY2FuY2VsYCwgdHJ1ZSwge1xuICAgICAgc2Vzc2lvbl9pZCxcbiAgICAgIHNlc3Npb25fdGltZXN0YW1wLFxuICAgIH0pO1xuICB9XG5cbiAgcHVibGljIHN1Ym1pdEJhdGNoU2Vzc2lvbihwcm9qZWN0X2lkOiBzdHJpbmcsIHNlc3Npb25faWQ6IHN0cmluZywgc2Vzc2lvbl90aW1lc3RhbXA6IG51bWJlcikge1xuICAgIHJldHVybiB0aGlzLnBvc3Q8dm9pZD4oXG4gICAgICBgL3Byb2plY3RzLyR7cHJvamVjdF9pZH0vdGFza3MvYmF0Y2gvc3VibWl0YCxcbiAgICAgIHtcbiAgICAgICAgc2Vzc2lvbl9pZCxcbiAgICAgICAgc2Vzc2lvbl90aW1lc3RhbXAsXG4gICAgICB9LFxuICAgICAgdHJ1ZVxuICAgICk7XG4gIH1cblxuICBwdWJsaWMgYWRkQmF0Y2hVcGxvYWRUYXNrRGF0YShcbiAgICBzZXNzaW9uX3RpbWVzdGFtcDogbnVtYmVyLFxuICAgIHNlc3Npb25faWQ6IHN0cmluZyxcbiAgICBwcm9qZWN0X2lkOiBzdHJpbmcsXG4gICAgcHJvcGVydGllczogVGFza1Byb3BlcnRpZXMsXG4gICAgaW5wdXRzOiBGaWxlW10sXG4gICAgb3V0cHV0czogRmlsZVtdID0gW11cbiAgKTogT2JzZXJ2YWJsZTxIdHRwRXZlbnQ8dW5rbm93bj4+IHtcbiAgICBjb25zdCBmb3JtRGF0YSA9IG5ldyBGb3JtRGF0YSgpO1xuICAgIGZvcm1EYXRhLmFwcGVuZCgncHJvcGVydGllcycsIEpTT04uc3RyaW5naWZ5KHByb3BlcnRpZXMpKTtcblxuICAgIGZvciAoY29uc3QgaW5wdXQgb2YgaW5wdXRzKSB7XG4gICAgICBmb3JtRGF0YS5hcHBlbmQoJ2lucHV0c1tdJywgaW5wdXQsIGlucHV0Lm5hbWUpO1xuICAgIH1cblxuICAgIGZvciAoY29uc3Qgb3V0cHV0IG9mIG91dHB1dHMpIHtcbiAgICAgIGZvcm1EYXRhLmFwcGVuZCgnb3V0cHV0c1tdJywgb3V0cHV0LCBvdXRwdXQubmFtZSk7XG4gICAgfVxuXG4gICAgZm9ybURhdGEuYXBwZW5kKCdzZXNzaW9uX2lkJywgc2Vzc2lvbl9pZCk7XG4gICAgZm9ybURhdGEuYXBwZW5kKCdzZXNzaW9uX3RpbWVzdGFtcCcsIHNlc3Npb25fdGltZXN0YW1wLnRvU3RyaW5nKCkpO1xuXG4gICAgcmV0dXJuIHRoaXMucG9zdDxIdHRwRXZlbnQ8dW5rbm93bj4+KGAvcHJvamVjdHMvJHtwcm9qZWN0X2lkfS90YXNrcy9iYXRjaC91cGxvYWRgLCBmb3JtRGF0YSwgdHJ1ZSwge1xuICAgICAgcmVwb3J0UHJvZ3Jlc3M6IHRydWUsXG4gICAgICBvYnNlcnZlOiAnZXZlbnRzJyBhcyBhbnksXG4gICAgfSk7XG4gIH1cblxuICBwdWJsaWMgcmVtb3ZlVGFzayhwcm9qZWN0X2lkOiBzdHJpbmcsIHRhc2tfaWQ6IHN0cmluZyk6IE9ic2VydmFibGU8dm9pZD4ge1xuICAgIHJldHVybiB0aGlzLmRlbChgL3Byb2plY3RzLyR7cHJvamVjdF9pZH0vdGFza3MvJHt0YXNrX2lkfWAsIHRydWUpO1xuICB9XG5cbiAgcHVibGljIGxpc3RNeUFjY291bnRGaWVsZHMoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0PEFjY291bnRGaWVsZFZhbHVlRGVmaW5pdGlvbkR0b1tdPignL2FjY291bnRzL21lL2ZpZWxkcycsIHRydWUpO1xuICB9XG5cbiAgcHVibGljIGdldFByb2plY3RTdGF0aXN0aWNzKGlkOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5nZXQ8UHJvamVjdFN0YXRpc3RpY3NEdG8+KGAvcHJvamVjdHMvJHtpZH0vc3RhdGlzdGljc2AsIHRydWUpO1xuICB9XG5cbiAgcHVibGljIHNhdmVNeUFjY291bnRGaWVsZFZhbHVlcyhkYXRhOiBSZWNvcmQ8c3RyaW5nLCBhbnk+KSB7XG4gICAgcmV0dXJuIHRoaXMucG9zdDx2b2lkPignL2FjY291bnRzL21lL2ZpZWxkcycsIGRhdGEsIHRydWUpO1xuICB9XG5cbiAgcHVibGljIHNhdmVNeUFjY291bnRTZXR0aW5ncyhkYXRhOiBBY2NvdW50U2V0dGluZ3NEdG8pIHtcbiAgICByZXR1cm4gdGhpcy5wdXQ8dm9pZD4oJy9hY2NvdW50cy9tZS9zZXR0aW5ncycsIGRhdGEsIHRydWUpO1xuICB9XG5cbiAgcHVibGljIGxpc3RSb2xlcygpIHtcbiAgICByZXR1cm4gdGhpcy5nZXQ8Um9sZUR0b1tdPignL2FwcC9yb2xlcycsIHRydWUpO1xuICB9XG5cbiAgcHVibGljIGdldFJvbGUoaWQ6IHN0cmluZykge1xuICAgIHJldHVybiB0aGlzLmdldDxSb2xlRHRvPihgL2FwcC9yb2xlcy8ke2lkfWAsIHRydWUpO1xuICB9XG5cbiAgcHVibGljIHJlcXVlc3RQYXNzd29yZFJlc2V0KGR0bzogUmVzZXRQYXNzd29yZFJlcXVlc3REdG8pIHtcbiAgICByZXR1cm4gdGhpcy5wb3N0PGFueT4oYC9hY2NvdW50cy9yZXF1ZXN0LXBhc3N3b3JkLXJlc2V0YCwgZHRvLCBmYWxzZSk7XG4gIH1cblxuICBwdWJsaWMgcnVuQWNjb3VudEJhdGNoQWN0aW9uKGR0bzogQWNjb3VudEJhdGNoQWN0aW9uRHRvKSB7XG4gICAgcmV0dXJuIHRoaXMucG9zdDx2b2lkPihgL2FjY291bnRzL2JhdGNoL3J1bkFjdGlvbmAsIGR0bywgdHJ1ZSk7XG4gIH1cblxuICBwdWJsaWMgY3JlYXRlUm9sZShkdG86IFJvbGVDcmVhdGVEdG8pIHtcbiAgICByZXR1cm4gdGhpcy5wb3N0PFJvbGVEdG8+KGAvYXBwL3JvbGVzYCwgZHRvLCB0cnVlKTtcbiAgfVxuXG4gIHB1YmxpYyBjaGFuZ2VSb2xlKGlkOiBzdHJpbmcsIGR0bzogUm9sZUNyZWF0ZUR0bykge1xuICAgIHJldHVybiB0aGlzLnB1dDxSb2xlRHRvPihgL2FwcC9yb2xlcy8ke2lkfWAsIGR0bywgdHJ1ZSk7XG4gIH1cblxuICBwdWJsaWMgcmVtb3ZlUm9sZShpZDogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMuZGVsKGAvYXBwL3JvbGVzLyR7aWR9YCwgdHJ1ZSk7XG4gIH1cblxuICBwdWJsaWMgc2VhcmNoQWNjb3VudHMoa2V5d29yZDogc3RyaW5nKTogT2JzZXJ2YWJsZTxBY2NvdW50U2VhcmNoUmVzdWx0RHRvW10+IHtcbiAgICByZXR1cm4gdGhpcy5nZXQ8QWNjb3VudFNlYXJjaFJlc3VsdER0b1tdPignL2FjY291bnRzL3NlYXJjaD9rZXl3b3JkPScgKyBrZXl3b3JkLCB0cnVlKTtcbiAgfVxuXG4gIC8vIFRPRE8gZml4IGlzc3VlIHdpdGggcHJvamVjdCBhc3NpZ24gZHRvXG4gIHB1YmxpYyBhc3NpZ25Qcm9qZWN0Um9sZXMocHJvamVjdF9pZDogc3RyaW5nLCBkdG86IGFueVtdKTogT2JzZXJ2YWJsZTxhbnlbXT4ge1xuICAgIHJldHVybiB0aGlzLnBvc3Q8YW55W10+KGAvcHJvamVjdHMvJHtwcm9qZWN0X2lkfS9yb2xlc2AsIGR0bywgdHJ1ZSk7XG4gIH1cblxuICBwdWJsaWMgc2F2ZU15UGVyc29uYWxBY2NvdW50SW5mb3JtYXRpb24oZGF0YTogQ2hhbmdlQWNjb3VudEluZm9ybWF0aW9uRHRvKSB7XG4gICAgcmV0dXJuIHRoaXMucHV0PHZvaWQ+KCcvYWNjb3VudHMvbWUvcGVyc29uYWwtaW5mb3JtYXRpb24nLCBkYXRhLCB0cnVlKTtcbiAgfVxuXG4gIHB1YmxpYyBjaGFuZ2VQcm9qZWN0Um9sZShwcm9qZWN0X2lkOiBzdHJpbmcsIHJvbGVfaWQ6IHN0cmluZywgZGF0YTogYW55KSB7XG4gICAgcmV0dXJuIHRoaXMucHV0PFByb2plY3RSb2xlUmVzdWx0RHRvPihgL3Byb2plY3RzLyR7cHJvamVjdF9pZH0vcm9sZXMvJHtyb2xlX2lkfWAsIGRhdGEsIHRydWUpO1xuICB9XG5cbiAgcHVibGljIHJlbW92ZVByb2plY3RSb2xlKHByb2plY3RfaWQ6IHN0cmluZywgYWNjb3VudF9pZDogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMuZGVsKGAvcHJvamVjdHMvJHtwcm9qZWN0X2lkfS9yb2xlcy8ke2FjY291bnRfaWR9YCwgdHJ1ZSk7XG4gIH1cblxuICBwdWJsaWMgZ2V0QWNjb3VudEluZm9ybWF0aW9uKGlkOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5nZXQ8QWNjb3VudER0bz4oYGFjY291bnRzLyR7aWR9YCwgdHJ1ZSk7XG4gIH1cblxuICBwdWJsaWMgc2F2ZUFjY291bnRJbmZvcm1hdGlvbihpZDogc3RyaW5nLCBkdG86IEFjY291bnRDaGFuZ2VEdG8pIHtcbiAgICByZXR1cm4gdGhpcy5wdXQ8QWNjb3VudER0bz4oYGFjY291bnRzLyR7aWR9YCwgZHRvLCB0cnVlKTtcbiAgfVxuXG4gIHB1YmxpYyBsaXN0UG9saWNpZXMoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0PFBvbGljeU1pbmltYWxEdG9bXT4oYGFwcC9wb2xpY2llc2AsIHRydWUpO1xuICB9XG5cbiAgcHVibGljIGNyZWF0ZVBvbGljeShkdG86IFBvbGljeUNyZWF0ZVJlcXVlc3REdG8pIHtcbiAgICByZXR1cm4gdGhpcy5wb3N0PFBvbGljeUR0bz4oYGFwcC9wb2xpY2llc2AsIGR0bywgdHJ1ZSk7XG4gIH1cblxuICBwdWJsaWMgZ2V0UG9saWN5KGlkOiBudW1iZXIpIHtcbiAgICByZXR1cm4gdGhpcy5nZXQ8UG9saWN5RHRvPihgYXBwL3BvbGljaWVzLyR7aWR9YCwgdHJ1ZSk7XG4gIH1cblxuICBwdWJsaWMgdXBkYXRlUG9saWN5KGlkOiBudW1iZXIsIGR0bzogYW55KSB7XG4gICAgcmV0dXJuIHRoaXMucHV0PFBvbGljeUR0bz4oYGFwcC9wb2xpY2llcy8ke2lkfWAsIGR0bywgdHJ1ZSk7XG4gIH1cblxuICBwdWJsaWMgY3JlYXRlUG9saWN5VHJhbnNsYXRpb24ocG9saWN5X2lkOiBudW1iZXIsIGR0bzogUG9saWN5Q3JlYXRlVHJhbnNsYXRpb25EdG8pIHtcbiAgICBjb25zdCBmb3JtRGF0YSA9IG5ldyBGb3JtRGF0YSgpO1xuICAgIGlmIChkdG8uZmlsZXMpIHtcbiAgICAgIGZvciAoY29uc3QgaW5wdXQgb2YgZHRvLmZpbGVzKSB7XG4gICAgICAgIGZvcm1EYXRhLmFwcGVuZCgnZmlsZXNbXScsIGlucHV0LCBpbnB1dC5uYW1lKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGR0by51cmwpIHtcbiAgICAgIGZvcm1EYXRhLmFwcGVuZCgndXJsJywgZHRvLnVybCk7XG4gICAgfVxuXG4gICAgaWYgKGR0by50ZXh0KSB7XG4gICAgICBmb3JtRGF0YS5hcHBlbmQoJ3RleHQnLCBkdG8udGV4dCk7XG4gICAgfVxuXG4gICAgZm9ybURhdGEuYXBwZW5kKCdsb2NhbGUnLCBkdG8ubG9jYWxlKTtcbiAgICByZXR1cm4gdGhpcy5wb3N0PFBvbGljeVRyYW5zbGF0aW9uRHRvPihgL2FwcC9wb2xpY2llcy8ke3BvbGljeV9pZH0vdHJhbnNsYXRpb25zYCwgZm9ybURhdGEsIHRydWUpO1xuICB9XG5cbiAgcHVibGljIGNoYW5nZVBvbGljeVRyYW5zbGF0aW9uKHBvbGljeV9pZDogbnVtYmVyLCBwb2xpY3lfdHJhbnNsYXRpb25faWQ6IG51bWJlciwgZHRvOiBQb2xpY3lDcmVhdGVUcmFuc2xhdGlvbkR0bykge1xuICAgIGNvbnN0IGZvcm1EYXRhID0gbmV3IEZvcm1EYXRhKCk7XG4gICAgaWYgKGR0by5maWxlcykge1xuICAgICAgZm9yIChjb25zdCBpbnB1dCBvZiBkdG8uZmlsZXMpIHtcbiAgICAgICAgZm9ybURhdGEuYXBwZW5kKCdmaWxlc1tdJywgaW5wdXQsIGlucHV0Lm5hbWUpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoZHRvLnVybCkge1xuICAgICAgZm9ybURhdGEuYXBwZW5kKCd1cmwnLCBkdG8udXJsKTtcbiAgICB9XG5cbiAgICBpZiAoZHRvLnRleHQpIHtcbiAgICAgIGZvcm1EYXRhLmFwcGVuZCgndGV4dCcsIGR0by50ZXh0KTtcbiAgICB9XG5cbiAgICBmb3JtRGF0YS5hcHBlbmQoJ2xvY2FsZScsIGR0by5sb2NhbGUpO1xuICAgIHJldHVybiB0aGlzLnB1dDxQb2xpY3lUcmFuc2xhdGlvbkR0bz4oYC9hcHAvcG9saWNpZXMvJHtwb2xpY3lfaWR9L3RyYW5zbGF0aW9ucy8ke3BvbGljeV90cmFuc2xhdGlvbl9pZH1gLCBmb3JtRGF0YSwgdHJ1ZSk7XG4gIH1cblxuICBwdWJsaWMgcmVtb3ZlUG9saWN5KHBvbGljeV9pZDogbnVtYmVyKSB7XG4gICAgcmV0dXJuIHRoaXMuZGVsKGBhcHAvcG9saWNpZXMvJHtwb2xpY3lfaWR9YCwgdHJ1ZSk7XG4gIH1cblxuICBwdWJsaWMgcHVibGlzaFBvbGljaWVzKGR0bzogUG9saWN5UHVibGlzaFJlcXVlc3REdG8pIHtcbiAgICByZXR1cm4gdGhpcy5wdXQoYGFwcC9wb2xpY2llcy9wdWJsaXNoYCwgZHRvLCB0cnVlKTtcbiAgfVxuXG4gIHB1YmxpYyByZW1vdmVQb2xpY3lUcmFuc2xhdGlvbihwb2xpY3lfaWQ6IG51bWJlciwgdHJhbnNsYXRpb25faWQ6IG51bWJlcikge1xuICAgIHJldHVybiB0aGlzLmRlbChgYXBwL3BvbGljaWVzLyR7cG9saWN5X2lkfS90cmFuc2xhdGlvbnMvJHt0cmFuc2xhdGlvbl9pZH1gLCB0cnVlKTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0PFQ+KHBhcnRVUkw6IHN0cmluZywgbmVlZHNKV1Q6IGJvb2xlYW4pOiBPYnNlcnZhYmxlPFQ+IHtcbiAgICBjb25zdCBoZWFkZXJzID0gdGhpcy5nZXRIZWFkZXJzKG5lZWRzSldUKTtcbiAgICBwYXJ0VVJMID0gcGFydFVSTC5pbmRleE9mKCcvJykgPT09IDAgPyBwYXJ0VVJMLnN1YnN0cmluZygxKSA6IHBhcnRVUkw7XG4gICAgcmV0dXJuIHRoaXMuaHR0cC5nZXQ8VD4oYCR7dGhpcy5fYXBpVVJMfS8ke3BhcnRVUkx9YCwge1xuICAgICAgcmVzcG9uc2VUeXBlOiAnanNvbicsXG4gICAgICBoZWFkZXJzLFxuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBwb3N0PFQ+KFxuICAgIHBhcnRVUkw6IHN0cmluZyxcbiAgICBkYXRhOiBhbnksXG4gICAgbmVlZHNKV1Q6IGJvb2xlYW4sXG4gICAgb3B0aW9ucz86IHtcbiAgICAgIGhlYWRlcnM/OlxuICAgICAgICB8IEh0dHBIZWFkZXJzXG4gICAgICAgIHwge1xuICAgICAgICAgICAgW2hlYWRlcjogc3RyaW5nXTogc3RyaW5nIHwgc3RyaW5nW107XG4gICAgICAgICAgfTtcbiAgICAgIGNvbnRleHQ/OiBIdHRwQ29udGV4dDtcbiAgICAgIG9ic2VydmU/OiAnYm9keSc7XG4gICAgICBwYXJhbXM/OlxuICAgICAgICB8IEh0dHBQYXJhbXNcbiAgICAgICAgfCB7XG4gICAgICAgICAgICBbcGFyYW06IHN0cmluZ106IHN0cmluZyB8IG51bWJlciB8IGJvb2xlYW4gfCBSZWFkb25seUFycmF5PHN0cmluZyB8IG51bWJlciB8IGJvb2xlYW4+O1xuICAgICAgICAgIH07XG4gICAgICByZXBvcnRQcm9ncmVzcz86IGJvb2xlYW47XG4gICAgICByZXNwb25zZVR5cGU/OiAnanNvbic7XG4gICAgICB3aXRoQ3JlZGVudGlhbHM/OiBib29sZWFuO1xuICAgIH1cbiAgKTogT2JzZXJ2YWJsZTxUPiB7XG4gICAgY29uc3QgaGVhZGVycyA9IHRoaXMuZ2V0SGVhZGVycyhuZWVkc0pXVCk7XG4gICAgcGFydFVSTCA9IHBhcnRVUkwuaW5kZXhPZignLycpID09PSAwID8gcGFydFVSTC5zdWJzdHJpbmcoMSkgOiBwYXJ0VVJMO1xuICAgIHJldHVybiB0aGlzLmh0dHAucG9zdDxUPihgJHt0aGlzLl9hcGlVUkx9LyR7cGFydFVSTH1gLCBkYXRhLCB7XG4gICAgICAuLi5vcHRpb25zLFxuICAgICAgcmVzcG9uc2VUeXBlOiAnanNvbicsXG4gICAgICBoZWFkZXJzLFxuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBwdXQ8VD4ocGFydFVSTDogc3RyaW5nLCBkYXRhOiBhbnksIG5lZWRzSldUOiBib29sZWFuKTogT2JzZXJ2YWJsZTxUPiB7XG4gICAgY29uc3QgaGVhZGVycyA9IHRoaXMuZ2V0SGVhZGVycyhuZWVkc0pXVCk7XG4gICAgcGFydFVSTCA9IHBhcnRVUkwuaW5kZXhPZignLycpID09PSAwID8gcGFydFVSTC5zdWJzdHJpbmcoMSkgOiBwYXJ0VVJMO1xuICAgIHJldHVybiB0aGlzLmh0dHAucHV0PFQ+KGAke3RoaXMuX2FwaVVSTH0vJHtwYXJ0VVJMfWAsIGRhdGEsIHtcbiAgICAgIHJlc3BvbnNlVHlwZTogJ2pzb24nLFxuICAgICAgaGVhZGVycyxcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgZGVsKHBhcnRVUkw6IHN0cmluZywgbmVlZHNKV1Q6IGJvb2xlYW4sIGRhdGE6IGFueSA9IHVuZGVmaW5lZCk6IE9ic2VydmFibGU8dm9pZD4ge1xuICAgIGNvbnN0IGhlYWRlcnMgPSB0aGlzLmdldEhlYWRlcnMobmVlZHNKV1QpO1xuICAgIHBhcnRVUkwgPSBwYXJ0VVJMLmluZGV4T2YoJy8nKSA9PT0gMCA/IHBhcnRVUkwuc3Vic3RyaW5nKDEpIDogcGFydFVSTDtcbiAgICBjb25zdCBvcHRpb25zOiBhbnkgPSB7XG4gICAgICByZXNwb25zZVR5cGU6ICdqc29uJyxcbiAgICAgIGhlYWRlcnMsXG4gICAgICBib2R5OiBkYXRhLFxuICAgIH07XG5cbiAgICBpZiAoIWRhdGEpIHtcbiAgICAgIGRlbGV0ZSBvcHRpb25zLmJvZHk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmh0dHAuZGVsZXRlKGAke3RoaXMuX2FwaVVSTH0vJHtwYXJ0VVJMfWAsIG9wdGlvbnMpLnBpcGUoXG4gICAgICBtYXAoKGEpID0+IHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfSlcbiAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRIZWFkZXJzKG5lZWRzSldUOiBib29sZWFuKSB7XG4gICAgbGV0IGhlYWRlcnM6IHtcbiAgICAgIEF1dGhvcml6YXRpb24/OiBzdHJpbmc7XG4gICAgICAnWC1BcHAtVG9rZW4nOiBzdHJpbmc7XG4gICAgfSA9IHtcbiAgICAgICdYLUFwcC1Ub2tlbic6IHRoaXMuYXBwVG9rZW4sXG4gICAgfTtcblxuICAgIGlmIChuZWVkc0pXVCAmJiAhdGhpcy51c2VDb29raWVTdHJhdGVneSkge1xuICAgICAgaGVhZGVycyA9IHtcbiAgICAgICAgLi4uaGVhZGVycyxcbiAgICAgICAgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke3RoaXMuX3dlYlRva2VufWAsXG4gICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiBoZWFkZXJzO1xuICB9XG5cbiAgZ2V0Q29va2llKGNuYW1lOiBzdHJpbmcpOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICAgIGNvbnN0IG5hbWUgPSBjbmFtZSArICc9JztcbiAgICBjb25zdCBkZWNvZGVkQ29va2llID0gZGVjb2RlVVJJQ29tcG9uZW50KGRvY3VtZW50LmNvb2tpZSk7XG4gICAgY29uc3QgY2EgPSBkZWNvZGVkQ29va2llLnNwbGl0KCc7Jyk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjYS5sZW5ndGg7IGkrKykge1xuICAgICAgbGV0IGMgPSBjYVtpXTtcbiAgICAgIHdoaWxlIChjLmNoYXJBdCgwKSA9PSAnICcpIHtcbiAgICAgICAgYyA9IGMuc3Vic3RyaW5nKDEpO1xuICAgICAgfVxuICAgICAgaWYgKGMuaW5kZXhPZihuYW1lKSA9PSAwKSB7XG4gICAgICAgIHJldHVybiBjLnN1YnN0cmluZyhuYW1lLmxlbmd0aCwgYy5sZW5ndGgpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgcHJlcGFyZUZpbGVVUkwoZmlsZVVSTDogc3RyaW5nKSB7XG4gICAgaWYgKCF0aGlzLnVzZUNvb2tpZVN0cmF0ZWd5KSB7XG4gICAgICAvLyBhcHBlbmQgcXVlcnkgcGFyYW1zXG4gICAgICByZXR1cm4gYCR7ZmlsZVVSTH0/c2Vzc2lvbl90b2tlbj0ke3RoaXMuX3dlYlRva2VufWA7XG4gICAgfVxuICAgIHJldHVybiBmaWxlVVJMO1xuICB9XG5cbiAgcG9zdE9uTmV3VGFiKHBhcnRVUkw6IHN0cmluZywgZGF0YTogYW55KSB7XG4gICAgcGFydFVSTCA9IHBhcnRVUkwuaW5kZXhPZignLycpID09PSAwID8gcGFydFVSTC5zdWJzdHJpbmcoMSkgOiBwYXJ0VVJMO1xuXG4gICAgY29uc3QgdGVtcG9yYXJ5Rm9ybSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2Zvcm0nKTtcbiAgICB0ZW1wb3JhcnlGb3JtLnNldEF0dHJpYnV0ZSgnaWQnLCAndGVtcG9yYXJ5Rm9ybScpO1xuICAgIHRlbXBvcmFyeUZvcm0uc2V0QXR0cmlidXRlKCdtZXRob2QnLCAncG9zdCcpO1xuICAgIHRlbXBvcmFyeUZvcm0uc2V0QXR0cmlidXRlKCdhY3Rpb24nLCB0aGlzLl9hcGlVUkwgKyBgLyR7cGFydFVSTH1gKTtcbiAgICB0ZW1wb3JhcnlGb3JtLnNldEF0dHJpYnV0ZSgndGFyZ2V0JywgJ19ibGFuaycpO1xuXG4gICAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMoZGF0YSkpIHtcbiAgICAgIGlmIChkYXRhW2tleV0gIT09IHVuZGVmaW5lZCAmJiBkYXRhW2tleV0gIT09IG51bGwpIHtcbiAgICAgICAgY29uc3QgaGlkZGVuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgICAgICAgaGlkZGVuLnNldEF0dHJpYnV0ZSgnc3R5bGUnLCAnZGlzcGxheTpub25lJyk7XG4gICAgICAgIGhpZGRlbi5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCAnaGlkZGVuJyk7XG4gICAgICAgIGhpZGRlbi5zZXRBdHRyaWJ1dGUoJ25hbWUnLCBrZXkpO1xuICAgICAgICBoaWRkZW4udmFsdWUgPSBkYXRhWycnICsga2V5XTtcblxuICAgICAgICB0ZW1wb3JhcnlGb3JtLmFwcGVuZENoaWxkKGhpZGRlbik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0ZW1wb3JhcnlGb3JtKTtcbiAgICB0ZW1wb3JhcnlGb3JtLnN1Ym1pdCgpO1xuICB9XG59XG4iXX0=
