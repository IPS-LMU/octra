import * as i0 from '@angular/core';
import {Injectable, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import * as i1 from '@angular/common/http';
import {exhaustMap, map, of, throwError} from 'rxjs';

function removeProperties(obj, properties) {
    if (obj) {
        const keys = Object.keys(obj);
        for (const property of properties) {
            if (keys.find((a) => a === property)) {
                delete obj[property];
            }
        }
    }
    return obj;
}
function removeNullAttributes(obj) {
    if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; i++) {
            obj[i] = removeNullAttributes(obj[i]);
        }
    }
    else {
        if (typeof obj === 'object') {
            const anyObj = obj;
            const keys = Object.keys(anyObj);
            for (const key of keys) {
                if (anyObj[key] === null || anyObj[key] === undefined || anyObj[key].toString() === 'NaN') {
                    delete anyObj[key];
                }
                else if (typeof anyObj[key] === 'object') {
                    anyObj[key] = removeNullAttributes([anyObj[key]])[0];
                }
            }
            return anyObj;
        }
    }
    return obj;
}

class OctraAPIService {
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

class NgxOctraApiModule {
}
NgxOctraApiModule.ɵfac = function NgxOctraApiModule_Factory(t) { return new (t || NgxOctraApiModule)(); };
NgxOctraApiModule.ɵmod = /*@__PURE__*/ i0.ɵɵdefineNgModule({ type: NgxOctraApiModule });
NgxOctraApiModule.ɵinj = /*@__PURE__*/ i0.ɵɵdefineInjector({ providers: [OctraAPIService], imports: [CommonModule] });
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(NgxOctraApiModule, [{
        type: NgModule,
        args: [{
                imports: [CommonModule],
                exports: [],
                providers: [OctraAPIService],
            }]
    }], null, null); })();
(function () { (typeof ngJitMode === "undefined" || ngJitMode) && i0.ɵɵsetNgModuleScope(NgxOctraApiModule, { imports: [CommonModule] }); })();

/**
 * Generated bundle index. Do not edit.
 */

export { NgxOctraApiModule, OctraAPIService };
//# sourceMappingURL=octra-ngx-octra-api.mjs.map
