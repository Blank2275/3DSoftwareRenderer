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

int main() {
    std::cout<<"Hello Wasm!"<<std::endl;
    return 0;
}

EMSCRIPTEN_BINDINGS(render_module) {
    function("helloWorld", &helloWorld);
    function("test", &passArray);
}