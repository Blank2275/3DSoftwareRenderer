import {Matrices} from "../Math/Matrix.ts";
import {Vector} from "../Math/Vector.ts";

export class Mesh {
    originalVertices: Vector[]
    vertices: Vector[]
    faces: number[][]
    vertexAttributes: Float64Array[][]
    faceAttributes: Float64Array[][]

    rotation: number[]
    position: number[]

    constructor(vertices: Vector[], faces: number[][], vertexAttributes?: Float64Array[][], faceAttriubutes?: Float64Array[][]) {
        this.originalVertices = [...vertices];
        this.vertices = [...vertices];
        this.faces = faces;
        this.vertexAttributes = vertexAttributes ?? [];
        this.faceAttributes = faceAttriubutes ?? [];

        this.rotation = [0, 0, 0];
        this.position = [0, 0, 0];

    }

    reset() {
        this.vertices = this.originalVertices;
    }

    rotate(x: number, y: number, z: number) {
        this.rotation[0] += x;
        this.rotation[1] += y;
        this.rotation[2] += z;

        this.applyTranslations()
    }

    setRotation(x: number, y: number, z: number) {
        this.rotation = [x, y, z]
        this.applyTranslations()
    }

    translate(x: number, y: number, z: number) {
        this.position[0] += x;
        this.position[1] += y;
        this.position[2] += z;

        this.applyTranslations()
    }

    setPosition(x: number, y: number, z: number) {
        this.position = [x, y, z]
        this.applyTranslations()
    }

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