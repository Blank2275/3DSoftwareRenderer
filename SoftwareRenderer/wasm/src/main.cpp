#include <iostream>
#include <algorithm>
#include <emscripten/bind.h>

using namespace emscripten;

typedef double Vector[3];

typedef struct {
    size_t top;
    size_t bottom;
    size_t left;
    size_t right;
} Bounds;

void worldToScreen(Vector vertex, size_t width, size_t height, double aspectRatio);
void screenToWorld(Vector vertex, size_t width, size_t height, double aspectRatio);
Bounds calculateBoundingBox(Vector vertexA, Vector vertexB, Vector vertexC, double width, double height);

void render(uintptr_t renderBufferPtr, uintptr_t depthBufferPtr, size_t width, size_t height, uintptr_t worldVerticesPtr, uintptr_t transformedVerticesPtr, uintptr_t faceAttributesDoublePtr, size_t numFaceAttributes, uintptr_t vertexAttributesDoublePtr, size_t vertexAttributesSize) {
    uint8_t *renderBuffer = reinterpret_cast<uint8_t*>(renderBufferPtr);
    double *depthBuffer = reinterpret_cast<double*>(depthBufferPtr);
    double *worldVerticesArray = reinterpret_cast<double*>(worldVerticesPtr);
    double *transformedVerticesArray = reinterpret_cast<double*>(transformedVerticesPtr);
    double **faceAttributes = reinterpret_cast<double**>(faceAttributesDoublePtr);
    double **vertexAttributes = reinterpret_cast<double**>(vertexAttributesDoublePtr);
    double aspectRatio = static_cast<double>(width) / static_cast<double>(height);

    // the world position of vertices
    Vector worldA = {worldVerticesArray[0], worldVerticesArray[1], worldVerticesArray[2]};
    Vector worldB = {worldVerticesArray[3], worldVerticesArray[4], worldVerticesArray[5]};
    Vector worldC = {worldVerticesArray[6], worldVerticesArray[7], worldVerticesArray[8]};

    // used for interpolating x and y positions per pixel
    Vector interpolateVertexA = {0, 0, 0};
    Vector interpolateVertexB = {0, 0, 0};
    Vector interpolateVertexC = {0, 0, 0};
    interpolateVertexA[0] = worldA[0] / interpolateVertexA[2];
    interpolateVertexA[1] = worldA[1] / interpolateVertexA[2];
    interpolateVertexB[0] = worldB[0] / interpolateVertexB[2];
    interpolateVertexB[1] = worldB[1] / interpolateVertexB[2];
    interpolateVertexC[0] = worldC[0] / interpolateVertexC[2];
    interpolateVertexC[1] = worldC[1] / interpolateVertexC[2];

    // the position of vertices after perspective projection
    Vector vertexA = {transformedVerticesArray[0], transformedVerticesArray[1], transformedVerticesArray[2]};
    Vector vertexB = {transformedVerticesArray[3], transformedVerticesArray[4], transformedVerticesArray[5]};
    Vector vertexC = {transformedVerticesArray[6], transformedVerticesArray[7], transformedVerticesArray[8]};

    double inverseZA = 1 / worldA[2];
    double inverseZB = 1 / worldB[2];
    double inverseZC = 1 / worldC[2];

    Vector screenVertexA = {transformedVerticesArray[0], transformedVerticesArray[1], transformedVerticesArray[2]};
    Vector screenVertexB = {transformedVerticesArray[3], transformedVerticesArray[4], transformedVerticesArray[5]};
    Vector screenVertexC = {transformedVerticesArray[6], transformedVerticesArray[7], transformedVerticesArray[8]};
    worldToScreen(screenVertexA, width, height, aspectRatio);
    worldToScreen(screenVertexB, width, height, aspectRatio);
    worldToScreen(screenVertexC, width, height, aspectRatio);

    // top, bottom, left, right
    Bounds bounds = calculateBoundingBox(screenVertexA, screenVertexB, screenVertexC, width, height);
    size_t top = bounds.top;
    size_t bottom = bounds.bottom;
    size_t left = bounds.left;
    size_t right = bounds.right;

    for (size_t y = top; y < bottom; y++) {
        for (size_t x = left; x < right; x++) {
            size_t renderBufferIndex = y * width * 4 + x * 4;
            renderBuffer[renderBufferIndex + 0] = 255;
            renderBuffer[renderBufferIndex + 1] = 255;
            renderBuffer[renderBufferIndex + 2] = 255;
            renderBuffer[renderBufferIndex + 3] = 255;
        }
    }
}

void clearRenderBuffer(uintptr_t renderBufferPtr, double color, size_t width, size_t height) {
    double *renderBuffer = reinterpret_cast<double*>(renderBufferPtr);
    size_t i = width * height * 4;

    while (--i) {
        renderBuffer[i] = 0;
    }
}

Bounds calculateBoundingBox(Vector vertexA, Vector vertexB, Vector vertexC, double width, double height) {
    double left = vertexA[0];
    double right = vertexA[0];
    double top = vertexA[1];
    double bottom = vertexA[1];

    if (vertexB[0] < left) {
        left = vertexB[0];
    }

    if (vertexB[0] > right) {
        right = vertexB[0];
    }

    if (vertexC[0] < left) {
        left = vertexC[0];
    }

    if (vertexC[0] > right) {
        right = vertexC[0];
    }

    if (vertexB[1] < top) {
        top = vertexB[1];
    }

    if (vertexB[1] > bottom) {
        bottom = vertexB[1];
    }

    if (vertexC[1] < top) {
        top = vertexC[1];
    }

    if (vertexC[1] > bottom) {
        bottom = vertexC[1];
    }

    top = std::max(top, (double) 0);
    left = std::max(left, (double) 0);
    bottom = std::min(bottom, height);
    right = std::min(right, width);

    return Bounds{static_cast<size_t>(top), static_cast<size_t>(bottom), static_cast<size_t>(left), static_cast<size_t>(right)};
}

// converts world to screen coordinates
void worldToScreen(Vector vertex, size_t width, size_t height, double aspectRatio) {
    vertex[0] = (vertex[0] + 1) / 2 * width / aspectRatio;
    vertex[1] = (vertex[1] + 1) / 2 * height;
}

// converts screen to world coordinates
void screenToWorld(Vector vertex, size_t width, size_t height, double aspectRatio) {
    vertex[0] = vertex[0] / width * 2 * aspectRatio - 1;
    vertex[1] = vertex[1] / height * 2 - 1;
}

int main() {
    std::cout<<"Hello Wasm!"<<std::endl;
    return 0;
}

EMSCRIPTEN_BINDINGS(render_module) {
    function("render", &render);
    function("clearRenderBuffer", &clearRenderBuffer);
}