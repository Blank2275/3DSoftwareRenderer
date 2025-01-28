# 3D Software Renderer

## What is it?
It is my attempt at replicating (at least part of) the 3d graphics pipeline purely on the cpu, it is not meant for practical use, it is far too slow, it is primarily to help me learn and for fun.

## Resources/Credit
- I relied heavily on [scratchapixel](scratchapixel.com) to learn how to do perspective division, rasterization, and vertex attributes
- - [rasterization](https://www.scratchapixel.com/lessons/3d-basic-rendering/rasterization-practical-implementation/perspective-correct-interpolation-vertex-attributes.html)
  - [perspective projection matrix](https://www.scratchapixel.com/lessons/3d-basic-rendering/perspective-and-orthographic-projection-matrix/building-basic-perspective-projection-matrix.html)
- I used [wikipedia rotation matrices](https://en.wikipedia.org/wiki/Rotation_matrix) to find rotation matrices  
- I recommend [wikipedia barycentric coordinates](https://en.wikipedia.org/wiki/Barycentric_coordinate_system) 
- The current version of Rasterizer class triangleContains is written by claude
  
## Future
This project is not complete, I want to load some interesting models and clean up the code, possibly experiment with web workers for rendering.

## Images
<img width="1709" alt="Screenshot 2025-01-26 at 11 15 57 AM" src="https://github.com/user-attachments/assets/52ca7f14-9235-47c6-9105-8bde3b624736" />
