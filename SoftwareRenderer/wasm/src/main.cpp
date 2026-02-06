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
bool triangleContains(Vector p, Vector v0, Vector v1, Vector v2);
int iround(double value);
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

    // logic to check in triangle from https://web.archive.org/web/20050408192410/http://sw-shader.sourceforge.net/rasterizer.html
    const int Y1 = iround(16.0f * screenVertexA[1]);
    const int Y2 = iround(16.0f * screenVertexB[1]);
    const int Y3 = iround(16.0f * screenVertexC[1]);

    const int X1 = iround(16.0f * screenVertexA[0]);
    const int X2 = iround(16.0f * screenVertexB[0]);
    const int X3 = iround(16.0f * screenVertexC[0]);

    // Deltas
    const int DX12 = X1 - X2;
    const int DX23 = X2 - X3;
    const int DX31 = X3 - X1;

    const int DY12 = Y1 - Y2;
    const int DY23 = Y2 - Y3;
    const int DY31 = Y3 - Y1;

    // Fixed-point deltas
    const int FDX12 = DX12 << 4;
    const int FDX23 = DX23 << 4;
    const int FDX31 = DX31 << 4;

    const int FDY12 = DY12 << 4;
    const int FDY23 = DY23 << 4;
    const int FDY31 = DY31 << 4;

    int minx = (std::min(X1, std::min(X2, X3)) + 0xF) >> 4;
    int maxx = (std::max(X1, std::max(X2, X3)) + 0xF) >> 4;
    int miny = (std::min(Y1, std::min(Y2, Y3)) + 0xF) >> 4;
    int maxy = (std::max(Y1, std::max(Y2, Y3)) + 0xF) >> 4;

    // Half-edge constants
    int C1 = DY12 * X1 - DX12 * Y1;
    int C2 = DY23 * X2 - DX23 * Y2;
    int C3 = DY31 * X3 - DX31 * Y3;

    // Correct for fill convention
    if(DY12 < 0 || (DY12 == 0 && DX12 > 0)) C1++;
    if(DY23 < 0 || (DY23 == 0 && DX23 > 0)) C2++;
    if(DY31 < 0 || (DY31 == 0 && DX31 > 0)) C3++;

    int CY1 = C1 + DX12 * (miny << 4) - DY12 * (minx << 4);
    int CY2 = C2 + DX23 * (miny << 4) - DY23 * (minx << 4);
    int CY3 = C3 + DX31 * (miny << 4) - DY31 * (minx << 4);

    for (int y = miny; y < maxy; y++) {
        if (y < 0 || y >= height) {
            CY1 += FDX12;
            CY2 += FDX23;
            CY3 += FDX31;
            continue;
        }

        int CX1 = CY1;
        int CX2 = CY2;
        int CX3 = CY3;
        for (int x = minx; x < maxx; x++) {
            Vector worldCoords = {static_cast<double>(x), static_cast<double>(y), 0};
            screenToWorld(worldCoords, width, height, aspectRatio);

            if (x < 0 || x >= width) {
                CX1 -= FDY12;
                CX2 -= FDY23;
                CX3 -= FDY31;
                continue;
            }

            if(CX1 > 0 && CX2 > 0 && CX3 > 0)
            {
                size_t renderBufferIndex = y * width * 4 + x * 4;
                renderBuffer[renderBufferIndex + 0] = 30;
                renderBuffer[renderBufferIndex + 1] = 100;
                renderBuffer[renderBufferIndex + 2] = 255;
                renderBuffer[renderBufferIndex + 3] = 255;
            }

            CX1 -= FDY12;
            CX2 -= FDY23;
            CX3 -= FDY31;
        }

        CY1 += FDX12;
        CY2 += FDX23;
        CY3 += FDX31;
    }
}

bool triangleContains(Vector p, Vector v0, Vector v1, Vector v2) {
    double denominator = ((v1[1] - v2[1]) * (v0[0] - v2[0]) + (v2[0] - v1[0]) * (v0[1] - v2[1]));

    double a = ((v1[1] - v2[1]) * (p[0] - v2[0]) + (v2[0] - v1[0]) * (p[1] - v2[1])) / denominator;
    double b = ((v2[1] - v0[1]) * (p[0] - v2[0]) + (v0[0] - v2[0]) * (p[1] - v2[1])) / denominator;
    double c = 1 - a - b;

    return a >= 0 && a <= 1 && b >= 0 && b <= 1 && c >= 0 && c <= 1;
}

int iround(double value) {
    return static_cast<int>(value + 0.5f - (value < 0.0)); // simple rounding
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