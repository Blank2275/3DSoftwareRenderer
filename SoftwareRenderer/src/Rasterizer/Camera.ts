import {Vector} from "../Math/Vector.ts";
import {Matrices, Matrix} from "../Math/Matrix.ts";

export class Camera {
    rotation: Vector;
    position: Vector;
    aspectRatio: number;
    near: number;
    far: number;
    fov: number;
    projectionMatrix: Matrix;

    constructor(fov: number, aspectRatio: number, near: number, far: number) {
        this.projectionMatrix = Matrices.Zeros();
        this.rotation = [0, 0, 0];
        this.position = [0, 0, 0];

        this.fov = fov;
        this.aspectRatio = aspectRatio;
        this.near = near;
        this.far = far;

        this.recalculateProjectionMatrix();
    }

    /*
    regenerates the projection matrix when its values have changed, must be called manually, does not need to be called
    when the camera is moved or rotated, that is not handled by the projection matrix
     */
    recalculateProjectionMatrix() {
        this.projectionMatrix = Matrices.Perspective(this.fov, this.near, this.far, this.aspectRatio);
        console.log(this.projectionMatrix)
    }

    /*
    Transforms points based on camera position and rotation, does not perspective project
     */
    transformVertices(vertices: Vector[]) {
        const pos: Vector = this.position;
        const translatedVertices = vertices.map(vertex => [vertex[0] - pos[0], vertex[1] - pos[1], vertex[2] - pos[2]] as Vector);

        const rot: Vector = this.rotation;
        const rotationMatrix = Matrices.Rotation(rot[0], rot[1], rot[2]);
        return rotationMatrix.multiplyVectors(translatedVertices);
    }

    /*
    Projects points using existing perspective projection matrix, this does not take into account the cameras position
    or rotation, it assumes you have already called transformPoints
     */
    projectVertices(vertices: Vector[]) {
        return this.projectionMatrix.multiplyVectors(vertices);
    }
}