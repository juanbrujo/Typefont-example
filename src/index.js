/**
 * @module Typefont Used to recognize the font of a text in a image.
 * @author Vasile Pește <sirvasile@protonmail.ch>
 * @version 0.1-beta.0
*/

import {FontStorage} from "./font/fontstorage.js";
import {ImageDrawing} from "./image/imagedrawing.js";
import {OpticalRecognition} from "./recognition/opticalrecognition.js";
import {AnalyticPerception} from "./comparison/analytic.js";
import {ShapePerception} from "./comparison/shape.js";

export const Typefont = (

    function (undefined)
    {
        /**
         * _symbolsToBase64 Get the base64 data image/png of the symbols recognized in a image.
         * @param {ImageDrawing} img The ImageDrawing instance of the recognized image.
         * @param {Object} res The result of the recognition process.
         * @param {Object} [options = {}]
         * @return {Object}
        */
        
        const _symbolsToBase64 = (img, res, options = {}) => {
            const {
                // The minimum confidence that a symbol must have to be accepted in the comparison queue.
                // The confidence value is assigned by the OCR engine.
                minSymbolConfidence = 15
            } = options;
            const data = {};
            const symbols = res.symbols;
            
            // This will skip double letters!
            // Note the confidence condition.
            for (const symbol of symbols)
                if (symbol.confidence >= minSymbolConfidence)
                    data[symbol.text] = img.crop(symbol.bbox.x0, symbol.bbox.y0, symbol.bbox.x1, symbol.bbox.y1);
            
            return data;
        };
        
        /**
         * _needReverse Check if a binarized ImageDrawing instance must be reversed (necessary for the comparison).
         * @param {Array} data The data of the ImageDrawing instance.
         * @return {Boolean}
        */
        
        const _needReverse = (data) => {
            let black = 0;
            let white = 0;
            
            for (let i = 0, ll = data.length; i < ll; i += 4)
                if (!data[i])
                    ++black;
                else
                    ++white;
            
            return black > white;
        };
        
        /**
         * _symbolsToDomain Remove the single symbols from two lists of symbols.
         * @param {Object} first The first list of symbols.
         * @param {Object} second The second list of symbols.
        */
        
        const _symbolsToDomain = (first, second) => {
            for (let key in first)
                if (!second[key])
                    delete first[key];
            
            for (let key in second)
                if (!first[key])
                    delete second[key]; 
        };
        
        /**
         * _prepareImageRecognition Load and recognize the symbols and text in a image.
         * @param {String} url The URL of the image to recognize.
         * @param {Object} [options = {}]
         * @return {Promise}
        */
        
        const _prepareImageRecognition = (url, options = {}) => {
            const {
                // Recognition timeout [s].
                textRecognitionTimeout = 60,
                // Binarize the image before the recognition?
                textRecognitionBinarization = true
            } = options;
            
            return new Promise((resolve, reject) => {
                const image = new ImageDrawing();
                
                image.draw(url).then(() => {
                    if (textRecognitionBinarization)
                    {
                        image.binarize();
                        
                        if (_needReverse(image.data))
                            image.reverse();   
                    }
                    
                    const timeout = setTimeout(() => reject(`Unable to recognize ${url}`), textRecognitionTimeout * 1000);
                    
                    OpticalRecognition(image.toDataURL()).then((res) => {
                        clearTimeout(timeout);
                        res.symbolsBase64 = _symbolsToBase64(image, res, options);
                        res.pivot = image;
                        resolve(res);
                    }).catch(reject);
                }).catch(reject);
            });
        };
        
        /**
         * _prepare Load the font index and the image recognition process by calling _prepareFontsIndex and _prepareImageRecognition.
         * @param {String} url The URL of the image to recognize.
         * @param {Object} [options = {}]
         * @return {Promise}
        */
        
        const _prepare = (url, options = {}) => {
            const {
                // The URL of the fonts index JSON file.
                fontsIndex = "storage/index.json"
            } = options;
            
            return new Promise((resolve, reject) => {
                Promise.all([
                    _prepareImageRecognition(url, options),
                    FontStorage.prepareFontsIndex(fontsIndex)
                ]).then((res) => {
                    resolve({
                        recognition: res[0],
                        fonts: res[1]
                    });
                }).catch(reject);
            });
        };
        
        /**
         * _compare Compare two lists of symbols using a perceptual and a pixel based image comparison.
         * @param {Object} first The first list of symbols.
         * @param {Object} second The second list of symbols.
         * @param {Object} [options = {}]
         * @return {Promise}
        */
        
        const _compare = (first, second, options = {}) => {            
            return new Promise((resolve, reject) => {
                const todo = Object.keys(first).length;
                const result = {};
                const finalize = (symbol, res) => {
                    ++done;
                    
                    result[symbol] = res;
                    
                    if (done == todo)
                        resolve(result);
                };
                let done = 0;
                
                for (const symbol in first)
                {
                    Promise.all([
                        AnalyticPerception(first[symbol], second[symbol], options),
                        ShapePerception(first[symbol], second[symbol], options)
                    ]).then((res) => {
                        finalize(symbol, {
                            analytic: res[0],
                            shape: res[1]
                        });
                    }).catch(reject);
                }
            });
        };
        
        /**
         * _average Used to compute the average similarity of a given font comparison result of the _recognize process.
         * @param {Object} res
         * @return {Number}
        */
        
        const _average = (res) => {
            let calc = 0;
            let ll = 0;
            
            for (const symbol in res)
            {
                calc += (res[symbol].analytic + res[symbol].shape) / 2;
                ++ll;
            }
            
            return calc / ll;
        };
        
        /**
         * _recognize Start the process to recognize the font of a text in a image.
         * @param {String} url The URL of the image.
         * @param {Object} [options = {}]
         * @return {Promise}
        */
        
        const _recognize = (url, options = {}) => {
            const {
                // Used as function to invoke each time a font is compared.
                progress,
                // The URL of the directory containing the fonts.
                fontsDirectory = "storage/fonts/",
                // The name of the file containing the JSON data of a font.
                fontsData = "data.json"
            } = options;
            
            return new Promise((resolve, reject) => {
                _prepare(url, options).then((res) => {
                    const fonts = res.fonts.index;
                    const todo = fonts.length;
                    const result = [];
                    const symbols = res.recognition.symbolsBase64;
                    const finalize = (name, val, font) => {
                        const meta = font.meta || {};
                        
                        meta.similarity = _average(val);
                        meta.name = meta.name || name;
                        result.push(meta);
                        
                        if (progress)
                            progress(name, val, done / todo);
                        
                        if (++done == todo) {
                            result.sort((a, b) => b.similarity - a.similarity);
                            resolve(result);
                        }
                    };
                    let done = 0;
                    
                    for (const name of fonts)
                    {
                        FontStorage.prepareFont(`${fontsDirectory}${name}/${fontsData}`).then((font) => {
                            _symbolsToDomain(symbols, font.alpha);
                            _compare(symbols, font.alpha, options).then((fin) => finalize(name, fin, font)).catch(reject);
                        }).catch(reject);
                    }
                }).catch(reject); 
            });
        };
        
        // Return the public context.
        return (url, options) => _recognize(url, options);
    }

());