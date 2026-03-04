/* eslint-disable @typescript-eslint/no-explicit-any */
declare module 'fabric' {
  export const fabric: {
    Canvas: new (...args: any[]) => any;
    Rect: new (...args: any[]) => any;
    Circle: new (...args: any[]) => any;
    IText: new (...args: any[]) => any;
    Shadow: new (...args: any[]) => any;
    loadSVGFromURL: (url: string, callback: (objects: any[], options: any) => void) => void;
    util: {
      groupSVGElements: (elements: any[], options: any) => any;
      [key: string]: any;
    };
    [key: string]: any;
  };
}
