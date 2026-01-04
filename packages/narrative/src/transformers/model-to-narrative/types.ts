export interface GeneratedFile {
  path: string;
  code: string;
}

export interface GeneratedNarratives {
  files: GeneratedFile[];
}

export interface CrossModuleImport {
  fromPath: string;
  typeNames: string[];
}
