import {sub, add, mul, Vector, dot} from "../Math/Vector.ts";
import {Matrices, Matrix} from "../Math/Matrix.ts";

interface Plane {
    normal: Vector;
    D: number;
}

interface ClippedScene {
    vertices: Vector[],
    faces: number[][],
}

// contains information about the cameras position and rotation,
// it also transforms vertices accordingly and applies perspective projection
export class Camera {
    rotation: Vector;
    position: Vector;
    near: number;
    far: number;
    fov: number;
    projectionMatrix: Matrix;

    constructor(fov: number, near: number, far: number) {
        this.projectionMatrix = Matrices.Zeros();
        this.rotation = [0, 0, 0];
        this.position = [0, 0, 0];

        this.fov = fov;
        this.near = near;
        this.far = far;

        this.recalculateProjectionMatrix();
    }

    /*
    regenerates the projection matrix when its values have changed, must be called manually, does not need to be called
    when the camera is moved or rotated, that is not handled by the projection matrix
     */
    recalculateProjectionMatrix() {
        this.projectionMatrix = Matrices.Perspective(this.fov, this.near, this.far);

    }

    /*
    Transforms points based on camera position and rotation, does not perspective project
     */
    transformVertices(vertices: Vector[]) {
        const translatedVertices = vertices.map(vertex => sub(vertex, this.position) as Vector);

        const rot: Vector = this.rotation;
        const rotationMatrix = Matrices.Rotation(-rot[0], -rot[1], -rot[2]);
        return rotationMatrix.multiplyVectors(translatedVertices);
    }

    // trannsforms direction vectors, does not translate but only rotates direction vectors to match camera
    // assumes all vectors start at the origin
    transformDirectionVectors(vectors: Vector[]) {
        const rot: Vector = this.rotation;
        const rotationMatrix = Matrices.Rotation(-rot[0], -rot[1], -rot[2]);
        return rotationMatrix.multiplyVectors(vectors);
    }

    /*
    Projects points using existing perspective projection matrix, this does not take into account the cameras position
    or rotation, it assumes you have already called transformPoints
     */
    projectVertices(vertices: Vector[]): Vector[] {
        const tempVertices: Vector[] = [];

        vertices.forEach((vertex) => {
            if (Math.abs(vertex[2]) < Number.EPSILON) vertex[2] = 0.00001; // handle edge case where we divide by 0 in perspective division
            tempVertices.push([vertex[0], vertex[1], Math.abs(vertex[2])])
        })

        const projectedVertices = this.projectionMatrix.multiplyVectors(tempVertices);

        // when one or more vertices are behind the camera they appear to blow up as they approach 0, this is not seen
        // though when one vertex is negative not near 0, instead it will be flipped causing weird behavior
        // here we divide them by a tiny number so they will appear properly huge (and go offscreen) while
        // preserving slope
        for (let i = 0; i < vertices.length; i++) {
            if (vertices[i][2] < 0.001) {
                projectedVertices[i][0] = vertices[i][0] / 0.000001;
                projectedVertices[i][1] = vertices[i][1] / -0.000001;
                // projectedVertices[i][2] = 0; // to signify that this vertex was negative for proper handling
            }
        }

        return projectedVertices;
    }

    clipVertices(vertices: Vector[], faces: number[][]): ClippedScene {
        let invsqrt2 = 1 / Math.sqrt(2);
        const planes: Plane[] = [
            { // near
                normal: [0, 0, 1],
                D: this.near
            },
            { // left
                normal: [invsqrt2, 0, invsqrt2],
                D: 0
            },
            { // right
                normal: [-invsqrt2, 0, invsqrt2],
                D: 0
            },
            { // bottom
                normal: [0, invsqrt2, invsqrt2],
                D: 0
            },
            { // left
                normal: [0, -invsqrt2, invsqrt2],
                D: 0
            }
        ];

        let newVertices: Vector[] = []
        for (let face of faces) {
            newVertices.push(vertices[face[0]], vertices[face[1]], vertices[face[2]]);
        }

        for (let plane of planes) {
            const planeClippedVertices: Vector[] = [];
            for (let i = 0; i < newVertices.length; i += 3) {
                let faceVertices = [newVertices[i], newVertices[i + 1], newVertices[i + 2]];
                planeClippedVertices.push(...this.clipTriangleAgainstPlane(faceVertices, plane));
            }
            newVertices = planeClippedVertices;
        }

        // generate new indices
        const newIndices: number[][] = [];
        for (let i = 0; i < newVertices.length; i += 3) {
            newIndices.push([i, i + 1, i + 2]);
        }

        return {
            vertices: newVertices,
            faces: newIndices,
        }
    }

    clipTriangleAgainstPlane(faceVertices: Vector[], plane: Plane): Vector[] {
        const d0 = this.signedDistance(plane, faceVertices[0]);
        const d1 = this.signedDistance(plane, faceVertices[1]);
        const d2 = this.signedDistance(plane, faceVertices[2]);

        const d0Sign = Math.max(Math.sign(d0), 0);
        const d1Sign = Math.max(Math.sign(d1), 0);
        const d2Sign = Math.max(Math.sign(d2), 0);
        const numVerticesPositive = d0Sign + d1Sign + d2Sign;

        if (numVerticesPositive === 3) { // all visible
            return faceVertices;
        } else if (numVerticesPositive === 0) { // none visible
            return [];
        } else if (numVerticesPositive === 1) {
            let A: Vector;
            let B: Vector;
            let C: Vector;

            if (d0 > 0) {
                A = faceVertices[0];
                B = faceVertices[1];
                C = faceVertices[2];
            }
            if (d1 > 0) {
                A = faceVertices[1];
                B = faceVertices[2];
                C = faceVertices[0];
            }
            if (d2 > 0) {
                A = faceVertices[2];
                B = faceVertices[0];
                C = faceVertices[1];
            }

            // we know that they must be initialized but the type checker is not smart enough
            //@ts-ignore
            const BPrime = this.intersection(A, B, plane);
            //@ts-ignore
            const CPrime = this.intersection(A, C, plane);

            //@ts-ignore
            return [A, BPrime, CPrime]
        } else {
            let A: Vector;
            let B: Vector;
            let C: Vector;

            if (d0 <= 0) {
                C = faceVertices[0];
                A = faceVertices[1];
                B = faceVertices[2];
            }
            if (d1 <= 0) {
                C = faceVertices[1];
                A = faceVertices[2];
                B = faceVertices[0];
            }
            if (d2 <= 0) {
                C = faceVertices[2];
                A = faceVertices[0];
                B = faceVertices[1];
            }

            // we know that they must be initialized but the type checker is not smart enough
            //@ts-ignore
            const APrime = this.intersection(A, C, plane);
            //@ts-ignore
            const BPrime = this.intersection(B, C, plane);

            //@ts-ignore
            return [A, B, APrime, APrime, B, BPrime]
        }
    }

    signedDistance(plane: Plane, vertex: Vector) {
        const normal = plane.normal;
        return dot(vertex, normal) + plane.D;
    }

    intersection(a: Vector, b: Vector, plane: Plane) {
        const t = (-plane.D - dot(plane.normal, a)) / dot(plane.normal, sub(b, a))
        return add(a, mul(sub(b, a), t));
    }
}