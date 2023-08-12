/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable eqeqeq */
/*

  filepreview : A file preview generator for node.js
  @todo: add synchronous function es6 compatible using async / await.
  @todo: make a standalone function for images with more custom options.
  @todo: make default options available
  @todo:

*/

import { execFile, execFileSync } from 'node:child_process';
import  * as path   from 'path';
import  * as fs  from 'fs';
import mimedb from './db.json';

/**
   * Used promise for creating thumbnail from documents file.
   * Creates a pdf from any document using command line tool unoconv.
   * Creates a thumbnail from the pdf generated using imagemagic command line tool convert.
   */
export const generateAsync = (
    inputOriginal: string,
    output: string,
    options: {
        width?:  number;
        height?: number;
        keepAspect?: any;
        quality?: string;
        background?: string;
        pdfPath?: string;
        pdf?: undefined;

    } = {}) => new Promise(
    (resolve, reject) => {

        const input = inputOriginal;
        if (!fs.existsSync(input)) reject({ error: 'file doesnot exist please make sure you are using the right path' });

        // Check for supported output format
        const extOutput = path.extname(output).toLowerCase().replace('.', '');
        const extInput = path.extname(input).toLowerCase().replace('.', '');
        const fileNameOrignal = path.basename(input, '.' + extInput);

        if ( extOutput != 'gif' && extOutput != 'jpg' && extOutput != 'png' ) {
            reject({ error: 'extension not supported, use png, gif, jpg' });
        }

        let fileType = 'other';

        root:
        for (const index in mimedb) {
            if ('extensions' in (mimedb as any)[index]) {
                for (const indexExt in (mimedb as any)[index].extensions) {
                    if ((mimedb as any)[index].extensions[indexExt] == extInput) {
                        if (index.split('/')[0] == 'image') {
                            fileType = 'image';
                        } else if (index.split('/')[0] == 'video') {
                            fileType = 'video';
                        } else {
                            fileType = 'other';
                        }
                        break root;
                    }
                }
            }
        }

        if (extInput == 'pdf') {
            fileType = 'image';
        }

        fs.lstat(input, (error, stats) => {
            if (error) reject(error);
            if (!stats.isFile()) {
                reject({ error: 'Not a valid file.' });
            } else {
                if (fileType == 'video') {
                    const ffmpegArgs = ['-y', '-i', input, '-vf', 'thumbnail', '-frames:v', '1', output];
                    if ((options.width || 0) > 0 && (options.height || 0) > 0) {
                        ffmpegArgs.splice(4, 1, 'thumbnail,scale=' + options.width + ':' + options.height);
                    }
                    execFile('ffmpeg', ffmpegArgs, (err) => {
                        if (err) reject(err);
                        resolve({ thumbnail: output });
                    });
                }

                if (fileType == 'image') {
                    const convertArgs = [input + '[0]', output];
                    if ((options.width || 0) > 0 && (options.height || 0) > 0) {
                        if(options.keepAspect) {
                            convertArgs.splice(0, 0, '-resize', options.width + 'x' + options.height );
                        } else {
                            convertArgs.splice(0, 0, '-resize', options.width + 'x' + options.height + '!');
                        }
                    } else if ((options.height || 0) > 0) {
                        convertArgs.splice(0, 0, '-resize', 'x' + options.height);
                    } else if ((options.width || 0) > 0) {
                        convertArgs.splice(0, 0, '-resize',  `${options.width || ''}`);
                    }
                    if (options.quality) {
                        convertArgs.splice(0, 0, '-quality', options.quality);
                    }
                    if (options.background) {
                        convertArgs.splice(0, 0, '-background', options.background);
                        convertArgs.splice(0, 0, '-flatten');
                    }
                    execFile('convert', convertArgs, (err) => {
                        if (err) reject(err);
                        resolve({ thumbnail: output });
                    });
                }

                if (fileType == 'other') {

                    const tempPDF = path.join(options.pdfPath || '', fileNameOrignal + '.pdf');

                    execFile('unoconv', ['-e', 'PageRange=1', '-o', tempPDF, input], () => {
                        if (error) reject(error);
                        const convertOtherArgs = [tempPDF + '[0]', output];
                        if ((options.width || 0) > 0 && (options.height || 0) > 0) {
                            if(options.keepAspect) {
                                convertOtherArgs.splice(0, 0, '-resize', options.width + 'x' + options.height );
                            } else {
                                convertOtherArgs.splice(0, 0, '-resize', options.width + 'x' + options.height + '!');
                            }
                        } else if ((options.height || 0) > 0) {
                            convertOtherArgs.splice(0, 0, '-resize', 'x' + options.height);
                        } else if ((options.width || 0) > 0) {
                            convertOtherArgs.splice(0, 0, '-resize', `${options.width || ''}`);
                        }
                        if (options.quality) {
                            convertOtherArgs.splice(0, 0, '-quality', options.quality);
                        }
                        if (options.background) {
                            convertOtherArgs.splice(0, 0, '-background', options.background);
                            convertOtherArgs.splice(0, 0, '-flatten');
                        }
                        execFile('convert', convertOtherArgs, (err) => {
                            if (err) reject(err);
                            if (!options.pdf || options.pdf == undefined) {
                                fs.unlink(tempPDF, (e) => {
                                    if (e) reject(e);
                                    resolve({ thumbnail: output });
                                });
                            } else {
                                resolve({ thumbnail: output, pdf: tempPDF });
                            }
                        });
                    });
                }
            }
        });
    });

