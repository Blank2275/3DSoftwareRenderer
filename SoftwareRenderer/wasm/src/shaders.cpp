#include "shaders.h"

void testShader(uint8_t *color, double *position, double *faceAttributes, double *vertexAttributes) {
    double textureX = vertexAttributes[0] + 1 / 2;
    double textureY = vertexAttributes[1] + 1 / 2;
    bool checkerboardX = abs(std::fmod(textureX, 1)) > 0.5;
    bool checkerboardY = abs(std::fmod(textureY, 1)) > 0.5;
    bool checkerboard = checkerboardY ^ checkerboardX;
    color[0] = checkerboard ? 30 : 230;
    color[1] = checkerboard ? 90 : 245;
    color[2] = checkerboard ? 180 : 250;
}