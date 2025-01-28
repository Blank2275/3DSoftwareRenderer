import {Vector} from "./Vector.ts";

export class Matrix {
    matrix: number[][];

    constructor(matrix: number[][]) {
        this.matrix = matrix
    }

    multiplyMatrix(otherMatrix: Matrix): Matrix {
        const other = otherMatrix.matrix
        let res: number[][] = []
        for (let y = 0; y < 4; y++) {
            res.push([])
            for (let x = 0; x < 4; x++) {
                let c = 0;
                for (let a = 0; a < 4; a++) {
                    c += this.matrix[y][a] * other[a][x]
                }

                res[res.length - 1].push(c)
            }
        }

        return new Matrix(res);
    }

    multiplyVector(vector: Vector): Vector {
        const vec4 = [...vector, 1]
        let xPrime: number = vec4[0] * this.matrix[0][0] +
            vec4[1] * this.matrix[1][0] +
            vec4[2] * this.matrix[2][0] +
            vec4[3] * this.matrix[3][0];

        let yPrime: number = vec4[0] * this.matrix[0][1] +
            vec4[1] * this.matrix[1][1] +
            vec4[2] * this.matrix[2][1] +
            vec4[3] * this.matrix[3][1];

        let zPrime: number = vec4[0] * this.matrix[0][2] +
            vec4[1] * this.matrix[1][2] +
            vec4[2] * this.matrix[2][2] +
            vec4[3] * this.matrix[3][2];

        let wPrime: number = vec4[0] * this.matrix[0][3] +
            vec4[1] * this.matrix[1][3] +
            vec4[2] * this.matrix[2][3] +
            vec4[3] * this.matrix[3][3];

        if (wPrime != 1) {
            xPrime /= wPrime;
            yPrime /= wPrime;
            zPrime /= wPrime;
        }

        return [xPrime, yPrime, zPrime]
    }

    multiplyVectors(vectors: Vector[]): Vector[] {
        let transformedVectors: Vector[] = []
        for (let vector of vectors) {
            transformedVectors.push(this.multiplyVector(vector))
        }
        return transformedVectors
    }
}

export class Matrices {
    static Zeros(): Matrix {
        let matrixValues: number[][] = [];

        for (let a = 0; a < 4; a++) {
            matrixValues.push([])
            for (let b = 0; b < 4; b++) {
                matrixValues[matrixValues.length - 1].push(0)
            }
        }

        return new Matrix(matrixValues);
    }

    static Perspective(fov: number, near: number, far: number, aspectRatio: number): Matrix {
        let matrixValues: number[][] = [];

        for (let a = 0; a < 4; a++) {
            matrixValues.push([])
            for (let b = 0; b < 4; b++) {
                matrixValues[matrixValues.length - 1].push(0)
            }
        }

        const scale = 1 / Math.tan(fov / 2 * Math.PI / 180);
        matrixValues[0][0] = scale / aspectRatio;
        matrixValues[1][1] = scale;
        matrixValues[2][2] = -far / (far - near);
        matrixValues[3][2] = far * near / (far - near);
        matrixValues[2][3] = -1;

        return new Matrix(matrixValues)
    }

    static Rotation(x: number, y: number, z: number) {
        const Rx: number[][] = [
            [1, 0, 0, 0],
            [0, Math.cos(x), -Math.sin(x), 0],
            [0, Math.sin(x), Math.cos(x), 0],
            [0, 0, 0, 1]
        ]

        const Ry: number[][] = [
            [Math.cos(y), 0, Math.sin(y), 0],
            [0, 1, 0, 0],
            [-Math.sin(y), 0, Math.cos(y), 0],
            [0, 0, 0, 1]
        ]

        const Rz: number[][] = [
            [Math.cos(z), -Math.sin(z), 0, 0],
            [Math.sin(z), Math.cos(z), 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1]
        ]

        const xMatrix = new Matrix(Rx);
        const yMatrix = new Matrix(Ry);
        const zMatrix = new Matrix(Rz);

        return xMatrix.multiplyMatrix(yMatrix).multiplyMatrix(zMatrix);
    }
}