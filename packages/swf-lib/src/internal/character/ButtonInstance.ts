import { SimpleButton } from "../../classes/flash/display/SimpleButton";
import { Sprite } from "../../classes/flash/display/Sprite";
import {
  ButtonCharacter,
  ButtonRecord,
  ButtonSound,
} from "../../classes/__internal/character/Button";
import { FrameActionKind } from "../../classes/__internal/character/Sprite";
import type { AssetLibrary } from "../../classes/__internal";
import { CharacterInstance } from "./CharacterInstance";
import {
  executeActionPlaceObject,
  updateFrameMasks,
  executeActionStartSound,
} from "./frame";

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
      executeActionPlaceObject(this.library, stateContainer, {
        kind: FrameActionKind.PlaceObject,
        depth: record.depth,
        characterId: record.characterId,
        moveCharacter: false,
        version: 3,

        matrix: record.matrix,
        colorTransform: record.colorTransform,
        filters: record.filters,
        blendMode: record.blendMode,
      });
    }
    updateFrameMasks(stateContainer);

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

  stateTransition(button: SimpleButton, from: ButtonState, to: ButtonState) {
    let sound: ButtonSound | undefined;
    if (from === ButtonState.Over && to === ButtonState.Up) {
      sound = this.def.overUpToIdle;
    } else if (from === ButtonState.Up && to === ButtonState.Over) {
      sound = this.def.idleToOverUp;
    } else if (from === ButtonState.Over && to === ButtonState.Down) {
      sound = this.def.overUpToOverDown;
    } else if (from === ButtonState.Down && to === ButtonState.Over) {
      sound = this.def.idleToOverUp;
    }
    if (!sound) {
      return;
    }

    executeActionStartSound(this.library, button.__soundContext, {
      kind: FrameActionKind.StartSound,
      characterId: sound.characterId,
      soundInfo: sound.soundInfo,
    });
  }
}
