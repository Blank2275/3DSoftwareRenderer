#include <iostream>
#include <emscripten/bind.h>

using namespace emscripten;

void helloWorld() {
    std::cout<<"Print :)"<<std::endl;
}

void passArray(uintptr_t ptr, size_t length) {
    double *arr = reinterpret_cast<double*>(ptr);
    for (int i = 0; i < length; i++) {
        arr[i] *= 2;
    }
}

void render(uintptr_t renderBufferPtr, uintptr_t depthBufferPtr, size_t width, size_t height, uintptr_t worldVerticesPtr, uintptr_t transformedVerticesPtr, uintptr_t faceAttributesDoublePtr, size_t numFaceAttributes, uintptr_t vertexAttributesDoublePtr, size_t vertexAttributesSize) {
    double *renderBuffer = reinterpret_cast<double*>(renderBufferPtr);
    double *depthBuffer = reinterpret_cast<double*>(depthBufferPtr);
    double *worldVerticesArray = reinterpret_cast<double*>(worldVerticesPtr);
    double *transformedVerticesArray = reinterpret_cast<double*>(transformedVerticesPtr);
    double **faceAttributes = reinterpret_cast<double**>(faceAttributesDoublePtr);
    double **vertexAttributes = reinterpret_cast<double**>(vertexAttributesDoublePtr);
}

int main() {
    std::cout<<"Hello Wasm!"<<std::endl;
    return 0;
}

EMSCRIPTEN_BINDINGS(render_module) {
    function("helloWorld", &helloWorld);
    function("test", &passArray);
    function("render", &render);
}