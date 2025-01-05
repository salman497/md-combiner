export interface DirectoryStructure {
    [key: string]: string | DirectoryStructure | boolean |  string[]|  undefined;
    folders?: {
      [key: string]: DirectoryStructure;
    };
    separator?: string;
    generateTableOfContent?: boolean;
    largeTextContentFiles?: string[];
    outputFormat?: string;
  }