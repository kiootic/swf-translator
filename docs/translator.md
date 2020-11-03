SWF translator
==============

This document describes the SWF translator component.

# Architecture Overview

![Architecture Overview](https://mermaid.ink/svg/eyJjb2RlIjoiZ3JhcGggTFJcbiAgICBzd2Zbc3dmIGZpbGVdIC0tPnxwYXJzZXwgdGFnc1tzd2YgdGFnc11cbiAgICB0YWdzIC0uLT4gY2hhcnNbY2hhcmFjdGVyc11cbiAgICBzd2YgLS0tPnxkZWNvbXBpbGVyfCBhYmNbQVMzIGNvZGVdXG5cbiAgICBjaGFycyAtLi0-IGFzc2V0c1tpbWFnZXMsIHNvdW5kcywgZXRjLl1cbiAgICBjaGFycyAtLi0-IHNoYXBlc1tmb250cywgc2hhcGVzLCBldGMuXVxuICAgIGNoYXJzIC0uLT4gc3ByaXRlc1tzcHJpdGVzLCBidXR0b24sIGV0Yy5dXG4gICAgYXNzZXRzIC0tPiB8ZGVjb2Rpbmd8IGFzc2V0ZGF0YVthc3NldCBmaWxlc11cbiAgICBzaGFwZXMgLS0-IHx0ZXNzZWxsYXRpb258IGpzb25bY2hhcmFjdGVyIGpzb25zXVxuICAgIHNwcml0ZXMgLS0-IHx0cmFuc2xhdGlvbnwganNvblxuXG4gICAgYWJjIC0tPiB8cGFyc2V8IGFzdFtBUzMgQVNUXVxuICAgIGFzdCAtLT4gfHRyYW5zbGF0aW9ufCB0c1tUeXBlU2NyaXB0IGNvZGVdIiwibWVybWFpZCI6eyJ0aGVtZSI6ImRlZmF1bHQiLCJ0aGVtZVZhcmlhYmxlcyI6eyJiYWNrZ3JvdW5kIjoid2hpdGUiLCJwcmltYXJ5Q29sb3IiOiIjRUNFQ0ZGIiwic2Vjb25kYXJ5Q29sb3IiOiIjZmZmZmRlIiwidGVydGlhcnlDb2xvciI6ImhzbCg4MCwgMTAwJSwgOTYuMjc0NTA5ODAzOSUpIiwicHJpbWFyeUJvcmRlckNvbG9yIjoiaHNsKDI0MCwgNjAlLCA4Ni4yNzQ1MDk4MDM5JSkiLCJzZWNvbmRhcnlCb3JkZXJDb2xvciI6ImhzbCg2MCwgNjAlLCA4My41Mjk0MTE3NjQ3JSkiLCJ0ZXJ0aWFyeUJvcmRlckNvbG9yIjoiaHNsKDgwLCA2MCUsIDg2LjI3NDUwOTgwMzklKSIsInByaW1hcnlUZXh0Q29sb3IiOiIjMTMxMzAwIiwic2Vjb25kYXJ5VGV4dENvbG9yIjoiIzAwMDAyMSIsInRlcnRpYXJ5VGV4dENvbG9yIjoicmdiKDkuNTAwMDAwMDAwMSwgOS41MDAwMDAwMDAxLCA5LjUwMDAwMDAwMDEpIiwibGluZUNvbG9yIjoiIzMzMzMzMyIsInRleHRDb2xvciI6IiMzMzMiLCJtYWluQmtnIjoiI0VDRUNGRiIsInNlY29uZEJrZyI6IiNmZmZmZGUiLCJib3JkZXIxIjoiIzkzNzBEQiIsImJvcmRlcjIiOiIjYWFhYTMzIiwiYXJyb3doZWFkQ29sb3IiOiIjMzMzMzMzIiwiZm9udEZhbWlseSI6IlwidHJlYnVjaGV0IG1zXCIsIHZlcmRhbmEsIGFyaWFsIiwiZm9udFNpemUiOiIxNnB4IiwibGFiZWxCYWNrZ3JvdW5kIjoiI2U4ZThlOCIsIm5vZGVCa2ciOiIjRUNFQ0ZGIiwibm9kZUJvcmRlciI6IiM5MzcwREIiLCJjbHVzdGVyQmtnIjoiI2ZmZmZkZSIsImNsdXN0ZXJCb3JkZXIiOiIjYWFhYTMzIiwiZGVmYXVsdExpbmtDb2xvciI6IiMzMzMzMzMiLCJ0aXRsZUNvbG9yIjoiIzMzMyIsImVkZ2VMYWJlbEJhY2tncm91bmQiOiIjZThlOGU4IiwiYWN0b3JCb3JkZXIiOiJoc2woMjU5LjYyNjE2ODIyNDMsIDU5Ljc3NjUzNjMxMjglLCA4Ny45MDE5NjA3ODQzJSkiLCJhY3RvckJrZyI6IiNFQ0VDRkYiLCJhY3RvclRleHRDb2xvciI6ImJsYWNrIiwiYWN0b3JMaW5lQ29sb3IiOiJncmV5Iiwic2lnbmFsQ29sb3IiOiIjMzMzIiwic2lnbmFsVGV4dENvbG9yIjoiIzMzMyIsImxhYmVsQm94QmtnQ29sb3IiOiIjRUNFQ0ZGIiwibGFiZWxCb3hCb3JkZXJDb2xvciI6ImhzbCgyNTkuNjI2MTY4MjI0MywgNTkuNzc2NTM2MzEyOCUsIDg3LjkwMTk2MDc4NDMlKSIsImxhYmVsVGV4dENvbG9yIjoiYmxhY2siLCJsb29wVGV4dENvbG9yIjoiYmxhY2siLCJub3RlQm9yZGVyQ29sb3IiOiIjYWFhYTMzIiwibm90ZUJrZ0NvbG9yIjoiI2ZmZjVhZCIsIm5vdGVUZXh0Q29sb3IiOiJibGFjayIsImFjdGl2YXRpb25Cb3JkZXJDb2xvciI6IiM2NjYiLCJhY3RpdmF0aW9uQmtnQ29sb3IiOiIjZjRmNGY0Iiwic2VxdWVuY2VOdW1iZXJDb2xvciI6IndoaXRlIiwic2VjdGlvbkJrZ0NvbG9yIjoicmdiYSgxMDIsIDEwMiwgMjU1LCAwLjQ5KSIsImFsdFNlY3Rpb25Ca2dDb2xvciI6IndoaXRlIiwic2VjdGlvbkJrZ0NvbG9yMiI6IiNmZmY0MDAiLCJ0YXNrQm9yZGVyQ29sb3IiOiIjNTM0ZmJjIiwidGFza0JrZ0NvbG9yIjoiIzhhOTBkZCIsInRhc2tUZXh0TGlnaHRDb2xvciI6IndoaXRlIiwidGFza1RleHRDb2xvciI6IndoaXRlIiwidGFza1RleHREYXJrQ29sb3IiOiJibGFjayIsInRhc2tUZXh0T3V0c2lkZUNvbG9yIjoiYmxhY2siLCJ0YXNrVGV4dENsaWNrYWJsZUNvbG9yIjoiIzAwMzE2MyIsImFjdGl2ZVRhc2tCb3JkZXJDb2xvciI6IiM1MzRmYmMiLCJhY3RpdmVUYXNrQmtnQ29sb3IiOiIjYmZjN2ZmIiwiZ3JpZENvbG9yIjoibGlnaHRncmV5IiwiZG9uZVRhc2tCa2dDb2xvciI6ImxpZ2h0Z3JleSIsImRvbmVUYXNrQm9yZGVyQ29sb3IiOiJncmV5IiwiY3JpdEJvcmRlckNvbG9yIjoiI2ZmODg4OCIsImNyaXRCa2dDb2xvciI6InJlZCIsInRvZGF5TGluZUNvbG9yIjoicmVkIiwibGFiZWxDb2xvciI6ImJsYWNrIiwiZXJyb3JCa2dDb2xvciI6IiM1NTIyMjIiLCJlcnJvclRleHRDb2xvciI6IiM1NTIyMjIiLCJjbGFzc1RleHQiOiIjMTMxMzAwIiwiZmlsbFR5cGUwIjoiI0VDRUNGRiIsImZpbGxUeXBlMSI6IiNmZmZmZGUiLCJmaWxsVHlwZTIiOiJoc2woMzA0LCAxMDAlLCA5Ni4yNzQ1MDk4MDM5JSkiLCJmaWxsVHlwZTMiOiJoc2woMTI0LCAxMDAlLCA5My41Mjk0MTE3NjQ3JSkiLCJmaWxsVHlwZTQiOiJoc2woMTc2LCAxMDAlLCA5Ni4yNzQ1MDk4MDM5JSkiLCJmaWxsVHlwZTUiOiJoc2woLTQsIDEwMCUsIDkzLjUyOTQxMTc2NDclKSIsImZpbGxUeXBlNiI6ImhzbCg4LCAxMDAlLCA5Ni4yNzQ1MDk4MDM5JSkiLCJmaWxsVHlwZTciOiJoc2woMTg4LCAxMDAlLCA5My41Mjk0MTE3NjQ3JSkifX0sInVwZGF0ZUVkaXRvciI6ZmFsc2V9)

# Input

A SWF file has two main components, the movie timeline and ActionScript code.
To translate a SWF file, we handle the two components individually for
simplicity.

For the movie timeline, the SWF file should be feed directly to the translator.
The translator would decode the SWF file into tags, and translate them into
asset files and character data JSON files.

For the ActionScript code, the SWF file should be decompiled to ActionScript 3
code first (e.g. using FFDec), then feed the decompiled source code into the
translator. The translator would then translate the AS3 code into TypeScript
source files.

Note: only AS3 is supported.

# SWF character handling

SWF file consists of properties and tags. For SWF properties (e.g. stage size,
frame rate, background color), they are collected and emitted as a JSON
directly. This process is trivial so details are omitted here.

The most significant tags are character tags. The character tags can be divided
roughly into 4 categories:

- Assets: images, sounds, etc.
- Shapes: fonts, shapes/morph shapes, etc.
- Sprites: buttons, Sprites, etc.
- Timeline: place/remove objects, frame & scene labels, etc.

Translation of other tags (e.g. class linkage, property tags) are trivial so
details are omitted here.

## Assets decoding

Assets like images & sounds are decoded into common formats, such as PNG, MP3,
etc. The decoded assets are emitted as individual files directly. A JS index
file is also emitted for easy consumption by JS bundler (e.g. webpack).

## Shape tessellation

Shapes and font glyphs are tessellated into triangles (using `libtess`)
ahead-of-time for simplicity of runtime. Texture description (e.g. fill color,
gradient) are associated with the triangles. The result triangle definitions
are emitted as a character definition JSON file.

## Sprite translation

Sprites, buttons and text fields are mainly consist of attribute values and
timeline actions. They are translated from SWF format into a custom JSON format
for easy consumption by runtime.

# AS3 code handling

For simplicity of translation (avoid need to handling ABC bytecode directly),
AS3 source code is accepted instead. Since AS3 has semantics rather similar to
JS, AS3 is translated into TypeScript (preserving type information from AS3),
and ran directly by JS VM.

## AST construction

A33 source code is parsed into AST using `lezer` (with a AS3 grammer based on
official JS/TS grammar). Since `lezer` AST is optimized for performance, and is
rather hard to consume directly, the entire AST is converted to our defined
AST nodes before continuing on translation.

## TypeScript translation

The translation from AS3 to TypeScript is rather simple, and mostly one-to-one
mapped. A runtime is needed to emulate some AS3 features though, and some fixup
is needed:

- AS3 class variable can be accessed without `this` qualification, so a scope
  chain need to be constructed.
- AS3 supports interfaces. A simple `Symbol`-based interface mechanism is
  devised (although not verified to work) to emulate it.
- AS3 can have code like `str instanceof String`. These are translated to
  `typeof` checks instead.
- AS3 allows running code in constructor before calling `super()`. To avoid
  dropping down to use ES5-style classes, the code before `super()` is just
  moved after it. Some manual fixup may be needed.
- AS3 class method are bound to instances automatically, the runtime should
  perform this binding instead.

The translated source files are emitted, and can be used (or bundled) directly.

# Output

After the processes, the SWF file should be translated into character definition
JSON files, asset files, and TS source code. The character definition JSON files
and asset files should be bundled into a data-pack JSON, and loaded into runtime
along with transpiled TS code to run the SWF.
