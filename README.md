SWF translator
--------------

An attempt to emulate SWF in HTML5 environment. WebGL2 is required.

## Usage

Requirement:
- NodeJS >= 12

Build source code:
```
yarn install
yarn build
```

Translate SWF tags:
```
node packages/swf-translator/dist/index.js build-swf <path to swf> <output directory>
```

Translate AS3 source code:
```
node packages/swf-translator/dist/index.js build-as3 <AS3 source directory> <output directory>
```

Assembly required to run the output, some hints:
- Alias `swf-lib` in output source code to the compiled `swf-lib` package.
- Bundle character definition JSON: `JSON.stringify` the variable `bundle` in character `index.js`.
- Construct asset manifest:
  ```json5
  {
    "data": "data",
    "properties": {}, // embed properties.json
    "assets": {
      "data": {
        "url": "./data.json", // path to bundled character definition JSON
        "size": 0, // zero if no need of progress report
      },
      "character1": {
        "url": "./character1.png",
        "size": 0,
      }
      // etc.
    }
  }
  ```
- Start the SWF:
  ```js
  import lib from "swf-lib";
  const manifest = { /* ... */ };
  const library = await lib.__internal.loadManifest(manifest);
  const stage = new lib.flash.display.Stage(library.properties);
  stage.__withContext(() => stage.addChild(library.instantiateCharacter(0)))();
  document.body.appendChild(stage.__canvas.container);
  ```

## Technical documentation
- [Translator](./docs/translator.md)
- [Runtime](./docs/runtime.md)

## License
MIT
