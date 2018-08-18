import { App } from "./app";
import { Ripple } from "./ripple";

export class Interaction {

  constructor(public readonly app:App) {
    app.stage.interactive = true;
    app.stage.addListener('mousedown', this.onMouseDown.bind(this));
    app.stage.addListener('mousemove', this.onMouseMove.bind(this));
    app.stage.addListener('mouseup', this.onMouseUp.bind(this));
    app.stage.addListener('click', this.onClick.bind(this));
  }

  protected onMouseDown(e:PIXI.interaction.InteractionEvent):void {

  }

  protected onMouseMove(e:PIXI.interaction.InteractionEvent):void {
    const p = e.data.getLocalPosition(this.app.stage);
    const now = window.performance.now() / 1000;
    const elapsed = now - this._lastDropTime;
    if (elapsed > 0.25) {
      this.app.ripple.disturb(p.x, p.y);
      this._lastDropTime = now;
    }
  }
  private _lastDropTime:number = 0.0;

  protected onMouseUp(e:PIXI.interaction.InteractionEvent):void {

  }

  protected onClick(e:PIXI.interaction.InteractionEvent):void {
    const p = e.data.getLocalPosition(this.app.stage);
    this.app.ripple.disturb(p.x, p.y);
  }

}