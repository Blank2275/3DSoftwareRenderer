import {sub, Vector} from "../Math/Vector.ts";
import {Matrices, Matrix} from "../Math/Matrix.ts";

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
}