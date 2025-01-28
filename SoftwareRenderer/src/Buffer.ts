export class Buffer {
    width: number;
    height: number;
    dims: number;
    values: Float64Array; // [colors][columns][rows]

    constructor(width: number, height: number, dims: number) {
        this.width = width;
        this.height = height;
        this.dims = dims;
        this.values = new Float64Array(width * height * dims);
    }

    /*
    Returns the index for the first dim at the given coordinate
     */
    indexForElement(x: number, y: number) {
        return y * this.width * this.dims + x * this.dims;
    }

    /*
    Sets the value at a given coordinate to a Float64Array
     */
    setElement(x: number, y: number, vals: Float64Array) {
        let startIndex = this.indexForElement(x, y);

        for (let i = 0; i < this.dims; i++) {
            this.values[startIndex + i] = vals[i]
        }
    }

    /*
    Gets the value at a given coordinate as a Float64Array
     */
    getElement(x: number, y: number): Float64Array {
        let startIndex = this.indexForElement(x, y);
        let res = new Float64Array(this.dims)

        for (let i = 0; i < this.dims; i++) {
            res[i] = this.values[startIndex + i];
        }

        return res;
    }

    clear(to: number) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const index = y * this.width * this.dims + x * this.dims;

                for (let d = 0; d < this.dims; d++) {
                    this.values[index + d] = to;
                }
            }
        }
    }
}