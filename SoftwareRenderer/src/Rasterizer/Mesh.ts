import {Matrices} from "../Math/Matrix.ts";
import {Vector} from "../Math/Vector.ts";

/*
An abstraction, contains all information needed to render a 3d object with functions to move and rotate it
 */
export class Mesh {
    originalVertices: Vector[]
    vertices: Vector[]
    faces: number[][]
    vertexAttributes: Float64Array[][]
    faceAttributes: Float64Array[][]
    globals: Float64Array[]

    rotation: number[]
    position: number[]

    constructor(vertices: Vector[], faces: number[][], vertexAttributes?: Float64Array[][], faceAttriubutes?: Float64Array[][], globals?: Float64Array[]) {
        this.originalVertices = [...vertices];
        this.vertices = [...vertices];
        this.faces = faces;
        this.vertexAttributes = vertexAttributes ?? [];
        this.faceAttributes = faceAttriubutes ?? [];
        this.globals = globals ?? [];

        this.rotation = [0, 0, 0];
        this.position = [0, 0, 0];

    }

    reset() {
        this.vertices = this.originalVertices;
    }

    // rotates by x y z
    rotate(x: number, y: number, z: number) {
        this.rotation[0] += x;
        this.rotation[1] += y;
        this.rotation[2] += z;

        this.applyTranslations()
    }

    // sets rotation to x y z
    setRotation(x: number, y: number, z: number) {
        this.rotation = [x, y, z]
        this.applyTranslations()
    }

    // translates by x y z
    translate(x: number, y: number, z: number) {
        this.position[0] += x;
        this.position[1] += y;
        this.position[2] += z;

        this.applyTranslations()
    }

    // sets position to x y z
    setPosition(x: number, y: number, z: number) {
        this.position = [x, y, z]
        this.applyTranslations()
    }

    // applies translations on originalVertices so that vertices contain the transformed vectors
    applyTranslations() {
        this.reset()

        const rotation = Matrices.Rotation(this.rotation[0], this.rotation[1], this.rotation[2]);
        this.vertices = rotation.multiplyVectors(this.vertices)

        for (let vertex of this.vertices) {
            vertex[0] += this.position[0]
            vertex[1] += this.position[1]
            vertex[2] += this.position[2]
        }
    }
}