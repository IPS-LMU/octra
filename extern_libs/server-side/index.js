import * as fs from 'fs-extra';
import { exists } from 'fs-extra';
import * as Path from 'path';
import { join } from 'path';
import { Validator } from 'jsonschema';
import { Logger, applyDecorators } from '@nestjs/common';
import * as process$1 from 'process';
import * as fs$1 from 'fs';
import { scrypt, createHash, createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { DefaultNamingStrategy, Column, CreateDateColumn, UpdateDateColumn, PrimaryGeneratedColumn, Entity, OneToOne, JoinColumn, OneToMany, ManyToOne } from 'typeorm';
import * as os from 'os';
import { TaskStatus, TaskInputOutputCreatorType, AudioFileMetaData, AccountRoleScope, RoleBadgeSettings, AccountPersonGender, PolicyType, AccountFieldContext, AccountFieldDefinition2 } from '@octra/api-types';
import { IsOptional, IsString, IsNumber, Matches, IsEnum, IsBoolean, IsNotEmpty, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AccountEntity as AccountEntity$1, ProjectEntity as ProjectEntity$1 } from '@octra/server-side';
import { networkInterfaces } from 'node:os';
import { exec } from 'child_process';

const AppConfigurationSchema = {
    required: [
        'version',
        'database',
        'api'
    ],
    properties: {
        version: {
            type: 'string',
            pattern: '[0-9].[0-9].[0-9]'
        },
        database: {
            required: [
                'dbType',
                'dbHost',
                'dbPort',
                'dbUser',
                'dbPassword'
            ],
            properties: {
                dbType: {
                    type: 'string',
                    enum: [
                        'postgres',
                        'sqlite'
                    ]
                },
                dbHost: {
                    type: 'string'
                },
                dbPort: {
                    type: 'number'
                },
                dbName: {
                    type: 'string'
                },
                dbUser: {
                    type: 'string'
                },
                dbPassword: {
                    type: 'string'
                },
                ssl: {
                    type: 'object',
                    required: [
                        'rejectUnauthorized'
                    ],
                    properties: {
                        rejectUnauthorized: {
                            type: 'boolean',
                            required: true
                        },
                        ca: {
                            type: 'string'
                        },
                        key: {
                            type: 'string'
                        },
                        cert: {
                            type: 'string'
                        }
                    }
                }
            }
        },
        api: {
            type: 'object',
            required: [
                'url',
                'host',
                'port',
                'security',
                'paths',
                'admin_email'
            ],
            properties: {
                url: {
                    type: 'string'
                },
                host: {
                    type: 'string'
                },
                port: {
                    type: 'number'
                },
                debugging: {
                    type: 'boolean'
                },
                serveWebApps: {
                    type: 'boolean'
                },
                logging: {
                    type: 'array',
                    items: {
                        type: 'enum',
                        enum: [
                            'log',
                            'error',
                            'warn',
                            'debug',
                            'verbose'
                        ]
                    }
                },
                admin_email: {
                    type: 'string'
                },
                paths: {
                    type: 'object',
                    required: [
                        'projectsFolder',
                        'uploadFolder'
                    ],
                    properties: {
                        projectsFolder: {
                            type: 'string'
                        },
                        uploadFolder: {
                            type: 'string'
                        }
                    }
                },
                maintenance: {
                    type: 'object',
                    properties: {
                        garbageCollection: {
                            type: 'object',
                            properties: {
                                interval: {
                                    type: 'number',
                                    minimum: 15,
                                    description: 'value in minutes'
                                },
                                projectFolders: {
                                    type: 'object',
                                    properties: {
                                        removeTempAfter: {
                                            type: 'number',
                                            minimum: 1,
                                            description: 'value in hours'
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                performance: {
                    type: 'object',
                    properties: {
                        cluster: {
                            type: 'object',
                            properties: {
                                enabled: {
                                    type: 'boolean'
                                },
                                maxParallelWorkers: {
                                    type: 'number',
                                    description: 'number of parallel threads.'
                                }
                            }
                        }
                    }
                },
                security: {
                    type: 'object',
                    properties: {
                        session_expiration_time: {
                            type: 'string',
                            pattern: '^[0-9]+[mhd]$'
                        },
                        trustProxy: {
                            type: 'boolean'
                        },
                        keys: {
                            type: 'object',
                            properties: {
                                password: {
                                    type: 'object',
                                    required: [
                                        'secret',
                                        'salt'
                                    ],
                                    properties: {
                                        secret: {
                                            type: 'string'
                                        },
                                        salt: {
                                            type: 'string'
                                        }
                                    }
                                },
                                jwt: {
                                    type: 'object',
                                    required: [
                                        'secret',
                                        'salt'
                                    ],
                                    properties: {
                                        secret: {
                                            type: 'string'
                                        },
                                        salt: {
                                            type: 'string'
                                        }
                                    }
                                },
                                url: {
                                    type: 'object',
                                    required: [
                                        'secret',
                                        'salt'
                                    ],
                                    properties: {
                                        secret: {
                                            type: 'string'
                                        },
                                        salt: {
                                            type: 'string'
                                        }
                                    }
                                }
                            }
                        },
                        ssl: {
                            type: 'object',
                            required: [
                                'enabled',
                                'options'
                            ],
                            properties: {
                                enabled: {
                                    type: 'boolean'
                                },
                                options: {
                                    type: 'object',
                                    required: [],
                                    properties: {
                                        keyPath: {
                                            type: 'string'
                                        },
                                        certPath: {
                                            type: 'string'
                                        },
                                        caPath: {
                                            type: 'string'
                                        },
                                        passphrase: {
                                            type: 'string'
                                        },
                                        selfSignedCertificates: {
                                            type: 'boolean'
                                        },
                                        rejectUnauthorized: {
                                            type: 'boolean'
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                email: {
                    type: 'object',
                    required: [
                        'enabled',
                        'method',
                        'from',
                        'host',
                        'workflow'
                    ],
                    properties: {
                        enabled: {
                            type: 'boolean'
                        },
                        method: {
                            type: 'string',
                            enum: [
                                'smtp'
                            ]
                        },
                        from: {
                            type: 'object',
                            required: [
                                'name',
                                'address'
                            ],
                            properties: {
                                name: {
                                    type: 'string'
                                },
                                address: {
                                    type: 'string'
                                }
                            }
                        },
                        host: {
                            type: 'string'
                        },
                        port: {
                            type: 'number'
                        },
                        authentication: {
                            type: 'object',
                            properties: {
                                user: {
                                    type: 'string'
                                },
                                password: {
                                    type: 'string'
                                }
                            }
                        },
                        workflow: {
                            type: 'object',
                            required: [
                                'interval',
                                'maxNotificationsAtOnce'
                            ],
                            properties: {
                                interval: {
                                    type: 'number'
                                },
                                maxNotificationsAtOnce: {
                                    type: 'number'
                                }
                            }
                        }
                    }
                },
                plugins: {
                    type: 'object',
                    required: [
                        'reference'
                    ],
                    properties: {
                        reference: {
                            required: [
                                'enabled'
                            ],
                            type: 'object',
                            properties: {
                                enabled: {
                                    type: 'boolean'
                                },
                                protection: {
                                    type: 'object',
                                    properties: {
                                        enabled: {
                                            type: 'boolean'
                                        },
                                        username: {
                                            type: 'string'
                                        },
                                        password: {
                                            type: 'string'
                                        }
                                    }
                                }
                            }
                        },
                        shibboleth: {
                            required: [
                                'enabled',
                                'secret',
                                'uuidSalt',
                                'windowURL'
                            ],
                            type: 'object',
                            properties: {
                                enabled: {
                                    type: 'boolean'
                                },
                                secret: {
                                    type: 'string'
                                },
                                uuidSalt: {
                                    type: 'string'
                                },
                                windowURL: {
                                    type: 'string'
                                }
                            }
                        },
                        webBackend: {
                            required: [
                                'enabled',
                                'url',
                                'appToken'
                            ],
                            type: 'object',
                            properties: {
                                enabled: {
                                    type: 'boolean'
                                },
                                url: {
                                    type: 'string'
                                },
                                appToken: {
                                    type: 'string'
                                }
                            }
                        }
                    }
                }
            }
        }
    }
};

class Configuration {
    static getInstance(configPath) {
        if (!this.configuration) {
            configPath = join(configPath != null ? configPath : '', 'config.json');
            const validator = new Validator();
            const json = fs.readJSONSync(configPath, 'utf8');
            const validation = validator.validate(json, AppConfigurationSchema);
            if (!validation.valid) {
                Logger.error(`\nValidation configuration errors found (config at ${configPath}):\n-> ${validation.errors.map((a)=>`${a.path.join('.')}: ${a.message}`).join('\n-> ')}`, 'NestApplication');
                process$1.exit(1);
            }
            this.configuration = json;
        }
        return this.configuration;
    }
    static overwrite(apiConfig) {
        this.configuration = apiConfig;
    }
}

function _extends() {
    _extends = Object.assign || function assign(target) {
        for(var i = 1; i < arguments.length; i++){
            var source = arguments[i];
            for(var key in source)if (Object.prototype.hasOwnProperty.call(source, key)) target[key] = source[key];
        }
        return target;
    };
    return _extends.apply(this, arguments);
}

class CryptoHelper {
    async encrypt(text, algorithm, textEncoding, resultEncoding) {
        return this.doCipherIVProcessing(text, algorithm, true, textEncoding, resultEncoding);
    }
    async decrypt(text, algorithm, textEncoding, resultEncoding) {
        return this.doCipherIVProcessing(text, algorithm, false, textEncoding, resultEncoding);
    }
    async doCipherIVProcessing(text, algorithm, encryption, textEncoding, resultEncoding) {
        return new Promise(async (resolve, reject)=>{
            const key = await this.scryptAsync(this.key, this.salt, 32);
            const iv = Buffer.from('1234567890123456', 'utf-8');
            const func = encryption ? createCipheriv : createDecipheriv;
            const decipher = func(algorithm, key, iv);
            decipher.setEncoding(resultEncoding);
            let result = '';
            decipher.on('data', (chunk)=>{
                if (chunk !== null) {
                    result += chunk.toString();
                }
            });
            decipher.on('end', ()=>{
                resolve(result);
            });
            decipher.on('error', (error)=>{
                reject(error);
            });
            decipher.write(text, textEncoding);
            decipher.end();
        });
    }
    async scryptAsync(password, salt, keylen) {
        return new Promise((resolve, reject)=>{
            scrypt(password, salt, keylen, (err, derivedKey)=>{
                if (err) {
                    reject(err);
                } else {
                    resolve(derivedKey);
                }
            });
        });
    }
    static async hash(text, algorithm) {
        return new Promise((resolve, reject)=>{
            const hash = createHash(algorithm);
            hash.setEncoding('hex');
            let result = '';
            hash.on('readable', ()=>{
                const data = hash.read();
                if (data) {
                    result += data.toString();
                }
            });
            hash.on('end', ()=>{
                resolve(result);
            });
            hash.on('error', (error)=>{
                reject(error);
            });
            hash.write(text);
            hash.end();
        });
    }
    constructor(key, salt){
        this.key = key;
        this.salt = salt;
    }
}

function isFunction(functionToCheck) {
    return functionToCheck && ({}).toString.call(functionToCheck) === '[object Function]';
}
function removeNullAttributes(obj, undefinedOnly = false) {
    if (!obj) {
        return obj;
    }
    if (Array.isArray(obj)) {
        for(let i = 0; i < obj.length; i++){
            obj[i] = removeNullAttributes(obj[i]);
        }
    } else {
        if (!isFunction(obj) && typeof obj === 'object') {
            const anyObj = obj;
            const keys = Object.keys(obj);
            for (const key of keys){
                if (!undefinedOnly && anyObj[key] === null || anyObj[key] === undefined || !undefinedOnly && anyObj[key] !== null && anyObj[key].toString() === 'NaN') {
                    delete anyObj[key];
                } else if (typeof anyObj[key] === 'object') {
                    anyObj[key] = removeNullAttributes([
                        anyObj[key]
                    ])[0];
                }
            }
        }
    }
    return obj;
}
function removeProperties(obj, properties) {
    const copy = _extends({}, obj);
    if (copy) {
        const keys = Object.keys(copy);
        for (const property of properties){
            if (keys.find((a)=>a === property)) {
                delete copy[property];
            }
        }
    }
    return copy;
}
async function getPasswordHash(salt, password) {
    salt = await CryptoHelper.hash(salt, 'sha256');
    const result = await CryptoHelper.hash(password + salt, 'sha256');
    return result;
}
async function getToolHash(toolConfig) {
    let hashContent;
    if (toolConfig.type !== 'web-application' && await fs.pathExists(toolConfig.path)) {
        // create Hash from file
        const fileBuffer = await fs.readFile(toolConfig.path);
        const hashSum = createHash('sha256');
        hashSum.update(fileBuffer);
        return hashSum.digest('hex');
    } else {
        console.log(`create hash from ${toolConfig.name}${toolConfig.version}${toolConfig.path}`);
        hashContent = `${toolConfig.name}${toolConfig.version}${toolConfig.path}`;
        return CryptoHelper.hash(hashContent, 'sha256').toString();
    }
}
function getRandomString(length) {
    return randomBytes(length).toString('base64').substring(0, length);
}
function joinURL(...args) {
    const argStr = [];
    args = args.filter((a)=>a !== '/' && a !== '' && a !== undefined && a !== null);
    for (const str of args){
        const found = /^\/+?(.+)\/+$/g.exec(str);
        if (found && found.length > 0) {
            argStr.push(found[1]);
        } else {
            argStr.push(str);
        }
    }
    return argStr.join('/');
}
function appendURLQueryParams(url, params) {
    let startingLetter = '?';
    if (/[^/]*\?([^/]*)$/g.exec(url)) {
        startingLetter = '&';
    }
    const array = [];
    for(const attr in params){
        if (params[attr] !== undefined && params[attr] !== null) {
            array.push(`${attr}=${encodeURI(params[attr].toString())}`);
        }
    }
    const query = array.length > 0 ? `${startingLetter}${array.join('&')}` : '';
    return `${url}${query}`;
}
function isHiddenPath(path) {
    const pathParts = path.split(Path.sep).filter((a)=>a.trim() !== '');
    const hiddenNames = [
        '__MACOSX',
        'Thumbs.db',
        'Thumbs.db:encryptable',
        'ehthumbs.db',
        'ehthumbs_vista.db',
        'Desktop.ini',
        'desktop.ini',
        '$RECYCLE.BIN'
    ];
    const containsHiddenName = !!hiddenNames.find((a)=>pathParts.includes(a));
    if (containsHiddenName) {
        return true;
    }
    const filename = Path.basename(path);
    return filename.indexOf('.') === 0;
}
function getConfigPath() {
    if (!process.env['OCB_DEV']) {
        return Path.parse(process.execPath).dir;
    } else {
        return process.cwd();
    }
}
function ensureNumber(num) {
    return num === undefined || num === null || isNaN(num) ? undefined : num;
}

class DbNamingStrategy extends DefaultNamingStrategy {
    foreignKeyName(tableOrName, columnNames, referencedTablePath, referencedColumnNames) {
        tableOrName = typeof tableOrName === 'string' ? tableOrName : tableOrName.name;
        const name = columnNames.reduce((name, column)=>`${name}_${column}`, `${tableOrName}_${referencedTablePath}`).replace('public.', '');
        return `${name}_fkey`;
    }
    primaryKeyName(tableOrName, columnNames) {
        tableOrName = typeof tableOrName === 'string' ? tableOrName : tableOrName.name;
        const name = columnNames.reduce((name, column)=>`${name}_${column}`, `${tableOrName}`).replace('public.', '');
        return `${name}_pkey`;
    }
}

class SQLTypeMapper {
    map(postgresType) {
        if (this.dbType !== 'postgres') {
            if (Object.keys(this.mappings).indexOf(this.dbType) > -1) {
                return this.mappings[this.dbType][postgresType];
            } else {
                throw new Error(`Missing key for dbType ${this.dbType}: ${postgresType}`);
            }
        }
        return postgresType;
    }
    constructor(dbType){
        this.mappings = {
            sqlite: {
                mediumtext: 'text',
                timestamp: 'datetime',
                'timestamp without time zone': 'datetime',
                date: 'date',
                mediumblob: 'blob',
                enum: 'text',
                json: 'text',
                jsonb: 'text',
                integer: 'integer',
                bigint: 'integer',
                text: 'text',
                boolean: 'boolean'
            }
        };
        this.dbType = dbType;
    }
}

class OctraMigration {
    m(postgresType) {
        return this.sqlMapper.map(postgresType);
    }
    constructor(){
        this.config = Configuration.getInstance(process.env['OCB_CONFIGPATH']);
        this.sqlMapper = new SQLTypeMapper(this.config.database.dbType);
    }
}

function __decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function __metadata(metadataKey, metadataValue) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
}
typeof SuppressedError === "function" ? SuppressedError : function _SuppressedError(error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

const jsonTransformer = {
    from (value) {
        if (typeof value === 'string') {
            return JSON.parse(value);
        }
        return value;
    },
    to (value) {
        if (typeof value === 'object') {
            return JSON.stringify(value);
        }
        return value;
    }
};

const dateTransformer = {
    from (value) {
        if (typeof value === 'string') {
            if (value === '') {
                return new Date(value);
            }
            return null;
        }
        return value;
    },
    to (value) {
        if (value && typeof value === 'object') {
            return value.toISOString();
        }
        return value;
    }
};

/*
 first read and initialization of configuration is here
 */ function DbAwareColumn(columnOptions) {
    const config = Configuration.getInstance(getConfigPath());
    const dbType = config.database.dbType;
    const sqlMapper = new SQLTypeMapper(config.database.dbType);
    if (columnOptions && columnOptions.type && dbType) {
        var _columnOptions;
        if (!((_columnOptions = columnOptions) == null ? void 0 : _columnOptions.type)) {
            throw new Error(`Missing column type!`);
        }
        const newType = sqlMapper.map(columnOptions.type);
        if (!newType) {
            throw new Error(`Invalid column type: ${columnOptions.type}`);
        }
        if (newType.toString().toLowerCase().indexOf('int') > -1) {
            columnOptions = _extends({}, columnOptions);
        }
        if (dbType === 'sqlite' && (columnOptions.type === 'json' || columnOptions.type === 'jsonb')) {
            columnOptions.transformer = jsonTransformer;
        }
        columnOptions.type = newType;
    }
    return Column(columnOptions);
}
function DbAwareCreateDate() {
    const config = Configuration.getInstance(getConfigPath());
    const sqlMapper = new SQLTypeMapper(config.database.dbType);
    return applyDecorators(CreateDateColumn({
        type: sqlMapper.map('timestamp without time zone'),
        transformer: dateTransformer,
        generated: true
    }));
}
function DbAwareUpdateDate() {
    const config = Configuration.getInstance(getConfigPath());
    const sqlMapper = new SQLTypeMapper(config.database.dbType);
    return applyDecorators(UpdateDateColumn({
        type: sqlMapper.map('timestamp without time zone'),
        onUpdate: 'CURRENT_TIMESTAMP',
        transformer: dateTransformer,
        generated: true
    }));
}

function IsOptionalString(validationOptions) {
    return applyDecorators(IsOptional(validationOptions), IsString(validationOptions));
}
function IsOptionalNumber(validationOptions) {
    return applyDecorators(IsOptional(validationOptions), IsNumber());
}
function IsNumericString(validationOptions) {
    return applyDecorators(IsString(validationOptions), Matches(/[0-9]+/g, validationOptions));
}
function IsOptionalNumericString(validationOptions) {
    return applyDecorators(IsOptional(validationOptions), IsNumericString());
}
function IsOptionalEnum(entity, validationOptions) {
    return applyDecorators(IsOptional(validationOptions), IsEnum(entity, validationOptions));
}
function IsOptionalBoolean(validationOptions) {
    return applyDecorators(IsOptional(validationOptions), IsBoolean(validationOptions));
}
function IsOptionalNotEmptyString(validationOptions) {
    return applyDecorators(IsOptional(validationOptions), IsNotEmpty(validationOptions), IsString(validationOptions));
}
function IsOptionalNotEmptyNumber(validationOptions) {
    return applyDecorators(IsOptional(validationOptions), IsNotEmpty(validationOptions), IsNumber());
}
function IsOptionalNotEmptyEnum(entity, validationOptions) {
    return applyDecorators(IsOptional(validationOptions), IsNotEmpty(validationOptions), IsEnum(entity, validationOptions));
}

class StandardEntity {
}
__decorate([
    PrimaryGeneratedColumn({
        type: 'bigint'
    }),
    __metadata("design:type", String)
], StandardEntity.prototype, "id", void 0);
class StandardEntityWithTimestamps extends StandardEntity {
}
__decorate([
    DbAwareCreateDate(),
    __metadata("design:type", typeof Date === "undefined" ? Object : Date)
], StandardEntityWithTimestamps.prototype, "creationdate", void 0);
__decorate([
    DbAwareUpdateDate(),
    __metadata("design:type", typeof Date === "undefined" ? Object : Date)
], StandardEntityWithTimestamps.prototype, "updatedate", void 0);

let ToolEntity = class ToolEntity extends StandardEntityWithTimestamps {
};
__decorate([
    DbAwareColumn({
        type: 'text'
    }),
    __metadata("design:type", String)
], ToolEntity.prototype, "name", void 0);
__decorate([
    DbAwareColumn({
        type: 'text'
    }),
    __metadata("design:type", String)
], ToolEntity.prototype, "version", void 0);
__decorate([
    DbAwareColumn({
        type: 'text'
    }),
    __metadata("design:type", String)
], ToolEntity.prototype, "path", void 0);
__decorate([
    DbAwareColumn({
        type: 'boolean',
        default: 'false'
    }),
    __metadata("design:type", Boolean)
], ToolEntity.prototype, "active", void 0);
__decorate([
    DbAwareColumn({
        type: 'text'
    }),
    __metadata("design:type", String)
], ToolEntity.prototype, "hash", void 0);
ToolEntity = __decorate([
    Entity({
        name: 'tool'
    })
], ToolEntity);

let ToolConfigurationEntity = class ToolConfigurationEntity extends StandardEntity {
};
__decorate([
    DbAwareColumn({
        type: 'bigint'
    }),
    __metadata("design:type", String)
], ToolConfigurationEntity.prototype, "project_id", void 0);
__decorate([
    DbAwareColumn({
        type: 'integer'
    }),
    __metadata("design:type", String)
], ToolConfigurationEntity.prototype, "tool_id", void 0);
__decorate([
    OneToOne(()=>ToolEntity),
    JoinColumn({
        referencedColumnName: 'id',
        name: 'tool_id'
    }),
    __metadata("design:type", typeof ToolEntity === "undefined" ? Object : ToolEntity)
], ToolConfigurationEntity.prototype, "tool", void 0);
__decorate([
    OneToMany(()=>ToolConfigurationAssetEntity, (obj)=>obj.tool_configuration),
    __metadata("design:type", Array)
], ToolConfigurationEntity.prototype, "assets", void 0);
__decorate([
    DbAwareColumn({
        type: 'text'
    }),
    __metadata("design:type", String)
], ToolConfigurationEntity.prototype, "name", void 0);
__decorate([
    DbAwareColumn({
        type: 'text'
    }),
    __metadata("design:type", String)
], ToolConfigurationEntity.prototype, "task_type", void 0);
__decorate([
    DbAwareColumn({
        type: 'json'
    }),
    __metadata("design:type", String)
], ToolConfigurationEntity.prototype, "value", void 0);
__decorate([
    DbAwareColumn({
        type: 'boolean',
        nullable: true
    }),
    __metadata("design:type", Boolean)
], ToolConfigurationEntity.prototype, "standard", void 0);
ToolConfigurationEntity = __decorate([
    Entity({
        name: 'tool_configuration'
    })
], ToolConfigurationEntity);
let ToolConfigurationAssetEntity = class ToolConfigurationAssetEntity extends StandardEntity {
};
__decorate([
    DbAwareColumn({
        type: 'bigint'
    }),
    __metadata("design:type", String)
], ToolConfigurationAssetEntity.prototype, "tool_configuration_id", void 0);
__decorate([
    ManyToOne(()=>ToolConfigurationEntity),
    JoinColumn({
        referencedColumnName: 'id',
        name: 'tool_configuration_id'
    }),
    __metadata("design:type", typeof ToolConfigurationEntity === "undefined" ? Object : ToolConfigurationEntity)
], ToolConfigurationAssetEntity.prototype, "tool_configuration", void 0);
__decorate([
    DbAwareColumn({
        type: 'text'
    }),
    __metadata("design:type", String)
], ToolConfigurationAssetEntity.prototype, "name", void 0);
__decorate([
    DbAwareColumn({
        type: 'text',
        nullable: true
    }),
    __metadata("design:type", String)
], ToolConfigurationAssetEntity.prototype, "filename", void 0);
__decorate([
    DbAwareColumn({
        type: 'text'
    }),
    __metadata("design:type", String)
], ToolConfigurationAssetEntity.prototype, "mime_type", void 0);
__decorate([
    DbAwareColumn({
        type: 'text'
    }),
    __metadata("design:type", String)
], ToolConfigurationAssetEntity.prototype, "content", void 0);
ToolConfigurationAssetEntity = __decorate([
    Entity({
        name: 'tool_configuration_asset'
    })
], ToolConfigurationAssetEntity);

let TaskEntity = class TaskEntity extends StandardEntityWithTimestamps {
};
__decorate([
    DbAwareColumn({
        type: 'text'
    }),
    __metadata("design:type", String)
], TaskEntity.prototype, "pid", void 0);
__decorate([
    DbAwareColumn({
        type: 'text'
    }),
    __metadata("design:type", String)
], TaskEntity.prototype, "orgtext", void 0);
__decorate([
    DbAwareColumn({
        type: 'text'
    }),
    __metadata("design:type", String)
], TaskEntity.prototype, "assessment", void 0);
__decorate([
    DbAwareColumn({
        type: 'integer'
    }),
    __metadata("design:type", Number)
], TaskEntity.prototype, "priority", void 0);
__decorate([
    DbAwareColumn({
        type: 'text'
    }),
    __metadata("design:type", typeof TaskStatus === "undefined" ? Object : TaskStatus)
], TaskEntity.prototype, "status", void 0);
__decorate([
    DbAwareColumn({
        type: 'text'
    }),
    __metadata("design:type", String)
], TaskEntity.prototype, "code", void 0);
__decorate([
    DbAwareColumn({
        type: 'timestamp without time zone',
        transformer: dateTransformer
    }),
    __metadata("design:type", typeof Date === "undefined" ? Object : Date)
], TaskEntity.prototype, "startdate", void 0);
__decorate([
    DbAwareColumn({
        type: 'timestamp without time zone',
        transformer: dateTransformer
    }),
    __metadata("design:type", typeof Date === "undefined" ? Object : Date)
], TaskEntity.prototype, "enddate", void 0);
__decorate([
    DbAwareColumn({
        type: 'json'
    }),
    __metadata("design:type", Object)
], TaskEntity.prototype, "log", void 0);
__decorate([
    DbAwareColumn({
        type: 'text'
    }),
    __metadata("design:type", String)
], TaskEntity.prototype, "comment", void 0);
__decorate([
    DbAwareColumn({
        type: 'integer'
    }),
    __metadata("design:type", Object)
], TaskEntity.prototype, "tool_configuration_id", void 0);
__decorate([
    OneToOne(()=>ToolConfigurationEntity),
    JoinColumn({
        referencedColumnName: 'id',
        name: 'tool_configuration_id'
    }),
    __metadata("design:type", typeof ToolConfigurationEntity === "undefined" ? Object : ToolConfigurationEntity)
], TaskEntity.prototype, "tool_configuration", void 0);
__decorate([
    DbAwareColumn({
        type: 'bigint'
    }),
    __metadata("design:type", String)
], TaskEntity.prototype, "project_id", void 0);
__decorate([
    ManyToOne(()=>ProjectEntity, (entity)=>entity.tasks),
    JoinColumn({
        referencedColumnName: 'id',
        name: 'project_id'
    }),
    __metadata("design:type", typeof ProjectEntity === "undefined" ? Object : ProjectEntity)
], TaskEntity.prototype, "project", void 0);
__decorate([
    DbAwareColumn({
        type: 'text'
    }),
    __metadata("design:type", String)
], TaskEntity.prototype, "admin_comment", void 0);
__decorate([
    DbAwareColumn({
        type: 'bigint'
    }),
    Type(()=>String),
    __metadata("design:type", String)
], TaskEntity.prototype, "worker_id", void 0);
__decorate([
    ManyToOne(()=>AccountEntity),
    JoinColumn({
        referencedColumnName: 'id',
        name: 'worker_id'
    }),
    __metadata("design:type", typeof AccountEntity === "undefined" ? Object : AccountEntity)
], TaskEntity.prototype, "worker", void 0);
__decorate([
    DbAwareColumn({
        type: 'bigint'
    }),
    __metadata("design:type", String)
], TaskEntity.prototype, "use_outputs_from_task_id", void 0);
__decorate([
    OneToOne(()=>TaskEntity, ()=>TaskEntity),
    JoinColumn({
        referencedColumnName: 'id',
        name: 'use_outputs_from_task_id'
    }),
    __metadata("design:type", Object)
], TaskEntity.prototype, "use_outputs_from_task", void 0);
__decorate([
    DbAwareColumn({
        type: 'bigint'
    }),
    __metadata("design:type", Object)
], TaskEntity.prototype, "nexttask_id", void 0);
__decorate([
    OneToOne(()=>TaskEntity, ()=>TaskEntity),
    JoinColumn({
        referencedColumnName: 'id',
        name: 'nexttask_id'
    }),
    __metadata("design:type", Object)
], TaskEntity.prototype, "nexttask", void 0);
__decorate([
    OneToMany(()=>TaskInputOutputEntity, (entity)=>entity.task, {
        onDelete: 'CASCADE'
    }),
    JoinColumn({
        name: 'id',
        referencedColumnName: 'task_id'
    }),
    __metadata("design:type", Array)
], TaskEntity.prototype, "inputsOutputs", void 0);
TaskEntity = __decorate([
    Entity({
        name: 'task'
    })
], TaskEntity);
let TaskInputOutputEntity = class TaskInputOutputEntity extends StandardEntity {
};
__decorate([
    DbAwareColumn({
        type: 'bigint'
    }),
    __metadata("design:type", String)
], TaskInputOutputEntity.prototype, "task_id", void 0);
__decorate([
    ManyToOne(()=>TaskEntity),
    JoinColumn({
        name: 'task_id',
        referencedColumnName: 'id'
    }),
    __metadata("design:type", typeof TaskEntity === "undefined" ? Object : TaskEntity)
], TaskInputOutputEntity.prototype, "task", void 0);
__decorate([
    DbAwareColumn({
        type: 'bigint',
        nullable: true
    }),
    __metadata("design:type", String)
], TaskInputOutputEntity.prototype, "file_project_id", void 0);
__decorate([
    ManyToOne(()=>FileProjectEntity),
    JoinColumn({
        name: 'file_project_id',
        referencedColumnName: 'id'
    }),
    __metadata("design:type", typeof FileProjectEntity === "undefined" ? Object : FileProjectEntity)
], TaskInputOutputEntity.prototype, "file_project", void 0);
__decorate([
    DbAwareColumn({
        type: 'enum',
        enum: [
            'input',
            'output'
        ],
        nullable: false
    }),
    __metadata("design:type", String)
], TaskInputOutputEntity.prototype, "type", void 0);
__decorate([
    DbAwareColumn({
        type: 'text',
        nullable: false
    }),
    __metadata("design:type", typeof TaskInputOutputCreatorType === "undefined" ? Object : TaskInputOutputCreatorType)
], TaskInputOutputEntity.prototype, "creator_type", void 0);
__decorate([
    DbAwareColumn({
        type: 'text',
        nullable: true
    }),
    __metadata("design:type", String)
], TaskInputOutputEntity.prototype, "label", void 0);
__decorate([
    DbAwareColumn({
        type: 'text',
        nullable: true
    }),
    __metadata("design:type", String)
], TaskInputOutputEntity.prototype, "description", void 0);
TaskInputOutputEntity = __decorate([
    Entity({
        name: 'task_input_output'
    })
], TaskInputOutputEntity);

let ProjectEntity = class ProjectEntity extends StandardEntityWithTimestamps {
};
__decorate([
    DbAwareColumn({
        type: 'text',
        nullable: false
    }),
    __metadata("design:type", String)
], ProjectEntity.prototype, "name", void 0);
__decorate([
    DbAwareColumn({
        type: 'text'
    }),
    __metadata("design:type", String)
], ProjectEntity.prototype, "shortname", void 0);
__decorate([
    DbAwareColumn({
        type: 'text'
    }),
    __metadata("design:type", String)
], ProjectEntity.prototype, "visibility", void 0);
__decorate([
    DbAwareColumn({
        type: 'text'
    }),
    __metadata("design:type", String)
], ProjectEntity.prototype, "description", void 0);
__decorate([
    DbAwareColumn({
        type: 'timestamp without time zone',
        transformer: dateTransformer
    }),
    __metadata("design:type", typeof Date === "undefined" ? Object : Date)
], ProjectEntity.prototype, "startdate", void 0);
__decorate([
    DbAwareColumn({
        type: 'timestamp without time zone',
        transformer: dateTransformer
    }),
    __metadata("design:type", typeof Date === "undefined" ? Object : Date)
], ProjectEntity.prototype, "enddate", void 0);
__decorate([
    DbAwareColumn({
        type: 'boolean',
        default: true
    }),
    __metadata("design:type", Boolean)
], ProjectEntity.prototype, "active", void 0);
__decorate([
    OneToMany(()=>AccountRoleProjectEntity, (accountRole)=>accountRole.project),
    JoinColumn({
        name: 'id',
        referencedColumnName: 'project_id'
    }),
    __metadata("design:type", Array)
], ProjectEntity.prototype, "roles", void 0);
__decorate([
    OneToMany(()=>TaskEntity, (taskEntity)=>taskEntity.project),
    JoinColumn({
        name: 'id',
        referencedColumnName: 'project_id'
    }),
    __metadata("design:type", Array)
], ProjectEntity.prototype, "tasks", void 0);
ProjectEntity = __decorate([
    Entity({
        name: 'project'
    })
], ProjectEntity);
let FileProjectFolderEntity = class FileProjectFolderEntity extends StandardEntity {
};
__decorate([
    DbAwareColumn({
        type: 'bigint'
    }),
    __metadata("design:type", String)
], FileProjectFolderEntity.prototype, "project_id", void 0);
__decorate([
    ManyToOne(()=>ProjectEntity),
    JoinColumn({
        name: 'project_id',
        referencedColumnName: 'id'
    }),
    __metadata("design:type", typeof ProjectEntity === "undefined" ? Object : ProjectEntity)
], FileProjectFolderEntity.prototype, "project", void 0);
__decorate([
    DbAwareColumn({
        type: 'text',
        nullable: true
    }),
    __metadata("design:type", String)
], FileProjectFolderEntity.prototype, "path", void 0);
__decorate([
    DbAwareColumn({
        type: 'text',
        nullable: true
    }),
    __metadata("design:type", String)
], FileProjectFolderEntity.prototype, "encrypted_path", void 0);
FileProjectFolderEntity = __decorate([
    Entity({
        name: 'file_project_folder'
    })
], FileProjectFolderEntity);
let FileProjectEntity = class FileProjectEntity extends StandardEntityWithTimestamps {
};
__decorate([
    DbAwareColumn({
        type: 'bigint'
    }),
    __metadata("design:type", String)
], FileProjectEntity.prototype, "project_id", void 0);
__decorate([
    ManyToOne(()=>ProjectEntity),
    JoinColumn({
        name: 'project_id',
        referencedColumnName: 'id'
    }),
    __metadata("design:type", typeof ProjectEntity === "undefined" ? Object : ProjectEntity)
], FileProjectEntity.prototype, "project", void 0);
__decorate([
    DbAwareColumn({
        type: 'bigint'
    }),
    __metadata("design:type", String)
], FileProjectEntity.prototype, "file_project_folder_id", void 0);
__decorate([
    ManyToOne(()=>FileProjectFolderEntity),
    JoinColumn({
        name: 'file_project_folder_id',
        referencedColumnName: 'id'
    }),
    __metadata("design:type", typeof FileProjectFolderEntity === "undefined" ? Object : FileProjectFolderEntity)
], FileProjectEntity.prototype, "file_project_folder", void 0);
__decorate([
    DbAwareColumn({
        type: 'text',
        nullable: true
    }),
    __metadata("design:type", Object)
], FileProjectEntity.prototype, "url", void 0);
__decorate([
    DbAwareColumn({
        type: 'text',
        nullable: true
    }),
    __metadata("design:type", String)
], FileProjectEntity.prototype, "type", void 0);
__decorate([
    DbAwareColumn({
        type: 'bigint',
        nullable: true
    }),
    __metadata("design:type", Number)
], FileProjectEntity.prototype, "size", void 0);
__decorate([
    DbAwareColumn({
        type: 'bigint',
        nullable: true
    }),
    __metadata("design:type", String)
], FileProjectEntity.prototype, "uploader_id", void 0);
__decorate([
    ManyToOne(()=>AccountEntity),
    JoinColumn({
        name: 'uploader_id',
        referencedColumnName: 'id'
    }),
    __metadata("design:type", typeof AccountEntity === "undefined" ? Object : AccountEntity)
], FileProjectEntity.prototype, "uploader", void 0);
__decorate([
    DbAwareColumn({
        type: 'text',
        nullable: true
    }),
    __metadata("design:type", String)
], FileProjectEntity.prototype, "real_name", void 0);
__decorate([
    DbAwareColumn({
        type: 'text',
        nullable: true
    }),
    __metadata("design:type", String)
], FileProjectEntity.prototype, "name", void 0);
__decorate([
    DbAwareColumn({
        type: 'text',
        nullable: true
    }),
    __metadata("design:type", String)
], FileProjectEntity.prototype, "content_type", void 0);
__decorate([
    DbAwareColumn({
        type: 'text',
        nullable: true
    }),
    __metadata("design:type", String)
], FileProjectEntity.prototype, "content", void 0);
__decorate([
    DbAwareColumn({
        type: 'text',
        nullable: true,
        unique: true
    }),
    __metadata("design:type", String)
], FileProjectEntity.prototype, "hash", void 0);
__decorate([
    DbAwareColumn({
        type: 'jsonb',
        nullable: true
    }),
    __metadata("design:type", typeof AudioFileMetaData === "undefined" ? Object : AudioFileMetaData)
], FileProjectEntity.prototype, "metadata", void 0);
FileProjectEntity = __decorate([
    Entity({
        name: 'file_project'
    })
], FileProjectEntity);

let RoleEntity = class RoleEntity extends StandardEntityWithTimestamps {
};
__decorate([
    DbAwareColumn({
        type: 'text',
        unique: true
    }),
    __metadata("design:type", String)
], RoleEntity.prototype, "label", void 0);
__decorate([
    DbAwareColumn({
        type: 'text'
    }),
    __metadata("design:type", String)
], RoleEntity.prototype, "description", void 0);
__decorate([
    DbAwareColumn({
        type: 'text',
        nullable: false
    }),
    __metadata("design:type", typeof AccountRoleScope === "undefined" ? Object : AccountRoleScope)
], RoleEntity.prototype, "scope", void 0);
__decorate([
    DbAwareColumn({
        type: 'boolean',
        nullable: false,
        default: false
    }),
    __metadata("design:type", Boolean)
], RoleEntity.prototype, "readonly", void 0);
__decorate([
    DbAwareColumn({
        type: 'json',
        nullable: false
    }),
    __metadata("design:type", typeof Record === "undefined" ? Object : Record)
], RoleEntity.prototype, "i18n", void 0);
__decorate([
    DbAwareColumn({
        type: 'json',
        nullable: false
    }),
    __metadata("design:type", typeof RoleBadgeSettings === "undefined" ? Object : RoleBadgeSettings)
], RoleEntity.prototype, "badge", void 0);
RoleEntity = __decorate([
    Entity('role')
], RoleEntity);
let AccountRoleProjectEntity = class AccountRoleProjectEntity extends StandardEntityWithTimestamps {
    constructor(partial){
        super();
        Object.assign(this, partial);
    }
};
__decorate([
    DbAwareColumn({
        type: 'bigint'
    }),
    __metadata("design:type", String)
], AccountRoleProjectEntity.prototype, "account_id", void 0);
__decorate([
    DbAwareColumn({
        type: 'bigint'
    }),
    __metadata("design:type", String)
], AccountRoleProjectEntity.prototype, "role_id", void 0);
__decorate([
    OneToOne(()=>RoleEntity, {
        eager: true
    }),
    JoinColumn({
        name: 'role_id',
        referencedColumnName: 'id'
    }),
    __metadata("design:type", typeof RoleEntity === "undefined" ? Object : RoleEntity)
], AccountRoleProjectEntity.prototype, "role", void 0);
__decorate([
    DbAwareColumn({
        type: 'bigint'
    }),
    __metadata("design:type", String)
], AccountRoleProjectEntity.prototype, "project_id", void 0);
__decorate([
    ManyToOne(()=>ProjectEntity),
    JoinColumn({
        name: 'project_id',
        referencedColumnName: 'id'
    }),
    __metadata("design:type", typeof ProjectEntity === "undefined" ? Object : ProjectEntity)
], AccountRoleProjectEntity.prototype, "project", void 0);
__decorate([
    DbAwareColumn({
        type: 'timestamp without time zone',
        transformer: dateTransformer,
        nullable: true
    }),
    __metadata("design:type", Object)
], AccountRoleProjectEntity.prototype, "valid_startdate", void 0);
__decorate([
    DbAwareColumn({
        type: 'timestamp without time zone',
        transformer: dateTransformer,
        nullable: true
    }),
    __metadata("design:type", Object)
], AccountRoleProjectEntity.prototype, "valid_enddate", void 0);
__decorate([
    ManyToOne(()=>AccountEntity),
    JoinColumn({
        name: 'account_id',
        referencedColumnName: 'id'
    }),
    __metadata("design:type", typeof AccountEntity === "undefined" ? Object : AccountEntity)
], AccountRoleProjectEntity.prototype, "account", void 0);
AccountRoleProjectEntity = __decorate([
    Entity({
        name: 'account_role_project'
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [
        typeof Partial === "undefined" ? Object : Partial
    ])
], AccountRoleProjectEntity);

let AccountInfoEntity = class AccountInfoEntity extends StandardEntity {
};
__decorate([
    DbAwareColumn({
        type: 'text'
    }),
    __metadata("design:type", String)
], AccountInfoEntity.prototype, "username", void 0);
__decorate([
    DbAwareColumn({
        type: 'text'
    }),
    __metadata("design:type", String)
], AccountInfoEntity.prototype, "loginmethod", void 0);
__decorate([
    DbAwareColumn({
        type: 'boolean',
        default: true
    }),
    __metadata("design:type", Boolean)
], AccountInfoEntity.prototype, "active", void 0);
__decorate([
    DbAwareColumn({
        type: 'text'
    }),
    __metadata("design:type", String)
], AccountInfoEntity.prototype, "hash", void 0);
__decorate([
    DbAwareColumn({
        type: 'text',
        nullable: true
    }),
    __metadata("design:type", String)
], AccountInfoEntity.prototype, "email", void 0);
__decorate([
    DbAwareColumn({
        type: 'text',
        nullable: true
    }),
    __metadata("design:type", typeof AccountPersonGender === "undefined" ? Object : AccountPersonGender)
], AccountInfoEntity.prototype, "gender", void 0);
__decorate([
    DbAwareColumn({
        type: 'text',
        nullable: true
    }),
    __metadata("design:type", String)
], AccountInfoEntity.prototype, "first_name", void 0);
__decorate([
    DbAwareColumn({
        type: 'text',
        nullable: true
    }),
    __metadata("design:type", String)
], AccountInfoEntity.prototype, "last_name", void 0);
__decorate([
    DbAwareColumn({
        type: 'text',
        nullable: true
    }),
    __metadata("design:type", String)
], AccountInfoEntity.prototype, "organization", void 0);
__decorate([
    DbAwareColumn({
        type: 'text',
        nullable: true
    }),
    __metadata("design:type", String)
], AccountInfoEntity.prototype, "birthday", void 0);
__decorate([
    DbAwareColumn({
        type: 'text',
        nullable: true
    }),
    __metadata("design:type", String)
], AccountInfoEntity.prototype, "locale", void 0);
__decorate([
    DbAwareColumn({
        type: 'text',
        nullable: true
    }),
    __metadata("design:type", String)
], AccountInfoEntity.prototype, "timezone", void 0);
__decorate([
    DbAwareColumn({
        type: 'text',
        nullable: true
    }),
    __metadata("design:type", String)
], AccountInfoEntity.prototype, "address", void 0);
__decorate([
    DbAwareColumn({
        type: 'text',
        nullable: true
    }),
    __metadata("design:type", String)
], AccountInfoEntity.prototype, "address_details", void 0);
__decorate([
    DbAwareColumn({
        type: 'text',
        nullable: true
    }),
    __metadata("design:type", String)
], AccountInfoEntity.prototype, "town", void 0);
__decorate([
    DbAwareColumn({
        type: 'text',
        nullable: true
    }),
    __metadata("design:type", String)
], AccountInfoEntity.prototype, "postcode", void 0);
__decorate([
    DbAwareColumn({
        type: 'text',
        nullable: true
    }),
    __metadata("design:type", String)
], AccountInfoEntity.prototype, "state", void 0);
__decorate([
    DbAwareColumn({
        type: 'text',
        nullable: true
    }),
    __metadata("design:type", String)
], AccountInfoEntity.prototype, "country", void 0);
__decorate([
    DbAwareColumn({
        type: 'text',
        nullable: true
    }),
    __metadata("design:type", String)
], AccountInfoEntity.prototype, "phone", void 0);
__decorate([
    DbAwareColumn({
        type: 'boolean',
        nullable: true
    }),
    __metadata("design:type", Boolean)
], AccountInfoEntity.prototype, "email_verified", void 0);
AccountInfoEntity = __decorate([
    Entity({
        name: 'account_info'
    })
], AccountInfoEntity);
let AccountEntity = class AccountEntity extends StandardEntityWithTimestamps {
};
__decorate([
    DbAwareColumn(),
    __metadata("design:type", String)
], AccountEntity.prototype, "comment", void 0);
__decorate([
    DbAwareColumn({
        type: 'bigint'
    }),
    __metadata("design:type", String)
], AccountEntity.prototype, "role_id", void 0);
__decorate([
    OneToOne(()=>RoleEntity, {
        eager: true
    }),
    JoinColumn({
        name: 'role_id',
        referencedColumnName: 'id'
    }),
    __metadata("design:type", typeof RoleEntity === "undefined" ? Object : RoleEntity)
], AccountEntity.prototype, "systemRole", void 0);
__decorate([
    OneToMany(()=>AccountRoleProjectEntity, (accountRoleProject)=>accountRoleProject.account, {
        eager: true
    }),
    JoinColumn({
        referencedColumnName: 'account_id'
    }),
    __metadata("design:type", Array)
], AccountEntity.prototype, "roles", void 0);
__decorate([
    DbAwareColumn({
        type: 'timestamp without time zone',
        transformer: dateTransformer,
        nullable: true
    }),
    __metadata("design:type", typeof Date === "undefined" ? Object : Date)
], AccountEntity.prototype, "last_login", void 0);
__decorate([
    DbAwareColumn({
        type: 'bigint'
    }),
    __metadata("design:type", String)
], AccountEntity.prototype, "account_info_id", void 0);
__decorate([
    OneToOne(()=>AccountInfoEntity, {
        eager: true
    }),
    JoinColumn({
        name: 'account_info_id',
        referencedColumnName: 'id'
    }),
    __metadata("design:type", typeof AccountInfoEntity === "undefined" ? Object : AccountInfoEntity)
], AccountEntity.prototype, "account_info", void 0);
AccountEntity = __decorate([
    Entity({
        name: 'account'
    })
], AccountEntity);

let AppTokenEntity = class AppTokenEntity extends StandardEntityWithTimestamps {
    constructor(partial){
        super();
        Object.assign(this, partial);
    }
};
__decorate([
    DbAwareColumn({
        type: 'text'
    }),
    __metadata("design:type", String)
], AppTokenEntity.prototype, "name", void 0);
__decorate([
    DbAwareColumn({
        type: 'text',
        unique: true
    }),
    __metadata("design:type", String)
], AppTokenEntity.prototype, "key", void 0);
__decorate([
    DbAwareColumn({
        type: 'text',
        nullable: true
    }),
    __metadata("design:type", String)
], AppTokenEntity.prototype, "domain", void 0);
__decorate([
    DbAwareColumn({
        type: 'text',
        nullable: true
    }),
    __metadata("design:type", String)
], AppTokenEntity.prototype, "description", void 0);
__decorate([
    DbAwareColumn({
        type: 'boolean',
        default: false
    }),
    __metadata("design:type", Boolean)
], AppTokenEntity.prototype, "registrations", void 0);
__decorate([
    DbAwareColumn({
        type: 'boolean',
        default: false
    }),
    __metadata("design:type", Boolean)
], AppTokenEntity.prototype, "readonly", void 0);
AppTokenEntity = __decorate([
    Entity({
        name: 'apptoken'
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [
        typeof Partial === "undefined" ? Object : Partial
    ])
], AppTokenEntity);

let OptionEntity = class OptionEntity extends StandardEntity {
};
__decorate([
    DbAwareColumn({
        type: 'text',
        primary: true,
        unique: true
    }),
    __metadata("design:type", String)
], OptionEntity.prototype, "name", void 0);
__decorate([
    DbAwareColumn({
        type: 'text',
        nullable: true
    }),
    __metadata("design:type", String)
], OptionEntity.prototype, "value", void 0);
OptionEntity = __decorate([
    Entity({
        name: 'option'
    })
], OptionEntity);

let PolicyEntity = class PolicyEntity {
};
__decorate([
    PrimaryGeneratedColumn({
        type: 'integer'
    }),
    __metadata("design:type", Number)
], PolicyEntity.prototype, "id", void 0);
__decorate([
    DbAwareColumn({
        type: 'text'
    }),
    __metadata("design:type", typeof PolicyType === "undefined" ? Object : PolicyType)
], PolicyEntity.prototype, "type", void 0);
__decorate([
    DbAwareColumn({
        type: 'integer'
    }),
    __metadata("design:type", Number)
], PolicyEntity.prototype, "version", void 0);
__decorate([
    OneToMany(()=>PolicyTranslationEntity, (translation)=>translation.policy, {
        eager: true
    }),
    __metadata("design:type", Array)
], PolicyEntity.prototype, "translations", void 0);
__decorate([
    DbAwareColumn({
        type: 'timestamp without time zone',
        nullable: true
    }),
    __metadata("design:type", typeof Date === "undefined" ? Object : Date)
], PolicyEntity.prototype, "publishdate", void 0);
__decorate([
    DbAwareCreateDate(),
    __metadata("design:type", typeof Date === "undefined" ? Object : Date)
], PolicyEntity.prototype, "creationdate", void 0);
PolicyEntity = __decorate([
    Entity({
        name: 'policy'
    })
], PolicyEntity);
let PolicyTranslationEntity = class PolicyTranslationEntity {
};
__decorate([
    PrimaryGeneratedColumn({
        type: 'integer'
    }),
    __metadata("design:type", Number)
], PolicyTranslationEntity.prototype, "id", void 0);
__decorate([
    DbAwareColumn({
        type: 'integer'
    }),
    __metadata("design:type", Number)
], PolicyTranslationEntity.prototype, "policy_id", void 0);
__decorate([
    DbAwareColumn({
        type: 'text'
    }),
    __metadata("design:type", String)
], PolicyTranslationEntity.prototype, "locale", void 0);
__decorate([
    ManyToOne(()=>PolicyEntity),
    JoinColumn({
        name: 'policy_id',
        referencedColumnName: 'id'
    }),
    __metadata("design:type", typeof PolicyEntity === "undefined" ? Object : PolicyEntity)
], PolicyTranslationEntity.prototype, "policy", void 0);
__decorate([
    OneToMany(()=>PolicyAccountConsentEntity, (translation)=>translation.policy_translation),
    __metadata("design:type", Array)
], PolicyTranslationEntity.prototype, "consents", void 0);
__decorate([
    DbAwareColumn({
        type: 'text',
        nullable: true
    }),
    __metadata("design:type", String)
], PolicyTranslationEntity.prototype, "url", void 0);
__decorate([
    DbAwareColumn({
        type: 'text',
        nullable: true
    }),
    __metadata("design:type", String)
], PolicyTranslationEntity.prototype, "text", void 0);
__decorate([
    DbAwareColumn({
        type: 'bigint'
    }),
    __metadata("design:type", String)
], PolicyTranslationEntity.prototype, "author_id", void 0);
__decorate([
    ManyToOne(()=>AccountEntity$1, {
        eager: true
    }),
    JoinColumn({
        name: 'author_id',
        referencedColumnName: 'id'
    }),
    __metadata("design:type", typeof AccountEntity$1 === "undefined" ? Object : AccountEntity$1)
], PolicyTranslationEntity.prototype, "author", void 0);
__decorate([
    DbAwareCreateDate(),
    __metadata("design:type", typeof Date === "undefined" ? Object : Date)
], PolicyTranslationEntity.prototype, "creationdate", void 0);
__decorate([
    DbAwareUpdateDate(),
    __metadata("design:type", typeof Date === "undefined" ? Object : Date)
], PolicyTranslationEntity.prototype, "updatedate", void 0);
PolicyTranslationEntity = __decorate([
    Entity({
        name: 'policy_translation'
    })
], PolicyTranslationEntity);
let PolicyAccountConsentEntity = class PolicyAccountConsentEntity {
};
__decorate([
    PrimaryGeneratedColumn({
        type: 'bigint'
    }),
    __metadata("design:type", Number)
], PolicyAccountConsentEntity.prototype, "id", void 0);
__decorate([
    DbAwareColumn({
        type: 'integer'
    }),
    __metadata("design:type", Number)
], PolicyAccountConsentEntity.prototype, "policy_translation_id", void 0);
__decorate([
    OneToOne(()=>PolicyTranslationEntity),
    JoinColumn({
        name: 'policy_translation_id',
        referencedColumnName: 'id'
    }),
    __metadata("design:type", typeof PolicyTranslationEntity === "undefined" ? Object : PolicyTranslationEntity)
], PolicyAccountConsentEntity.prototype, "policy_translation", void 0);
__decorate([
    DbAwareColumn({
        type: 'bigint'
    }),
    __metadata("design:type", String)
], PolicyAccountConsentEntity.prototype, "account_id", void 0);
__decorate([
    ManyToOne(()=>AccountEntity$1),
    JoinColumn({
        name: 'account_id',
        referencedColumnName: 'id'
    }),
    __metadata("design:type", typeof AccountEntity$1 === "undefined" ? Object : AccountEntity$1)
], PolicyAccountConsentEntity.prototype, "account", void 0);
__decorate([
    DbAwareColumn({
        type: 'timestamp without time zone'
    }),
    __metadata("design:type", typeof Date === "undefined" ? Object : Date)
], PolicyAccountConsentEntity.prototype, "consentdate", void 0);
PolicyAccountConsentEntity = __decorate([
    Entity({
        name: 'policy_account_consent'
    })
], PolicyAccountConsentEntity);

let AccountFieldDefinitionEntity = class AccountFieldDefinitionEntity extends StandardEntity {
};
__decorate([
    DbAwareColumn({
        type: 'text'
    }),
    __metadata("design:type", typeof AccountFieldContext === "undefined" ? Object : AccountFieldContext)
], AccountFieldDefinitionEntity.prototype, "context", void 0);
__decorate([
    DbAwareColumn({
        type: 'text',
        unique: true
    }),
    __metadata("design:type", String)
], AccountFieldDefinitionEntity.prototype, "name", void 0);
__decorate([
    DbAwareColumn({
        type: 'text'
    }),
    __metadata("design:type", typeof AccountFieldDefinition2 === "undefined" ? Object : AccountFieldDefinition2)
], AccountFieldDefinitionEntity.prototype, "type", void 0);
__decorate([
    DbAwareColumn({
        type: 'jsonb'
    }),
    __metadata("design:type", typeof AccountFieldDefinition2 === "undefined" ? Object : AccountFieldDefinition2)
], AccountFieldDefinitionEntity.prototype, "definition", void 0);
__decorate([
    DbAwareColumn({
        type: 'boolean',
        default: false
    }),
    __metadata("design:type", Boolean)
], AccountFieldDefinitionEntity.prototype, "remove_value_on_account_delete", void 0);
__decorate([
    DbAwareColumn({
        type: 'boolean',
        default: false
    }),
    __metadata("design:type", Boolean)
], AccountFieldDefinitionEntity.prototype, "removable", void 0);
__decorate([
    DbAwareColumn({
        type: 'boolean',
        default: true
    }),
    __metadata("design:type", Boolean)
], AccountFieldDefinitionEntity.prototype, "active", void 0);
__decorate([
    DbAwareColumn({
        type: 'integer',
        default: -1
    }),
    __metadata("design:type", Number)
], AccountFieldDefinitionEntity.prototype, "sort_order", void 0);
AccountFieldDefinitionEntity = __decorate([
    Entity({
        name: 'account_field_definition'
    })
], AccountFieldDefinitionEntity);
let AccountFieldValueEntity = class AccountFieldValueEntity extends StandardEntity {
};
__decorate([
    DbAwareColumn({
        type: 'bigint'
    }),
    __metadata("design:type", String)
], AccountFieldValueEntity.prototype, "account_field_definition_id", void 0);
__decorate([
    OneToOne(()=>AccountFieldDefinitionEntity),
    __metadata("design:type", typeof AccountFieldDefinitionEntity === "undefined" ? Object : AccountFieldDefinitionEntity)
], AccountFieldValueEntity.prototype, "account_field_definition", void 0);
__decorate([
    DbAwareColumn({
        type: 'bigint'
    }),
    __metadata("design:type", String)
], AccountFieldValueEntity.prototype, "account_id", void 0);
__decorate([
    OneToOne(()=>AccountEntity$1),
    __metadata("design:type", typeof AccountEntity$1 === "undefined" ? Object : AccountEntity$1)
], AccountFieldValueEntity.prototype, "account", void 0);
__decorate([
    DbAwareColumn({
        type: 'bigint'
    }),
    __metadata("design:type", String)
], AccountFieldValueEntity.prototype, "project_id", void 0);
__decorate([
    OneToOne(()=>ProjectEntity$1),
    __metadata("design:type", typeof ProjectEntity$1 === "undefined" ? Object : ProjectEntity$1)
], AccountFieldValueEntity.prototype, "project", void 0);
__decorate([
    DbAwareColumn({
        type: 'json'
    }),
    __metadata("design:type", Object)
], AccountFieldValueEntity.prototype, "value", void 0);
AccountFieldValueEntity = __decorate([
    Entity({
        name: 'account_field_value'
    })
], AccountFieldValueEntity);

let EmailTemplateEntity = class EmailTemplateEntity extends StandardEntity {
};
__decorate([
    DbAwareColumn({
        type: 'text',
        nullable: false
    }),
    __metadata("design:type", String)
], EmailTemplateEntity.prototype, "type", void 0);
__decorate([
    DbAwareColumn({
        type: 'text'
    }),
    __metadata("design:type", String)
], EmailTemplateEntity.prototype, "name", void 0);
__decorate([
    OneToMany(()=>EmailTemplateTranslationEntity, (obj)=>obj.template),
    __metadata("design:type", Array)
], EmailTemplateEntity.prototype, "translations", void 0);
EmailTemplateEntity = __decorate([
    Entity({
        name: 'email_template'
    })
], EmailTemplateEntity);
let EmailEntity = class EmailEntity extends StandardEntityWithTimestamps {
};
__decorate([
    DbAwareColumn({
        type: 'bigint'
    }),
    __metadata("design:type", String)
], EmailEntity.prototype, "template_id", void 0);
__decorate([
    ManyToOne(()=>EmailTemplateEntity),
    JoinColumn({
        referencedColumnName: 'id',
        name: 'template_id'
    }),
    __metadata("design:type", typeof EmailTemplateEntity === "undefined" ? Object : EmailTemplateEntity)
], EmailEntity.prototype, "template", void 0);
__decorate([
    DbAwareColumn({
        type: 'bigint'
    }),
    __metadata("design:type", String)
], EmailEntity.prototype, "recipient_id", void 0);
__decorate([
    ManyToOne(()=>AccountEntity),
    JoinColumn({
        name: 'recipient_id',
        referencedColumnName: 'id'
    }),
    __metadata("design:type", typeof AccountEntity === "undefined" ? Object : AccountEntity)
], EmailEntity.prototype, "recipient", void 0);
__decorate([
    DbAwareColumn({
        type: 'jsonb'
    }),
    __metadata("design:type", Object)
], EmailEntity.prototype, "context", void 0);
__decorate([
    DbAwareColumn({
        type: 'text'
    }),
    __metadata("design:type", String)
], EmailEntity.prototype, "error", void 0);
__decorate([
    DbAwareColumn({
        type: 'integer'
    }),
    __metadata("design:type", Number)
], EmailEntity.prototype, "priority", void 0);
EmailEntity = __decorate([
    Entity({
        name: 'email'
    })
], EmailEntity);
let EmailTemplateTranslationEntity = class EmailTemplateTranslationEntity extends StandardEntityWithTimestamps {
};
__decorate([
    DbAwareColumn({
        type: 'bigint'
    }),
    __metadata("design:type", String)
], EmailTemplateTranslationEntity.prototype, "template_id", void 0);
__decorate([
    ManyToOne(()=>EmailTemplateEntity),
    JoinColumn({
        referencedColumnName: 'id',
        name: 'template_id'
    }),
    __metadata("design:type", typeof EmailTemplateEntity === "undefined" ? Object : EmailTemplateEntity)
], EmailTemplateTranslationEntity.prototype, "template", void 0);
__decorate([
    DbAwareColumn({
        type: 'text'
    }),
    __metadata("design:type", String)
], EmailTemplateTranslationEntity.prototype, "subject", void 0);
__decorate([
    DbAwareColumn({
        type: 'text'
    }),
    __metadata("design:type", String)
], EmailTemplateTranslationEntity.prototype, "html", void 0);
__decorate([
    DbAwareColumn({
        type: 'text'
    }),
    __metadata("design:type", String)
], EmailTemplateTranslationEntity.prototype, "plain", void 0);
__decorate([
    DbAwareColumn({
        type: 'text',
        nullable: false
    }),
    __metadata("design:type", String)
], EmailTemplateTranslationEntity.prototype, "locale", void 0);
EmailTemplateTranslationEntity = __decorate([
    Entity({
        name: 'email_template_translation'
    })
], EmailTemplateTranslationEntity);

var index = /*#__PURE__*/Object.freeze({
  __proto__: null,
  get AccountInfoEntity () { return AccountInfoEntity; },
  get AccountEntity () { return AccountEntity; },
  get RoleEntity () { return RoleEntity; },
  get AccountRoleProjectEntity () { return AccountRoleProjectEntity; },
  get AppTokenEntity () { return AppTokenEntity; },
  get ProjectEntity () { return ProjectEntity; },
  get FileProjectFolderEntity () { return FileProjectFolderEntity; },
  get FileProjectEntity () { return FileProjectEntity; },
  get TaskEntity () { return TaskEntity; },
  get TaskInputOutputEntity () { return TaskInputOutputEntity; },
  get ToolConfigurationEntity () { return ToolConfigurationEntity; },
  get ToolConfigurationAssetEntity () { return ToolConfigurationAssetEntity; },
  get ToolEntity () { return ToolEntity; },
  get OptionEntity () { return OptionEntity; },
  get PolicyEntity () { return PolicyEntity; },
  get PolicyTranslationEntity () { return PolicyTranslationEntity; },
  get PolicyAccountConsentEntity () { return PolicyAccountConsentEntity; },
  get AccountFieldDefinitionEntity () { return AccountFieldDefinitionEntity; },
  get AccountFieldValueEntity () { return AccountFieldValueEntity; },
  get EmailTemplateEntity () { return EmailTemplateEntity; },
  get EmailEntity () { return EmailEntity; },
  get EmailTemplateTranslationEntity () { return EmailTemplateTranslationEntity; }
});

function getBetterSQLitePath() {
    const nodeModulesPath = join(/(.*octra-backend)/g.exec(process.argv[1])[1], 'node_modules');
    return join(nodeModulesPath, `better-sqlite3-multiple-ciphers/build/Release/better_sqlite3-${os.platform()}-${os.arch()}.node`);
}
function getOrmConfig(config, loggerFunction) {
    let OrmDatabaseConfig = {
        type: config.database.dbType === 'sqlite' ? 'better-sqlite3' : config.database.dbType,
        host: config.database.dbHost,
        port: config.database.dbPort,
        username: config.database.dbUser,
        password: config.database.dbPassword,
        database: config.database.dbName,
        logging: [
            'error'
        ],
        synchronize: false,
        nativeBinding: config.database.dbType === 'sqlite' ? getBetterSQLitePath() : undefined
    };
    if (config.database.ssl) {
        OrmDatabaseConfig = removeNullAttributes(_extends({}, OrmDatabaseConfig, {
            ssl: {
                rejectUnauthorized: config.database.ssl.rejectUnauthorized,
                ca: config.database.ssl.ca ? fs$1.readFileSync(config.database.ssl.ca).toString() : undefined,
                key: config.database.ssl.key ? fs$1.readFileSync(config.database.ssl.key).toString() : undefined,
                cert: config.database.ssl.cert ? fs$1.readFileSync(config.database.ssl.cert).toString() : undefined
            }
        }));
    }
    if (config.database.dbType === 'sqlite') {
        OrmDatabaseConfig = _extends({}, OrmDatabaseConfig, {
            driver: require('better-sqlite3-multiple-ciphers'),
            nativeBinding: getBetterSQLitePath(),
            key: config.database.dbPassword
        });
    }
    OrmDatabaseConfig = _extends({}, OrmDatabaseConfig, {
        namingStrategy: new DbNamingStrategy()
    });
    return OrmDatabaseConfig;
}

class TranscriptDto {
    constructor(partial){
        Object.assign(this, partial);
    }
}
__decorate([
    IsOptionalString(),
    __metadata("design:type", String)
], TranscriptDto.prototype, "name", void 0);
__decorate([
    IsOptionalString(),
    __metadata("design:type", String)
], TranscriptDto.prototype, "annotates", void 0);
__decorate([
    IsOptionalNumber(),
    __metadata("design:type", Number)
], TranscriptDto.prototype, "sampleRate", void 0);
__decorate([
    IsArray(),
    ValidateNested({
        each: true
    }),
    Type(()=>Level),
    __metadata("design:type", Array)
], TranscriptDto.prototype, "levels", void 0);
__decorate([
    IsOptional(),
    IsArray(),
    __metadata("design:type", Array)
], TranscriptDto.prototype, "links", void 0);
var AnnotJSONType;
(function(AnnotJSONType) {
    AnnotJSONType['ITEM'] = 'ITEM';
    AnnotJSONType['EVENT'] = 'EVENT';
    AnnotJSONType['SEGMENT'] = 'SEGMENT';
})(AnnotJSONType || (AnnotJSONType = {}));
class Level {
}
__decorate([
    IsNotEmpty(),
    IsString(),
    __metadata("design:type", String)
], Level.prototype, "name", void 0);
__decorate([
    IsNotEmpty(),
    IsEnum(AnnotJSONType),
    __metadata("design:type", String)
], Level.prototype, "type", void 0);
__decorate([
    IsNotEmpty(),
    IsArray(),
    __metadata("design:type", Array)
], Level.prototype, "items", void 0);
class Item {
}
__decorate([
    IsNotEmpty(),
    IsNumber(),
    __metadata("design:type", Number)
], Item.prototype, "id", void 0);
__decorate([
    IsArray(),
    __metadata("design:type", Array)
], Item.prototype, "labels", void 0);
class Segment extends Item {
}
class Event extends Item {
}
class Label {
}
__decorate([
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], Label.prototype, "name", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], Label.prototype, "value", void 0);
class Link {
}
__decorate([
    IsNotEmpty(),
    IsNumber(),
    __metadata("design:type", Number)
], Link.prototype, "fromID", void 0);
__decorate([
    IsNotEmpty(),
    IsNumber(),
    __metadata("design:type", Number)
], Link.prototype, "toID", void 0);

class NetworkManager {
    static getIPAddresses() {
        return Object.values(networkInterfaces()).flat().filter((info)=>{
            var _info, _info1;
            return ((_info = info) == null ? void 0 : _info.family) === 'IPv4' && !((_info1 = info) == null ? void 0 : _info1.internal);
        }).map((info)=>{
            var _info;
            return (_info = info) == null ? void 0 : _info.address;
        }).filter((a)=>a !== undefined && a !== null);
    }
}

class ScriptRunner {
    static async run(scriptPath, showOutput = false) {
        return new Promise((resolve, reject)=>{
            let output = '';
            const process = exec(scriptPath);
            if (process) {
                process.stdout.on('data', (data)=>{
                    output += data;
                });
                process.stdout.on('error', (data)=>{
                    output += data;
                });
                process.stderr.on('data', (data)=>{
                    output += data;
                });
                // what to do when the command is done
                process.on('close', (code)=>{
                    if (code === 0) {
                        if (showOutput) {
                            console.log(output);
                        }
                        resolve(output);
                    } else {
                        reject(output);
                    }
                });
            } else {
                reject("Can't run script.");
            }
        });
    }
}

class OpensslManager {
    /**
   * returns information about a certificate
   * @param certPath
   */ static async readCertInformation(certPath) {
        if (!exists(certPath)) {
            throw 'Path does not exist';
        }
        const output = await ScriptRunner.run(`openssl x509 -text -noout -in ${certPath}`, false);
        const version = this.readValue(/Certificate:\n +Data:\n *Version: ([0-9]+)/g, output, 1);
        const subject = this.readValue(/ +Subject: ([^\n]+)/g, output, 1);
        let alternativeNames = [
            this.readValue(/.*Subject Alternative Name: *\n +(.*)\n/g, output, 1)
        ];
        const subjectAlternativeName = {
            dns: [],
            ip: []
        };
        if (alternativeNames[0]) {
            alternativeNames = alternativeNames[0].split(/, ?/g).filter((a)=>a.trim() !== '');
            for (const alternativeName of alternativeNames){
                if (alternativeName) {
                    let value = this.readValue(/DNS:(.*)/g, alternativeName, 1);
                    if (value) {
                        subjectAlternativeName.dns.push(value);
                    } else {
                        value = this.readValue(/IP Address:(.*)/g, alternativeName, 1);
                        if (value) {
                            subjectAlternativeName.ip.push(value);
                        }
                    }
                }
            }
        }
        const validity = {
            notBefore: this.readValue(/ + Validity\n +Not Before *: ([^\n]+)\n +Not After *: ([^\n]+)/g, output, 1),
            notAfter: this.readValue(/ + Validity\n +Not Before *: ([^\n]+)\n +Not After *: ([^\n]+)/g, output, 2)
        };
        const result = {
            version: Number(version),
            validity: validity.notBefore && validity.notAfter ? {
                notBefore: new Date(Date.parse(validity.notBefore)),
                notAfter: new Date(Date.parse(validity.notAfter))
            } : undefined,
            subject,
            extensions: {
                subjectAlternativeName
            }
        };
        return result;
    }
    static readValue(regex, text, index) {
        const matches = regex.exec(text);
        if (matches && matches.length > index) {
            return matches[index];
        }
        return undefined;
    }
    /**
   * returns the SHA256 fingerprint of a x509 certificate.
   * @param certPath
   */ static async getFingerprint(certPath) {
        if (!exists(certPath)) {
            throw 'Path does not exist';
        }
        const output = await ScriptRunner.run(`openssl x509 -noout -fingerprint -in ${certPath}`, false);
        const matches = /SHA256 Fingerprint=([^ \n\s\t\r]*)/g.exec(output);
        return matches && matches.length > 1 ? matches[1] : undefined;
    }
}

export { AccountEntity, AccountFieldDefinitionEntity, AccountFieldValueEntity, AccountInfoEntity, AccountRoleProjectEntity, AnnotJSONType, AppConfigurationSchema, AppTokenEntity, Configuration, CryptoHelper, DbAwareColumn, DbAwareCreateDate, DbAwareUpdateDate, DbNamingStrategy, EmailEntity, EmailTemplateEntity, EmailTemplateTranslationEntity, Event, FileProjectEntity, FileProjectFolderEntity, IsNumericString, IsOptionalBoolean, IsOptionalEnum, IsOptionalNotEmptyEnum, IsOptionalNotEmptyNumber, IsOptionalNotEmptyString, IsOptionalNumber, IsOptionalNumericString, IsOptionalString, Item, Label, Level, Link, NetworkManager, OctraMigration, OpensslManager, OptionEntity, PolicyAccountConsentEntity, PolicyEntity, PolicyTranslationEntity, ProjectEntity, RoleEntity, SQLTypeMapper, ScriptRunner, Segment, TaskEntity, TaskInputOutputEntity, ToolConfigurationAssetEntity, ToolConfigurationEntity, ToolEntity, TranscriptDto, index as TypeORMEntities, appendURLQueryParams, dateTransformer, ensureNumber, getConfigPath, getOrmConfig, getPasswordHash, getRandomString, getToolHash, isFunction, isHiddenPath, joinURL, jsonTransformer, removeNullAttributes, removeProperties };
