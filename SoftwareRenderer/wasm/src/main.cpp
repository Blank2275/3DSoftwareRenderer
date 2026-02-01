#include <iostream>
#include <emscripten/bind.h>

using namespace emscripten;

void helloWorld() {
    std::cout<<"Print :)"<<std::endl;
}

void passArray(const emscripten::val &floatArrayObject) {
    unsigned int length = floatArrayObject["length"].as<unsigned int>();
    std::vector<double> floatArray;
    floatArray.resize(length);
    auto memory = emscripten::val::module_property("HEAPU8")["buffer"];
    auto memoryView = floatArrayObject["constructor"].new_(memory, reinterpret_cast<uintptr_t>(floatArray.data()), length);
    memoryView.call<void>("set", floatArrayObject);

    for (auto &floatValue : floatArray) {
        std::cout << floatValue << ", ";
    }
    std::cout << std::endl;
}

int main() {
    std::cout<<"Hello Wasm!"<<std::endl;
    return 0;
}

EMSCRIPTEN_BINDINGS(render_module) {
    function("helloWorld", &helloWorld);
    function("test", &passArray);
}