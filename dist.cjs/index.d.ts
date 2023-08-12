/**
   * Used promise for creating thumbnail from documents file.
   * Creates a pdf from any document using command line tool unoconv.
   * Creates a thumbnail from the pdf generated using imagemagic command line tool convert.
   */
export declare const generateAsync: (inputOriginal: string, output: string, options?: {
    width?: number;
    height?: number;
    keepAspect?: any;
    quality?: string;
    background?: string;
    pdfPath?: string;
    pdf?: undefined;
}) => Promise<unknown>;
/**
   * Synchronous function for generating thumbnail
   */
export declare const generateSync: (inputOriginal: string, output: string, options?: {
    width?: number;
    height?: number;
    keepAspect?: any;
    quality?: string;
    background?: string;
    pdfPath?: string;
    pdf?: undefined;
}) => Promise<unknown>;
