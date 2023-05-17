export interface ChaptersRes {
  data: Chapter[];
  errorMsg: string;
  isSuccess: boolean;
}

export interface Chapter {
  baseUrl: string;
  bookUrl: string;
  index: number;
  isPay: boolean;
  isVip: boolean;
  isVolume: boolean;
  tag: string;
  title: string;
  url: string;
}
