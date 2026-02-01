wasm:
	emcc -lembind -o ../src/WasmBindings/renderer.mjs --emit-tsd renderer.d.ts src/main.cpp -s EXPORT_ES6=1 -s "EXPORT_NAME=RendererModule" -s ALLOW_MEMORY_GROWTH=0 --bind -O3 -sEXPORTED_RUNTIME_METHODS=ccall,cwrap,HEAP8,HEAPU8
