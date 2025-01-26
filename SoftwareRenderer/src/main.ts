import './style.css'
import {Buffer} from "./Buffer.ts";
import {Shader} from "./Shader.ts";
import {Rasterizer} from "./Rasterizer/Rasterizer.ts";
import {Matrices} from "./Rasterizer/Matrix.ts";
import {Mesh} from "./Rasterizer/Mesh.ts";

function testShader(output: Float64Array, color: Float64Array) {
    let r = color[0];
    let g = color[1];
    let b = color[2];

    output[0] = r
    output[1] = g
    output[2] = b
    output[3] = 1
}

function applyShaderGlobal(buffer: Buffer, shader: Shader) {
    const input = new Float64Array(4)

    let t = new Date().getTime() / 1000
    for (let x = 0; x < buffer.width; x++) {
        for (let y = 0; y < buffer.height; y++) {
            let normalizedX = x / buffer.width;
            let normalizedY = y / buffer.height;

            shader(input, normalizedX, normalizedY, t);
            buffer.setElement(x, y, input);
        }
    }
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
            this.renderBuffer.clear();
            ctx.clearRect(0, 0, width, height)

            const vertices: number[][] = [
                [1, -1, 0],
                [-1, -1, 0],
                [0, 1, 0],
            ]

            let faces: number[][] = [
                [2, 1, 0],
            ]

            let vertexAttriubtes: Float64Array[][] = [
                [new Float64Array([1, 0, 0])],
                [new Float64Array([0, 1, 0])],
                [new Float64Array([0, 0, 1])],
            ]

            const mesh = new Mesh(vertices, faces, vertexAttriubtes)

            const theta = new Date().getTime() / 5000 * Math.PI * 2;
            mesh.translate(0, 0, 2)
            mesh.rotate(0, theta, 0)


            this.rasterizer.render(mesh, this.renderBuffer, testShader)
            renderBuffer(this.renderBuffer, this.ctx);

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

