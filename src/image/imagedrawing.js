/**
 * @module ImageDrawing Used to manipulate images.
 * @author Vasile Pește <sirvasile@protonmail.ch>
*/

export const ImageDrawing = class {

    constructor () {
        this.canvas = document.createElement("canvas");
        this.context = this.canvas.getContext("2d");
    }
    
    /**
     * draw Load a image inside the canvas (overriding the current frame).
     * @param {String} url The URL of the image to draw.
     * @param {Number} [scale = 1] Scale factor.
     * @param {Number} [w = undefined] New width.
     * @param {Number} [h = undefined] New height.
     * @return {Promise}
    */
    
    draw (url, scale = 1, w = undefined, h = undefined)
    {
        return new Promise((resolve, reject) => {
            const image = document.createElement("img");
            
            image.onload = () => {
                let width = w || image.width;
                let height = h || image.height;
                
                width *= scale;
                height *= scale;
                
                this.canvas.width = width;
                this.canvas.height = height;
                this.context.drawImage(image, 0, 0, width, height);
                
                resolve();
            };
            image.onerror = image.onabort = () => reject(`Unable to load ${url}`);
            image.src = url;
        });
    }
    
    /**
     * crop Extract a specific area from the current frame.
     * @param {Number} x
     * @param {Number} y
     * @param {Number} width
     * @param {Number} height
     * @return {String} The base64 data image/png of the cropped portion.
    */
    
    crop (x, y, width, height)
    {
        const fragment = document.createElement("canvas").getContext("2d");
        const data = this.context.getImageData(x, y, width - x, height - y);
        
        fragment.canvas.width = data.width;
        fragment.canvas.height = data.height;
        fragment.putImageData(data, 0, 0);
        
        return fragment.canvas.toDataURL();
    }
    
    /**
     * grayscale Turn the canvas into grayscale.
    */
    
    grayscale ()
    {
        const canvas = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = canvas.data;
        
        for (let i = 0, ll = data.length; i < ll; i += 4)
        {
            const luma = data[i] * 0.2126 + data[i + 1] * 0.7152 + data[i + 2] * 0.0722;
            
            data[i] = data[i + 1] = data[i + 2] = luma;
        }
        
        this.context.putImageData(canvas, 0, 0);
    }
    
    /**
     * reverse Reverse the colors of the canvas.
    */
    
    reverse ()
    {
        const canvas = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = canvas.data;
        
        for (let i = 0, ll = data.length; i < ll; i += 4)
        {
            data[i] = 255 - data[i];
            data[i + 1] = 255 - data[i + 1];
            data[i + 2] = 255 - data[i + 2];
        }
        
        this.context.putImageData(canvas, 0, 0);
    }
    
    /**
     * binarize Turn the canvas into black and white.
    */
    
    binarize ()
    {
        const canvas = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = canvas.data;
        
        this.grayscale();
        
        for (let i = 0, ll = data.length; i < ll; i += 4)
        {
            const luma = data[i];
            
            // Consider: 40 <= luma <= 140.
            data[i] = data[i + 1] = data[i + 2] = luma >= 60 && luma <= 160 ? 0 : 255;
        }
        
        this.context.putImageData(canvas, 0, 0);
    }
    
    /**
     * brightness Get the average brightness of the current frame.
     * @return {Number}
    */
    
    brightness ()
    {
        const data = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height).data;
        let union = 0;
        
        for (let i = 0, ll = data.length; i < ll; i += 4)
            union += (data[i] + data[i + 1] + data[i + 2] + data[i + 3]) / 4;
        
        return union / data.length / 4;
    }
    
    /**
     * toDataURL Get the base64 data image/png of the current frame.
     * @return {String}
    */
    
    toDataURL () {
        return this.canvas.toDataURL();
    }
    
    /**
     * width Get the width of the canvas.
     * @return {Number}
    */
    
    get width () {
        return this.canvas.width;
    }
    
    /**
     * height Get the height of the canvas.
     * @return {Number}
    */
    
    get height () {
        return this.canvas.height;
    }
    
    /**
     * data Get the pixels of the canvas.
     * @return {Array}
    */
    
    get data () {
        return this.context.getImageData(0, 0, this.canvas.width, this.canvas.height).data;
    }
    
    /**
     * base64ToBuffer Serialize a base64 string to ArrayBuffer.
     * @param {String} base64 The base64 string.
     * @return {ArrayBuffer}
    */
    
    static base64ToBuffer (base64)
    {
        const decode = atob(base64);
        const buffer = new ArrayBuffer(decode.length);
        const uint = new Uint8Array(buffer);
        let ll = 0;
        
        for (const ch of decode)
            uint[ll++] = ch.charCodeAt(0);
        
        return buffer;
    }

};