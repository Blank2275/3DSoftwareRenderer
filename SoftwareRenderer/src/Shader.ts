import {Vector} from "./Math/Vector.ts";

export type Shader =  (output: Float64Array, position: Vector, faceAttributes: Float64Array[], vertexAttributes: Float64Array[], globals: Float64Array[]) => void