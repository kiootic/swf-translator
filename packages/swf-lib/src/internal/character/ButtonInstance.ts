import { mat2d, vec4 } from "gl-matrix";
import { SimpleButton } from "../../classes/flash/display/SimpleButton";
import { Sprite } from "../../classes/flash/display/Sprite";
import {
  ButtonCharacter,
  ButtonRecord,
} from "../../classes/_internal/character/Button";
import { FrameActionKind } from "../../classes/_internal/character/Sprite";
import type { AssetLibrary } from "../../classes/_internal";
import { CharacterInstance } from "./CharacterInstance";
import { executeFrameAction } from "./frame";

export enum ButtonState {
  Up,
  Over,
  Down,
  HitTest,
}

export class ButtonInstance implements CharacterInstance {
  constructor(
    readonly id: number,
    readonly def: ButtonCharacter,
    readonly library: AssetLibrary
  ) {}

  applyTo(button: SimpleButton) {
    this.instantiateState(button, ButtonState.Up);
    this.instantiateState(button, ButtonState.Over);
    this.instantiateState(button, ButtonState.Down);
    this.instantiateState(button, ButtonState.HitTest);
    button.trackAsMenu = this.def.trackAsMenu;
  }

  instantiateState(button: SimpleButton, state: ButtonState) {
    const stateContainer = new Sprite();

    let inState: (record: ButtonRecord) => boolean;
    switch (state) {
      case ButtonState.Up:
        inState = (record) => record.up;
        break;
      case ButtonState.Over:
        inState = (record) => record.over;
        break;
      case ButtonState.Down:
        inState = (record) => record.down;
        break;
      case ButtonState.HitTest:
        inState = (record) => record.hitTest;
        break;
    }

    for (const record of this.def.characters) {
      if (!inState(record)) {
        continue;
      }
      executeFrameAction(this.library, stateContainer, 1, {
        kind: FrameActionKind.PlaceObject,
        depth: record.depth,
        characterId: record.characterId,

        matrix: record.matrix,
        colorTransform: record.colorTransform,
        filters: record.filters,
        blendMode: record.blendMode,
      });
    }

    switch (state) {
      case ButtonState.Up:
        button.upState = stateContainer;
        break;
      case ButtonState.Over:
        button.overState = stateContainer;
        break;
      case ButtonState.Down:
        button.downState = stateContainer;
        break;
      case ButtonState.HitTest:
        button.hitTestState = stateContainer;
        break;
    }
  }
}
