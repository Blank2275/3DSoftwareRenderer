import './style.css'
import {Buffer} from "./Buffer.ts";
import {Rasterizer} from "./Rasterizer/Rasterizer.ts";
import {Mesh} from "./Rasterizer/Mesh.ts";
import {add, dot, fromF64, norm, sub, Vector} from "./Math/Vector.ts";
import {Camera} from "./Rasterizer/Camera.ts";

// sets color to the first face attribute and applies some simple lighting from above and to the right
function testShader(output: Float64Array, position: Vector, faceAttriubutes: Float64Array[], _vertexAttributes: Float64Array[], globals: Float64Array[]) {
    const normal = fromF64(faceAttriubutes[1])

    const pointLights = globals[0];
    const ambient = globals[1];
    const lighting = [0, 0, 0];

    // point lights
    for (let i = 0; i < pointLights.length; i += 6) {
        const lightPosition: Vector = [pointLights[i + 0], pointLights[i + 1], pointLights[i + 2]];
        const direction = norm(sub(lightPosition, position));
        const brightness = Math.max(dot(normal, direction), 0);
        const color = [pointLights[i + 3], pointLights[i + 4], pointLights[i + 5]];

        lighting[0] += color[0] * brightness;
        lighting[1] += color[1] * brightness;
        lighting[2] += color[2] * brightness;
    }

    lighting[0] += ambient[0];
    lighting[1] += ambient[1];
    lighting[2] += ambient[2];

    const color = faceAttriubutes[0]
    let r = color[0] * lighting[0];
    let g = color[1] * lighting[1];
    let b = color[2] * lighting[2];

    // uncomment to see normals as a color
    // r = (normal[0] + 1) / 2;
    // g = (normal[1] + 1) / 2;
    // b = (normal[2] + 1) / 2;

    output[0] = r
    output[1] = g
    output[2] = b
    output[3] = 1
}

// renders a buffer with dims = 4 to a canvas context
function renderBuffer(buffer: Buffer, context: CanvasRenderingContext2D) {
    const imageData = context.getImageData(0, 0, buffer.width, buffer.height);

    for (let i = 0; i < imageData.data.length; i++) {
        imageData.data[i] = Math.max(Math.min(buffer.values[i] * 255, 255), 0);
    }

    context.putImageData(imageData, 0, 0);
}

//
function createPointLights(camera: Camera, locations: Vector[], colors: number[][]) {
    locations = camera.transformVertices(locations); // account for camera position

    const lights: Float64Array = new Float64Array(locations.length * 6); //  number of lights times size of light (3 numbers for position 3 for color)
    for(let light = 0; light < locations.length; light++) {
        lights[light * 6 + 0] = locations[light][0]
        lights[light * 6 + 1] = locations[light][1]
        lights[light * 6 + 2] = locations[light][2]
        lights[light * 6 + 3] = colors[light][0]
        lights[light * 6 + 4] = colors[light][1]
        lights[light * 6 + 5] = colors[light][2]
    }

    return lights;
}

