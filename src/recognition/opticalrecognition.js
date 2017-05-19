/**
 * @module OpticalRecognition Used to recognize the text in a image.
 * @author Vasile Pește <sirvasile@protonmail.ch>
*/

export const OpticalRecognition = (

    function (undefined)
    {
        /**
         * _recognize Recognize the text in a image.
         * @param {String} url The URL of the image to recognize.
         * @return {Promise}
        */
        
        const _recognize = (url) => {
            const options = {
                lang: "eng",
                tessedit_char_whitelist: "aAbBcCdDeEfFgGhHiIjJkKlLmMnNoOpPqQrRsStTuUvVwWxXyYzZ0123456789"
            };
            
            return Tesseract.recognize(url, options);
        };
        
        // Return the public context.
        return (url) => _recognize(url);
    }

());