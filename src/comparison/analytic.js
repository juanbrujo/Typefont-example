/**
 * @module AnalyticPerception Used to compare two images analytically.
 * @author Vasile Pește <sirvasile@protonmail.ch>
*/

import {ImageDrawing} from "../image/imagedrawing.js";

export const AnalyticPerception = (

    function (undefined)
    {
        /**
         * _compare Compare two images using a pixel based method.
         * @param {String} first The URL of the first image.
         * @param {String} second The URL of the second image.
         * @param {Object} [options = {}]
         * @return {Promise}
        */
        
        const _compare = (first, second, options = {}) => {
            const {
                // Comparison threshold.
                analyticComparisonThreshold = 0.5,
                // Scale the first and the second image to the same size before comparison?
                analyticComparisonScaleToSameSize = false,
                // Used as dimension when resizing the images to the same size.
                analyticComparisonSize = 128
            } = options;
            
            if (!first.indexOf("data:image/png"))
                first = ImageDrawing.base64ToBuffer(first.substr(22));
            
            if (!second.indexOf("data:image/png"))
                second = ImageDrawing.base64ToBuffer(second.substr(22));
            
            return new Promise((resolve, reject) => {                
                Promise.all([Jimp.read(first), Jimp.read(second)]).then(res => {
                    const img = res[0];
                    const img1 = res[1];
                    
                    if (analyticComparisonScaleToSameSize) {
                        img.resize(analyticComparisonSize, analyticComparisonSize);
                        img1.resize(analyticComparisonSize, analyticComparisonSize);
                    }
                    
                    // Return the similarity percentage.
                    resolve(100 - (Jimp.diff(img, img1, analyticComparisonThreshold).percent * 100));
                }).catch(reject);
            });
        };
        
        // Return the public context.
        return (first, second, options) => _compare(first, second, options);
    }

());