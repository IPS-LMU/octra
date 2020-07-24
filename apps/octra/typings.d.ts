// Typings reference file, see links for more information
// https://github.com/typings/typings
// https://www.typescriptlang.org/docs/handbook/writing-declaration-files.html

declare var module: NodeModule;

interface NodeModule {
  id: string;
}

declare var System: any;
declare var jQuery: any;
declare var platform: any;
declare var tidyUpAnnotation: ((string, any) => any);
declare var videojs: any;
declare var navigator: Navigator;
declare var document: Document;
declare var Ajv: any;

