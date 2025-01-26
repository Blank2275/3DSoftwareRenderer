import {Matrices, Matrix} from "../Rasterizer/Matrix.ts";
import {Buffer} from "../Buffer.ts";
import {Shader} from "../Shader.ts";
import {Mesh} from "./Mesh.ts";

export class Rasterizer {
    width: number
    height: number
    projectionMatrix: Matrix

    constructor(width: number, height: number, fov: number, near: number, far: number) {
        this.width = width
        this.height = height
        this.projectionMatrix = Matrices.Perspective(fov, near, far);
    }

    render(mesh: Mesh, renderBuffer: Buffer, shader: Shader) {
        const vertices = mesh.vertices
        const faces = mesh.faces
        const vertexAttributes = mesh.vertexAttributes

        const worldToScreen = (vertex: number[]) => {
            let res = [0, 0];
            res[0] = (vertex[0] + 1) / 2 * this.width;
            res[1] = (vertex[1] + 1) / 2 * this.height;

            return res;
        }

        const screenToWorld = (vertex: number[]) => {
            let res = [0, 0];
            res[0] = vertex[0] / this.width * 2 - 1;
            res[1] = vertex[1] / this.height * 2 - 1;

            return res
        }

        let transformedVertices: number[][] = [];


        for (let i in vertices) {
            let vertex = vertices[i]
            transformedVertices.push(this.projectionMatrix.multiplyVector(vertex));
        }

        for (let i in faces) {
            const face = faces[i]

            const worldA = vertices[face[0]]
            const worldB = vertices[face[1]]
            const worldC = vertices[face[2]]

            const vertexA = transformedVertices[face[0]];
            const vertexB = transformedVertices[face[1]];
            const vertexC = transformedVertices[face[2]];

            const inverseZA = [...vertices[face[0]]];
            const inverseZB = [...vertices[face[1]]];
            const inverseZC = [...vertices[face[2]]];
            inverseZA[2] = 1 / inverseZA[2];
            inverseZB[2] = 1 / inverseZB[2];
            inverseZC[2] = 1 / inverseZC[2];

            const screenVertexA = worldToScreen(vertexA);
            const screenVertexB = worldToScreen(vertexB);
            const screenVertexC = worldToScreen(vertexC);

            const [tl, br] = this.calculateBoundingBox(screenVertexA, screenVertexB, screenVertexC);

            const area = this.edgeFunction(worldA, worldB, worldC);

            let p = [0, 0] // define down here to avoid recreating it for each pixel (for memory)
            let color = new Float64Array(4) // also created here for performance
            let pixelVertexAttributes: Float64Array[] = []

            // [vertexAttribute][vertex]
            let faceVertexAttributes = [
                vertexAttributes[face[0]],
                vertexAttributes[face[1]],
                vertexAttributes[face[2]],
            ]

            if (vertexAttributes.length) {
                let vas = vertexAttributes[face[0]]
                for (let va in vas) {
                    let length = vas[va].length
                    pixelVertexAttributes.push(new Float64Array(length))
                }
            }

            for (let i in face) {
                let vertex = transformedVertices[face[i]]
                let vas = vertexAttributes[face[i]]

                for (let va of vas) {
                    for (let element in va) va[element] /= vertex[2]; // for perspective correction
                }
            }

            for (let y = tl[1]; y < br[1]; y++) {
                for (let x = tl[0]; x < br[0]; x++) {
                    const worldCoords: number[] = screenToWorld([x, y])
                    if (!this.triangleContains(worldCoords, vertexA, vertexB, vertexC)) continue;

                    p[0] = x, p[1] = y;
                    let w0 = this.edgeFunction(screenVertexB, screenVertexC, p);
                    let w1 = this.edgeFunction(screenVertexC, screenVertexA, p);
                    let w2 = this.edgeFunction(screenVertexA, screenVertexB, p);

                    if (x < 0 || y < 0 || x >= this.width || y >= this.height) continue;

                    w0 /= area, w1 /= area, w2 /= area;

                    const z = 1 / (w0 * inverseZA[2] + w1 * inverseZB[2] + w2 * inverseZC[2]);

                    // apply perspective to vertex attributes
                    const ws = [w0, w1, w2]
                    for (let i = 0; i < pixelVertexAttributes.length; i++) {
                        let attribute = pixelVertexAttributes[i]
                        if (i == 0) { // clear it from last time if this is the first vertex being counted
                            for (let element in attribute) attribute[element] = 0;
                        }
                        for (let vertex in faceVertexAttributes) {
                            for (let element in attribute) {
                                attribute[element] += faceVertexAttributes[vertex][i][element] * ws[element] * z;
                            }
                        }
                    }

                    shader(color, ...pixelVertexAttributes)
                    renderBuffer.setElement(x, y, color);
                }
            }
        }
    }

    calculateBoundingBox(vertexA: number[], vertexB: number[], vertexC: number[]): number[][] {
        let tl: number[] = [...vertexA];
        let br: number[] = [...vertexA];

        if (vertexB[0] < tl[0]) {
            tl[0] = vertexB[0]
        }

        if (vertexB[0] > br[0]) {
            br[0] = vertexB[0]
        }

        if (vertexB[1] < tl[1]) {
            tl[1] = vertexB[1]
        }

        if (vertexB[1] > br[1]) {
            br[1] = vertexB[1]
        }

        if (vertexC[0] < tl[0]) {
            tl[0] = vertexC[0]
        }

        if (vertexC[0] > br[0]) {
            br[0] = vertexC[0]
        }

        if (vertexC[1] < tl[1]) {
            tl[1] = vertexC[1]
        }

        if (vertexC[1] > br[1]) {
            br[1] = vertexC[1]
        }

        tl[0] = Math.floor(tl[0])
        tl[1] = Math.floor(tl[1])
        br[0] = Math.floor(br[0])
        br[1] = Math.floor(br[1])

        return [tl, br]
    }

    triangleContains(p: number[], v0: number[], v1: number[], v2: number[]): boolean {
        const denominator = ((v1[1] - v2[1]) * (v0[0] - v2[0]) + (v2[0] - v1[0]) * (v0[1] - v2[1]));

        const a = ((v1[1] - v2[1]) * (p[0] - v2[0]) + (v2[0] - v1[0]) * (p[1] - v2[1])) / denominator;
        const b = ((v2[1] - v0[1]) * (p[0] - v2[0]) + (v0[0] - v2[0]) * (p[1] - v2[1])) / denominator;
        const c = 1 - a - b;

        return a >= 0 && a <= 1 && b >= 0 && b <= 1 && c >= 0 && c <= 1;
    }

    edgeFunction(a: number[], b: number[], c: number[]): number {
        return (c[0] - a[0]) * (b[1] - a[1]) - (c[1] - a[1]) * (b[0] - a[0]);
    }
}