/**
   * Synchronous function for generating thumbnail
   */
export const generateSync = (
    inputOriginal: string,
    output: string,
    options: {
        width?:  number;
        height?: number;
        keepAspect?: any;
        quality?: string;
        background?: string;
        pdfPath?: string;
        pdf?: undefined;

    } = {}) => new Promise((resolve, reject) => {

    const input = inputOriginal;
    if (!fs.existsSync(input)) reject({ error: 'file doesnot exist please make sure you are using the right path' });
    // Check for supported output format
    const extOutput = path.extname(output).toLowerCase().replace('.', '');
    const extInput = path.extname(input).toLowerCase().replace('.', '');
    const fileNameOrignal = path.basename(input, '.' + extInput);

    if ( extOutput != 'gif' && extOutput != 'jpg' && extOutput != 'png' ) {
        reject({ error: 'extension not supported, use png, gif, jpg' });
    }

    let fileType = 'other';

    root:
    for (const index in mimedb) {
        if ('extensions' in (mimedb as any)[index]) {
            for (const indexExt in (mimedb as any)[index].extensions) {
                if ((mimedb as any)[index].extensions[indexExt] == extInput) {
                    if (index.split('/')[0] == 'image') {
                        fileType = 'image';
                    } else if (index.split('/')[0] == 'video') {
                        fileType = 'video';
                    } else {
                        fileType = 'other';
                    }
                    break root;
                }
            }
        }
    }

    if (extInput == 'pdf') {
        fileType = 'image';
    }

    try {
        const stats = fs.lstatSync(input);

        if (!stats.isFile()) {
            reject(false);
        }
    } catch (e) {
        reject(false);
    }

    if (fileType == 'video') {
        try {
            const ffmpegArgs = ['-y', '-i', input, '-vf', 'thumbnail', '-frames:v', '1', output];
            if ((options.width || 0) > 0 && (options.height || 0) > 0) {
                ffmpegArgs.splice(4, 1, 'thumbnail,scale=' + options.width + ':' + options.height);
            }
            execFileSync('ffmpeg', ffmpegArgs);
            resolve({ thumbnail: output });
        } catch (e) {
            reject(e);
        }
    }

    if (fileType == 'image') {
        try {
            const convertArgs = [input + '[0]', output];
            if ((options.width || 0) > 0 && (options.height || 0) > 0) {
                if(options.keepAspect) {
                    convertArgs.splice(0, 0, '-resize', options.width + 'x' + options.height);
                } else {
                    convertArgs.splice(0, 0, '-resize', options.width + 'x' + options.height + '!');
                }
            } else if ((options.height || 0) > 0) {
                convertArgs.splice(0, 0, '-resize', 'x' + options.height);
            } else if ((options.width || 0) > 0) {
                convertArgs.splice(0, 0, '-resize',  `${options.width || ''}`);
            }
            if (options.quality) {
                convertArgs.splice(0, 0, '-quality', options.quality);
            }
            execFileSync('convert', convertArgs);
            resolve({ thumbnail: output });
        } catch (e) {
            reject(e);
        }
    }

    if (fileType == 'other') {
        try {
            const tempPDF = path.join(options.pdfPath || '', fileNameOrignal + '.pdf');

            execFileSync('unoconv', ['-e', 'PageRange=1', '-o', tempPDF, input]);

            const convertOtherArgs = [tempPDF + '[0]', output];
            if((options.width || 0) > 0 && (options.height || 0) > 0){
                if(options.keepAspect) {
                    convertOtherArgs.splice(0, 0, '-resize', options.width + 'x' + options.height );
                } else {
                    convertOtherArgs.splice(0, 0, '-resize', options.width + 'x' + options.height + '!');
                }
            } else if ((options.height || 0) > 0) {
                convertOtherArgs.splice(0, 0, '-resize', 'x' + options.height);
            } else if ((options.width || 0) > 0) {
                convertOtherArgs.splice(0, 0, '-resize',  `${options.width || ''}`);
            }
            if (options.quality) {
                convertOtherArgs.splice(0, 0, '-quality', options.quality);
            }
            if (options.background) {
                convertOtherArgs.splice(0, 0, '-background', options.background);
                convertOtherArgs.splice(0, 0, '-flatten');
            }
            execFileSync('convert', convertOtherArgs);

            if (!options.pdf || options.pdf == undefined) {
                try {
                    fs.unlinkSync(tempPDF);
                    resolve({ thumbnail: output });
                } catch (e) {
                    reject(e);
                }
            }
            resolve({ thumbnail: output, pdf: tempPDF });
        } catch (e) {
            reject(e);
        }
    }
});

