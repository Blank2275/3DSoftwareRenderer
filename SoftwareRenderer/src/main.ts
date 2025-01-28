import './style.css'
import {Buffer} from "./Buffer.ts";
import {Rasterizer} from "./Rasterizer/Rasterizer.ts";
import {Mesh} from "./Rasterizer/Mesh.ts";
import {abs, cross, dot, norm, sub, Vector} from "./Math/Vector.ts";


function testShader(output: Float64Array, vertices: Vector[], faceAttriubutes: Float64Array[], _vertexAttributes: Float64Array[]) {
    const vecA: Vector = vertices[0];
    const vecB: Vector = vertices[1];
    const vecC: Vector = vertices[2];
    // the normal vector of this face is the cross product of vectors AB and AC
    const AB: Vector = sub(vecA, vecB);
    const AC: Vector = sub(vecA, vecC);
    const normal = norm(cross(AB, AC));

    const lightDirection: Vector = [0, -1, 0];
    const directionalIntensity = 0.8;
    const ambient = 0.4;
    const directional: number = Math.max(dot(normal, lightDirection), 0) * directionalIntensity;
    const brightness = directional + ambient;

    const color = faceAttriubutes[0]
    let r = color[0] * brightness;
    let g = color[1] * brightness;
    let b = color[2] * brightness;

    // uncomment to see normals as a color
    // r = (normal[0] + 1) / 2;
    // g = (normal[1] + 1) / 2;
    // b = (normal[2] + 1) / 2;

    output[0] = r
    output[1] = g
    output[2] = b
    output[3] = 1
}

function renderBuffer(buffer: Buffer, context: CanvasRenderingContext2D) {
    const imageData = context.getImageData(0, 0, buffer.width, buffer.height);

    for (let i = 0; i < imageData.data.length; i++) {
        imageData.data[i] = Math.max(Math.min(buffer.values[i] * 255, 255), 0);
    }

    context.putImageData(imageData, 0, 0);
}

window.onload = function () {
    let canvas: HTMLCanvasElement | null = document.getElementById("canvas") as (HTMLCanvasElement | null);
    if (!canvas) return;

    const width = 300;
    const height = 200;

    canvas.width = width;
    canvas.height = height;

    let ctx = canvas.getContext("2d")
    if (!ctx) return;

    const loopContext = {
        ctx,
        lastRunTime: new Date().getTime(),
        fpsDisplay: document.getElementById("fps"),
        rasterizer: new Rasterizer(width, height, 70, 0.1, 1000),
        renderBuffer: new Buffer(width, height, 4),
        animate: function () {
            ctx.clearRect(0, 0, width, height)
            this.rasterizer.clear()

            const vertices: Vector[] = [
                [-1, -1, -1],
                [1, -1, -1],
                [1, 1, -1],
                [-1, 1, -1],
                [-1, -1, 1],
                [1, -1, 1],
                [1, 1, 1],
                [-1, 1, 1],
            ]

            let faces: number[][] = [
                [1, 3, 2], // back
                [1, 0, 3],
                [0, 4, 7], // left
                [0, 7, 3],
                [5, 1, 2], // right
                [5, 2, 6],
                [0, 1, 5], // top
                [0, 5, 4],
                [7, 6, 2], // bottom
                [7, 2, 3],
                [4, 5, 6], // front
                [4, 6, 7],
            ]

            let vertexAttriubtes: Float64Array[][] = [
                // [new Float64Array([1, 0, 0])],
                // [new Float64Array([0, 1, 0])],
                // [new Float64Array([0, 0, 1])],
                // [new Float64Array([1, 0, 0])],
                // [new Float64Array([0, 1, 0])],
                // [new Float64Array([0, 0, 1])],
                // [new Float64Array([1, 0, 0])],
                // [new Float64Array([0, 1, 0])],
            ]

            let faceAttributes: Float64Array[][] =  [
                [new Float64Array([0.8, 0.1, 0.1])], // back - red
                [new Float64Array([0.8, 0.1, 0.1])],
                [new Float64Array([0.1, 0.1, 0.8])], // left - blue
                [new Float64Array([0.1, 0.1, 0.8])],
                [new Float64Array([0.1, 0.8, 0.1])], // right - green
                [new Float64Array([0.1, 0.8, 0.1])],
                [new Float64Array([0.8, 0.1, 0.8])], // top - purple
                [new Float64Array([0.8, 0.1, 0.8])],
                [new Float64Array([0.8, 0.1, 0.8])], // bottom - orange?
                [new Float64Array([0.8, 0.1, 0.8])],
                [new Float64Array([0.1, 0.8, 0.8])], // front - cyan
                [new Float64Array([0.1, 0.8, 0.8])],

            ]

            const mesh = new Mesh(vertices, faces, vertexAttriubtes, faceAttributes)

            const t = new Date().getTime() / 10000 * Math.PI * 2;
            mesh.translate(0, Math.sin(t) * 2, 5)
            mesh.rotate(0, t, 0)
            mesh.rotate(t / 3, 0, 0);


            this.rasterizer.render(mesh, testShader)
            renderBuffer(this.rasterizer.renderBuffer, this.ctx);

            if (!this.fpsDisplay) return;

            const now = new Date().getTime();
            const delta = now - this.lastRunTime;
            const fps = 1000 / delta
            this.fpsDisplay.innerHTML = `FPS: ${Math.round(fps)}`
            this.lastRunTime = now;

            requestAnimationFrame(this.animate.bind(this));
        }
    }

    loopContext.animate()
}

