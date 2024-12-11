export interface DirectoryStructure {
    [key: string]: string | DirectoryStructure | boolean | undefined;
    folders?: {
      [key: string]: DirectoryStructure;
    };
    separator?: string;
    generateTableOfContent?: boolean;
    outputFormat?: string;
  }