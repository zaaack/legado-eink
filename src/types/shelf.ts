export interface Shelf {
  data: Book[];
  errorMsg: string;
  isSuccess: boolean;
}

export interface Book {
  author: string;
  bookUrl: string;
  canUpdate: boolean;
  coverUrl: string;
  customCoverUrl?: string;
  durChapterIndex: number;
  durChapterPos: number;
  durChapterTime: number;
  durChapterTitle: string;
  group: number;
  intro: string;
  kind?: string;
  lastCheckCount: number;
  lastCheckTime: number;
  latestChapterTime: number;
  latestChapterTitle: string;
  name: string;
  order: number;
  origin: string;
  originName: string;
  originOrder: number;
  readConfig: ReadConfig;
  tocUrl: string;
  totalChapterNum: number;
  type: number;
  wordCount: string;
  variable?: string;
}

interface ReadConfig {
  delTag: number;
  reSegment: boolean;
  reverseToc: boolean;
  splitLongChapter: boolean;
  pageAnim?: number;
  useReplaceRule?: boolean;
  imageStyle?: string;
}
