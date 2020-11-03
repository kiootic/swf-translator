SWF runtime
==============

This document describes the SWF runtime component.


# Architecture Overview

![Architecture Overview](https://mermaid.ink/img/eyJjb2RlIjoiZ3JhcGggVERcbiAgICBkaXNwb2Jqc1tkaXNwbGF5IG9iamVjdHNdIC0tPiBzY2VuZVtzY2VuZSBub2Rlc11cbiAgICBkaXNwb2JqcyAtLi0-IGF2bVthdm0gcnVudGltZV1cbiAgICBzdGFnZVtzdGFnZV0gLS0-IGNhbnZhc1tjYW52YXNdXG4gICAgc3RhZ2UgLS0-IGRpc3BvYmpzXG4gICAgYXNzZXRzW2Fzc2V0IGxpYnJhcnldIC0uLT58Y29uc3RydWN0IGNoYXJhY3RlcnN8IGRpc3BvYmpzXG4gICAgc3RhZ2UgLS0-IHRpY2tlclxuICAgIHN0YWdlIC0tPiByZW5kZXJlclxuICAgIHN0YWdlIC0tPiBhdWRpb1thdWRpbyBjb250cm9sbGVyXVxuICAgIGNhbnZhcyAtLi0-IHJlbmRlcmVyXG4gICAgc2NlbmUgLS4tPiByZW5kZXJlclxuICAgIHJlbmRlcmVyIC0tPiB3ZWJnbDJcbiAgICBhdWRpbyAtLT4gd2ViYXVkaW9cbiIsIm1lcm1haWQiOnsidGhlbWUiOiJkZWZhdWx0IiwidGhlbWVWYXJpYWJsZXMiOnsiYmFja2dyb3VuZCI6IndoaXRlIiwicHJpbWFyeUNvbG9yIjoiI0VDRUNGRiIsInNlY29uZGFyeUNvbG9yIjoiI2ZmZmZkZSIsInRlcnRpYXJ5Q29sb3IiOiJoc2woODAsIDEwMCUsIDk2LjI3NDUwOTgwMzklKSIsInByaW1hcnlCb3JkZXJDb2xvciI6ImhzbCgyNDAsIDYwJSwgODYuMjc0NTA5ODAzOSUpIiwic2Vjb25kYXJ5Qm9yZGVyQ29sb3IiOiJoc2woNjAsIDYwJSwgODMuNTI5NDExNzY0NyUpIiwidGVydGlhcnlCb3JkZXJDb2xvciI6ImhzbCg4MCwgNjAlLCA4Ni4yNzQ1MDk4MDM5JSkiLCJwcmltYXJ5VGV4dENvbG9yIjoiIzEzMTMwMCIsInNlY29uZGFyeVRleHRDb2xvciI6IiMwMDAwMjEiLCJ0ZXJ0aWFyeVRleHRDb2xvciI6InJnYig5LjUwMDAwMDAwMDEsIDkuNTAwMDAwMDAwMSwgOS41MDAwMDAwMDAxKSIsImxpbmVDb2xvciI6IiMzMzMzMzMiLCJ0ZXh0Q29sb3IiOiIjMzMzIiwibWFpbkJrZyI6IiNFQ0VDRkYiLCJzZWNvbmRCa2ciOiIjZmZmZmRlIiwiYm9yZGVyMSI6IiM5MzcwREIiLCJib3JkZXIyIjoiI2FhYWEzMyIsImFycm93aGVhZENvbG9yIjoiIzMzMzMzMyIsImZvbnRGYW1pbHkiOiJcInRyZWJ1Y2hldCBtc1wiLCB2ZXJkYW5hLCBhcmlhbCIsImZvbnRTaXplIjoiMTZweCIsImxhYmVsQmFja2dyb3VuZCI6IiNlOGU4ZTgiLCJub2RlQmtnIjoiI0VDRUNGRiIsIm5vZGVCb3JkZXIiOiIjOTM3MERCIiwiY2x1c3RlckJrZyI6IiNmZmZmZGUiLCJjbHVzdGVyQm9yZGVyIjoiI2FhYWEzMyIsImRlZmF1bHRMaW5rQ29sb3IiOiIjMzMzMzMzIiwidGl0bGVDb2xvciI6IiMzMzMiLCJlZGdlTGFiZWxCYWNrZ3JvdW5kIjoiI2U4ZThlOCIsImFjdG9yQm9yZGVyIjoiaHNsKDI1OS42MjYxNjgyMjQzLCA1OS43NzY1MzYzMTI4JSwgODcuOTAxOTYwNzg0MyUpIiwiYWN0b3JCa2ciOiIjRUNFQ0ZGIiwiYWN0b3JUZXh0Q29sb3IiOiJibGFjayIsImFjdG9yTGluZUNvbG9yIjoiZ3JleSIsInNpZ25hbENvbG9yIjoiIzMzMyIsInNpZ25hbFRleHRDb2xvciI6IiMzMzMiLCJsYWJlbEJveEJrZ0NvbG9yIjoiI0VDRUNGRiIsImxhYmVsQm94Qm9yZGVyQ29sb3IiOiJoc2woMjU5LjYyNjE2ODIyNDMsIDU5Ljc3NjUzNjMxMjglLCA4Ny45MDE5NjA3ODQzJSkiLCJsYWJlbFRleHRDb2xvciI6ImJsYWNrIiwibG9vcFRleHRDb2xvciI6ImJsYWNrIiwibm90ZUJvcmRlckNvbG9yIjoiI2FhYWEzMyIsIm5vdGVCa2dDb2xvciI6IiNmZmY1YWQiLCJub3RlVGV4dENvbG9yIjoiYmxhY2siLCJhY3RpdmF0aW9uQm9yZGVyQ29sb3IiOiIjNjY2IiwiYWN0aXZhdGlvbkJrZ0NvbG9yIjoiI2Y0ZjRmNCIsInNlcXVlbmNlTnVtYmVyQ29sb3IiOiJ3aGl0ZSIsInNlY3Rpb25Ca2dDb2xvciI6InJnYmEoMTAyLCAxMDIsIDI1NSwgMC40OSkiLCJhbHRTZWN0aW9uQmtnQ29sb3IiOiJ3aGl0ZSIsInNlY3Rpb25Ca2dDb2xvcjIiOiIjZmZmNDAwIiwidGFza0JvcmRlckNvbG9yIjoiIzUzNGZiYyIsInRhc2tCa2dDb2xvciI6IiM4YTkwZGQiLCJ0YXNrVGV4dExpZ2h0Q29sb3IiOiJ3aGl0ZSIsInRhc2tUZXh0Q29sb3IiOiJ3aGl0ZSIsInRhc2tUZXh0RGFya0NvbG9yIjoiYmxhY2siLCJ0YXNrVGV4dE91dHNpZGVDb2xvciI6ImJsYWNrIiwidGFza1RleHRDbGlja2FibGVDb2xvciI6IiMwMDMxNjMiLCJhY3RpdmVUYXNrQm9yZGVyQ29sb3IiOiIjNTM0ZmJjIiwiYWN0aXZlVGFza0JrZ0NvbG9yIjoiI2JmYzdmZiIsImdyaWRDb2xvciI6ImxpZ2h0Z3JleSIsImRvbmVUYXNrQmtnQ29sb3IiOiJsaWdodGdyZXkiLCJkb25lVGFza0JvcmRlckNvbG9yIjoiZ3JleSIsImNyaXRCb3JkZXJDb2xvciI6IiNmZjg4ODgiLCJjcml0QmtnQ29sb3IiOiJyZWQiLCJ0b2RheUxpbmVDb2xvciI6InJlZCIsImxhYmVsQ29sb3IiOiJibGFjayIsImVycm9yQmtnQ29sb3IiOiIjNTUyMjIyIiwiZXJyb3JUZXh0Q29sb3IiOiIjNTUyMjIyIiwiY2xhc3NUZXh0IjoiIzEzMTMwMCIsImZpbGxUeXBlMCI6IiNFQ0VDRkYiLCJmaWxsVHlwZTEiOiIjZmZmZmRlIiwiZmlsbFR5cGUyIjoiaHNsKDMwNCwgMTAwJSwgOTYuMjc0NTA5ODAzOSUpIiwiZmlsbFR5cGUzIjoiaHNsKDEyNCwgMTAwJSwgOTMuNTI5NDExNzY0NyUpIiwiZmlsbFR5cGU0IjoiaHNsKDE3NiwgMTAwJSwgOTYuMjc0NTA5ODAzOSUpIiwiZmlsbFR5cGU1IjoiaHNsKC00LCAxMDAlLCA5My41Mjk0MTE3NjQ3JSkiLCJmaWxsVHlwZTYiOiJoc2woOCwgMTAwJSwgOTYuMjc0NTA5ODAzOSUpIiwiZmlsbFR5cGU3IjoiaHNsKDE4OCwgMTAwJSwgOTMuNTI5NDExNzY0NyUpIn19LCJ1cGRhdGVFZGl0b3IiOmZhbHNlfQ)

NOTE: Flash APIs/behavior are only implemented on a as-needed basis, it's not
completely bug-free nor accurate; it works for me.

# Asset library

The flow begins with constructing an `AssetLibrary` from an asset manifest. An
asset manifest is a JSON containing the path of asset files and bundled data
definition JSON. Caller can receive loading progress report while the library
is loading.

The loading process would decode the images into IMG elements, sounds into
WebAudio buffer, and initialize the relevant character data structures.

Usually there would be just one `AssetLibrary` instance for a SWF file; it is
possible share `AssetLibrary` instance across different `Stage` instance.

# Frame ticking

The frames are ticked using `requestAnimationFrame` and `MessageChannel`
(emulating `requestPostAnimationFrame`). SWF frame is advanced at the beginning
of browser frame, and stage is rendered at the end of browser frame.

The frame rate specified in SWF is respected by both frame advance and render.

# Audio

Audio is played using WebAudio API. Stage owns a `AudioController` instance
(contains an `AudioContext`), which AS3 `SoundChannel` would connect to.

# Scene nodes

Scene nodes are a convenient representation of `DisplayObject`s for ease of
layout and rendering. Each `DisplayObject ` corresponds to exactly one
`SceneNode` (except some cases). Scene nodes have two major responsibilities:

- Layout: providing layout information nad hit-testing capability to
  `DisplayObject`. Layout is computed lazily on request.
- Render: consolidate render information and provide instruction to renderer.

# Events

`EventDispatcher` is implemented with simple bubbling & capturing mechanism.
For broadcast events (e.g. `ENTER_FRAME`), an `EventDispatcher` is associated
with each `Stage` instance solely for these events.

# Texts

For static text, layout is embedded in SWF, so no need to re-compute layout.

For edit text, HTML texts are parsed using `DOMParser` and converted into
text segments (i.e. text associated with `TextFormat`). The segments are layout
using a basic algorithm, supporting simple word-wrap, multi-line, and alignment.

# AVM runtime

AVM runtime is needed to emulate some features of AS3.

- Class definitions are registered globally (for `getDefinitionByName`).
- Class methods are bound to instances automatically for derived class of
  `AVMObject`.
- Miscellaneous helper functions for translation of AS3 built-in functions.

# Timeline construction

Timeline construction is (one of) the messiest part of SWF. The emulation is 
divined from other emulator implementation, so it's mostly inaccurate. At least
it works for my purpose.

## Character instantiation

Instantiating a `DisplayObject` (e.g. `MovieClip`) from characters is a
complex process. The most problematic behavior is it populates the attributes
and children of a instantiated character *within* the constructor of runtime
classes. That is, derived class constructor would observe a completely
instantiated, along with recursively instantiated children, when `super()`
return.

To isolate the timeline object construction logic from framework classes,
we have `DisplayObject.__initChar` function to allow caller to insert code to
be ran just before the return of `DisplayObject`'s constructor.

## Frame scripts

Frame scripts are added to a `MovieClip` using the hidden `addFrameScript`
method. The timing of its execution is rather erratic: it may be queued and ran
whenever the timeline is updated.

The implementation is largely referenced from Shumway project. It's very
incomplete and need serious re-work to be remotely accurate.

# Rendering

The basic rendering primitives of SWF are shapes, and texts. They are treated
as the same for our renderer, since we don't have fancy processing on font
glyphs (e.g. font atlas, SDF). Each shape and text run is modelled as a
`RenderObject`.

A `SceneNode` may own multiple `RenderObject`s. `SceneNode` would issue
instructions (i.e. `DeferredRender`) to renderer in order to render them.

Due to liberal use of filters and masks in the test target SWF, filters and
masks are processed in batch. Each render instruction in batch is represented by
`DeferredRender`. `DeferredRender` can be resolved to new `DeferredRender`s,
for example:

```
DeferredRenderTexture -> DeferredRenderFilter -> DeferredRenderFilter -> DeferredRenderObject
```

All `DeferredRender`s would be resolved iteratively until every one of them
represents a simple `RenderObject` (i.e. `DeferredRenderObject`). Then, they're
also rendered in batch.

## Off-screen rendering

Due to liberal use of filters in test target SWF, up to dozens of small
`RenderObject` may require off-screen rendered to texture. To reduce render
state switch and optimize memory usage, they are rendered in batch
(`DeferredRenderTexture`) to a texture atlas before further processing.

TODO: Render artifacts happens: texture patch leaks to neighbor in atlas.

## Filters

Blur filter supports processing multiple input blur requests in batch. The
requests are grouped input atlas texture and blur passes; blur radius is passed
as attributes to shader.

The test target SWF sometimes use a large blur radius (150), so shader programs
are generated just-in-time with caching to improve rendering quality.

## Masking

Due to liberal use of masking in test target SWF (commonly over 20 masks on
screen), using stencil for masking would incur heavy performance penalty. Also,
it is hard to handle independent overlapping mask correctly.

Instead, masks are rendered to off-screen textures in screen-space, with the
mask ID in color channel. The main render shader would use the texture to
perform masking.

## BitmapData

The test target SWF renders a large amount of `DisplayObject` to `BitmapData`.
To improve performance, the `DisplayObject`s are rendered in batch, by cloning
their `SceneNode`s when `BitmapData.draw` is called, and render them lazily.

The test target SWF also use pixels in `BitmapData` frequently. Pixel data is
loaded and cached from texture lazily first time when `BitmapData.getPixel32`
is called, and invalidated when rendered again.
