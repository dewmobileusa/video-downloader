declare module '@sasmeee/igdl' {
  interface TiktokResponse {
    success: boolean;
    data?: {
      video: string;
      [key: string]: any;
    };
  }
  
  export function TiktokDL(url: string): Promise<TiktokResponse>;
} 