function generateMovementVector(theta: number, movementSpeed: number): Vector {
    const vec: Vector = [0, 0, 0];
    vec[0] = Math.sin(-theta) * movementSpeed;
    vec[2] = Math.cos(-theta) * movementSpeed;
    return vec;
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

    const keys: {[key: string]: boolean} = {};

    const loopContext = {
        ctx,
        lastRunTime: new Date().getTime(),
        fpsDisplay: document.getElementById("fps"),
        rasterizer: new Rasterizer(width, height),
        camera: new Camera(70, 0.1, 1000),
        renderBuffer: new Buffer(width, height, 4),
        position: [0, 0, -10],
        rotation: [0, 0, 0],
        rotationSpeed: 0.05,
        movementSpeed: 0.1,
        animate: function () {
            ctx.clearRect(0, 0, width, height);
            this.rasterizer.clear();

            // const vertices: Vector[] = [
            //     [-1, -1, 0],
            //     [1, -1, 0],
            //     [0, 1, 0]
            // ];
            //
            // const faces: number[][] = [
            //     [0, 1, 2]
            // ];
            //
            // const faceAttributes: Float64Array[][] = [];
            // const vertexAttributes: Float64Array[][] = [
            //     [
            //         new Float64Array([0.8, 0.1, 0.1]),
            //         new Float64Array([0.1, 0.8, 0.1]),
            //         new Float64Array([0.1, 0.1, 0.8])
            //     ]
            // ];

            // defines vertices and faces of our cube
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
                [7, 6, 2], // top
                [7, 2, 3],
                [0, 1, 5], // bottom
                [0, 5, 4],
                [4, 5, 6], // front
                [4, 6, 7],
            ]

            let faceColors: Float64Array[] =  [
                new Float64Array([0.8, 0.1, 0.1]), // back - red
                new Float64Array([0.8, 0.1, 0.1]),
                new Float64Array([0.1, 0.1, 0.8]), // left - blue
                new Float64Array([0.1, 0.1, 0.8]),
                new Float64Array([0.1, 0.8, 0.1]), // right - green
                new Float64Array([0.1, 0.8, 0.1]),
                new Float64Array([0.8, 0.1, 0.8]), // top - purple
                new Float64Array([0.8, 0.1, 0.8]),
                new Float64Array([0.8, 0.8, 0.1]), // bottom - yellow
                new Float64Array([0.8, 0.8, 0.1]),
                new Float64Array([0.1, 0.8, 0.8]), // front - cyan
                new Float64Array([0.1, 0.8, 0.8])
            ]

            const mesh = new Mesh(vertices, faces)
            const t = new Date().getTime() / 10000 * Math.PI * 2;
            mesh.translate(0, Math.sin(t) * 2, 5)
            mesh.rotate(0, t, 0)
            mesh.rotate(t / 3, 0, 0);

            //
            // [10, 10, 10] [0.4, 0.4, 0.4]
            const pointLightLocations: Vector[] = [[0, 0, 3.5]];
            const pointLightColors: number[][] = [[0.9, 0.9, 0.9]];
            const pointLights = createPointLights(this.camera, pointLightLocations, pointLightColors);
            const ambientLight = new Float64Array([0.25, 0.25, 0.25]);

            mesh.addFaceAttribute(faceColors);
            mesh.addFaceAttribute(mesh.calculateNormals(this.camera,false));
            mesh.addGlobal(pointLights)
            mesh.addGlobal(ambientLight) // ambient light
            this.rasterizer.render(mesh, this.camera, testShader)

            const groundVertices: Vector[] = [
                [-10, 0, -10],
                [10, 0, -10],
                [10, 0, 10],
                [-10, 0, 10],
            ]

            const groundFaces = [
                [3, 0, 1],
                [3, 1, 2]
            ]

            const groundColors = [
                new Float64Array([0.85, 0.85, 0.85]),
                new Float64Array([0.85, 0.85, 0.85]),
            ]

            const ground = new Mesh(groundVertices, groundFaces);
            ground.translate(0, -4, 0);

            ground.addFaceAttribute(groundColors);
            ground.addFaceAttribute(ground.calculateNormals(this.camera, false));
            ground.addGlobal(pointLights);
            ground.addGlobal(ambientLight);
            this.rasterizer.render(ground, this.camera, testShader)

            renderBuffer(this.rasterizer.renderBuffer, this.ctx);

            // framerate calculation and display code
            if (!this.fpsDisplay) return;

            const now = new Date().getTime();
            const delta = now - this.lastRunTime;
            const fps = 1000 / delta
            this.fpsDisplay.innerHTML = `FPS: ${Math.round(fps)}`
            this.lastRunTime = now;

            // movement
            if (keys["ArrowLeft"]) {
                this.rotation[1] += this.rotationSpeed;
            }

            if (keys["ArrowRight"]) {
                this.rotation[1] -= this.rotationSpeed;
            }

            if (keys["KeyW"]) {
                const movementVector = generateMovementVector(this.rotation[1], this.movementSpeed);
                this.position = add(this.position as Vector, movementVector);
            }

            if (keys["KeyS"]) {
                const movementVector = generateMovementVector(this.rotation[1] + Math.PI, this.movementSpeed);
                this.position = add(this.position as Vector, movementVector);
            }

            if (keys["KeyA"]) {
                const movementVector = generateMovementVector(this.rotation[1] + Math.PI / 2, this.movementSpeed);
                this.position = add(this.position as Vector, movementVector);
            }

            if (keys["KeyD"]) {
                const movementVector = generateMovementVector(this.rotation[1] + Math.PI * 3 / 2, this.movementSpeed);
                this.position = add(this.position as Vector, movementVector);
            }

            if (keys["Space"]) {
                this.position[1] += this.movementSpeed
            }

            if (keys["ShiftLeft"]) {
                this.position[1] -= this.movementSpeed;
            }

            this.rotation[0] = Math.max(Math.min(this.rotation[0], Math.PI / 2), -Math.PI / 2)

            this.camera.position = this.position as Vector;
            this.camera.rotation = this.rotation as Vector;

            requestAnimationFrame(this.animate.bind(this));
        }
    }

    loopContext.animate()

    // movement
    document.body.addEventListener("keydown", (e) => {
        keys[e.code] = true;
    })

    document.body.addEventListener("keyup", (e) => {
        keys[e.code] = false;
    })
}

