import './style.css'
import {Buffer} from "./Buffer.ts";
import {Rasterizer} from "./Rasterizer/Rasterizer.ts";
import {Mesh} from "./Rasterizer/Mesh.ts";
import {Vector} from "./Math/Vector.ts";

function testShader(output: Float64Array, faceAttriubutes: Float64Array[], vertexAttributes: Float64Array[]) {
    const color = faceAttriubutes[0]
    let r = color[0];
    let g = color[1];
    let b = color[2];

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
                [0, 1, 3], // back
                [1, 2, 3],
                [0, 3, 4], // left
                [3, 4, 7],
                [1, 2, 5], // right
                [2, 5, 6],
                [0, 1, 5], // top
                [0, 4, 5],
                [2, 3, 6], // bottom
                [3, 6, 7],
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
                [new Float64Array([0.1, 0.8, 0.8])], // bottom - yellow or orange?
                [new Float64Array([0.1, 0.8, 0.8])],
                [new Float64Array([0.1, 0.8, 0.8])], // front - cyan
                [new Float64Array([0.1, 0.8, 0.8])],

            ]

            const mesh = new Mesh(vertices, faces, vertexAttriubtes, faceAttributes)

            const theta = new Date().getTime() / 5000 * Math.PI * 2;
            mesh.translate(0, 0, 5)
            mesh.rotate(0, theta, 0)
            mesh.rotate(theta / 2, 0, 0);


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

