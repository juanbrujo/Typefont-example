/**
 * @module ShapePerception Used to compare two images perceptually.
 * @author Vasile Pește <sirvasile@protonmail.ch>
*/

import {ImageDrawing} from "../image/imagedrawing.js";

export const ShapePerception = (

    function (undefined)
    {
        /**
         * _prepareImages Load and binarize two images as ImageDrawing instances.
         * @param {String} first The URL of the first image.
         * @param {String} second The URL of the second image.
         * @param {Object} [options = {}]
         * @return {Promise}
        */
        
        const _prepareImages = (first, second, options = {}) => {
            const {
                // Used as dimension when resizing the images to the same size.
                perceptualComparisonSize = 64
            } = options;
            
            return new Promise((resolve, reject) => {
                const img = new ImageDrawing();
                const img1 = new ImageDrawing();
                const size = perceptualComparisonSize;
                
                Promise.all([img.draw(first, 1, size, size), img1.draw(second, 1, size, size)])
                    .then(() => resolve([img, img1]))
                    .catch(reject);
            });
        };
        
        /**
         * _getBinarizedMatrix Put the pixels of a binarized ImageDrawing instance in a matrix.
         * @param {ImageDrawing} img
         * @return {Array}
        */
        
        const _getBinarizedMatrix = (img) => {
            const width = img.canvas.width;
            const data = img.context.getImageData(0, 0, width, img.canvas.height).data;
            const matrix = [];
            let w = 0;
            let j = 0;
            
            for (let i = 0, ll = data.length; i < ll; i += 4)
            {
                if (w == width) {
                    w = 0;
                    ++j;
                }
                
                if (!w)
                    matrix.push([]);
                
                matrix[j].push(data[i] == 255 ? 1 : 0);
                ++w;
            }
            
            return matrix;
        };
        
        /**
         * _compare Compare two images using a method based on human perception (Hamming distance).
         * @param {String} first The URL of the first image.
         * @param {String} second The URL of the second image.
         * @param {Object} [options = {}]
         * @return {Promise}
        */
        
        const _compare = (first, second, options = {}) => {
            return new Promise((resolve, reject) => {
                _prepareImages(first, second, options).then((res) => {
                    const matrix = _getBinarizedMatrix(res[0]);
                    const matrix1 = _getBinarizedMatrix(res[1]);
                    const r = matrix.length;
                    const c = matrix[0].length;
                    let dist = 0;
                    
                    for (let i = 0; i < r; ++i)
                        for (let j = 0; j < c; ++j)
                            if (matrix[i][j] != matrix1[i][j])
                                ++dist;
                    
                    // Return the similarity percentage.
                    resolve(100 - (dist / (r * c) * 100));
                }).catch(reject);
            });
        };
        
        // Return the public context.
        return (first, second, options) => _compare(first, second, options);
    }

());