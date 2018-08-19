import * as PIXI from 'pixi.js';

import { IResizable, IVisible, IUpdatable } from './core';

type Fish = {
  x:number,
  y:number,
  width:number,
  length:number,
  angle:number,
  cycle:number
};

export class Fishies implements IResizable, IVisible, IUpdatable {

  constructor() {
    this._graphics = new PIXI.Graphics();
    this.view.addChild(this._graphics);

    //!!!
    this._fish.add({ x: 600, y: 400, width: 80, length: 480, angle: 0, cycle: 0 });
  }

  public readonly view:PIXI.Sprite = new PIXI.Sprite();
  private _graphics:PIXI.Graphics;
  private _fish:Set<Fish> = new Set();

  public get width():number { return(this._width); }
  private _width:number = 0;
  public get height():number { return(this._height); }
  private _height:number = 0;
  public resize(w:number, h:number) {
    if ((w === this.width) && (h === this.height)) return;
    this._width = w;
    this._height = h;
  }

  public update():void {
    this._graphics.clear();
    for (const f of this._fish) {
      this._drawFish(this._graphics, f);
      f.cycle = (f.cycle + 0.02) % 1;
      f.x += f.length * 0.02;
      if (f.x > this.width + f.length) f.x -= (this.width + (f.length * 1.5));
    }
  }

  protected _drawFish(g:PIXI.Graphics, f:Fish):void {
    const offset = 
      (p:{x:number,y:number}, a:number, len:number):{x:number,y:number} =>
        ({ x: p.x + (Math.cos(a) * len),
           y: p.y + (Math.sin(a) * len) });
    const rightAngle:number = Math.PI / 2;

    const headLen = f.length * 0.3;
    const tailLen = f.length * 0.7;
    const tailWidth = f.width * 0.125;
    const center = offset(f, f.angle + rightAngle, 
      Math.sin(f.cycle * Math.PI * 2) * f.width * 0.4);
    
    const bendForCycle = (cycle:number):number => 
      Math.sin(cycle * Math.PI * 2) * 0.25;
    const bend = bendForCycle(f.cycle);

    const headAngle = f.angle - bend;
    const noseCurve = f.width * 0.3;
    const nose = offset(center, headAngle, headLen);
    const noseLeft = offset(nose, headAngle - rightAngle, noseCurve);
    const noseRight = offset(nose, headAngle + rightAngle, noseCurve);

    const bendFactor = Math.min(Math.abs(bend) / 0.25, 1.0) * 0.25;
    const midCurve = (headLen + tailLen) * 0.25;
    const midCurveOuter = midCurve * (0.6 + (bendFactor * 1.75));
    const midCurveInner = midCurve * (0.6 - bendFactor);
    const midCurveLeft = bend < 0 ? midCurveOuter : midCurveInner;
    const midCurveRight = bend > 0 ? midCurveOuter : midCurveInner;
    const midLeft = offset(center, f.angle - rightAngle, f.width * 0.5);
    const midRight = offset(center, f.angle + rightAngle, f.width * 0.5);
    const midLeftFront = offset(midLeft, f.angle, midCurveLeft);
    const midLeftBack = offset(midLeft, f.angle, - midCurveLeft);
    const midRightFront = offset(midRight, f.angle, midCurveRight);
    const midRightBack = offset(midRight, f.angle, - midCurveRight);

    const tailAngle = f.angle + Math.PI + bend;
    const tailCurve = tailLen * 0.3;
    const tailCurveAngle = f.angle - bendForCycle((f.cycle + 0.25) % 1);
    const tail = offset(center, tailAngle, tailLen);
    const tailLeft = offset(tail, tailAngle + rightAngle, tailWidth);
    const tailRight = offset(tail, tailAngle - rightAngle, tailWidth);
    const tailLeftFront = offset(tailLeft, tailCurveAngle, tailCurve);
    const tailRightFront = offset(tailRight, tailCurveAngle, tailCurve);
    const tailLeftBack = offset(tailLeft, tailCurveAngle, - (tailCurve * 0.25));
    const tailRightBack = offset(tailRight, tailCurveAngle, - (tailCurve * 0.25));

    const pecRadius = f.width * 0.6;
    const pecCurve = pecRadius * 0.3;
    const pecLeftAngle = tailCurveAngle - (rightAngle * 1.7);
    const pecRightAngle = tailCurveAngle + (rightAngle * 1.7);
    const pecLeft = offset(midLeft, pecLeftAngle, pecRadius);
    const pecRight = offset(midRight, pecRightAngle, pecRadius);
    const pecLeftControl = offset(midLeft, f.angle - rightAngle, pecCurve);
    const pecRightControl = offset(midRight, f.angle + rightAngle, pecCurve);
    const pecCenter = offset(center, tailAngle, pecRadius * 0.6);
    
    const tailfinLen = f.length * 0.25;
    const tailfinRadius = f.width * 0.6;
    const tailfinCurve = tailfinLen * 0.6;
    const tailfinAngle = f.angle + Math.PI + 
      (bendForCycle((f.cycle + 0.2) % 1) * 1.5);
    const tailfin = offset(tail, headAngle, - tailfinLen);
    const tailfinLeft = offset(tailfin, tailfinAngle + (rightAngle * 0.25), tailfinRadius);
    const tailfinRight = offset(tailfin, tailfinAngle - (rightAngle * 0.25), tailfinRadius);
    const tailfinLeftFront = offset(tailfinLeft, tailfinAngle, - tailfinCurve);
    const tailfinRightFront = offset(tailfinRight, tailfinAngle, - tailfinCurve);
    const tailfinNotch = offset(tail, headAngle, - (tailfinLen * 0.5));

    g.lineStyle(0);
    g.beginFill(0x000000);
    g.moveTo(nose.x, nose.y);
    g.bezierCurveTo(noseLeft.x, noseLeft.y, midLeftFront.x, midLeftFront.y,
      midLeft.x, midLeft.y);
    g.bezierCurveTo(midLeftBack.x, midLeftBack.y, tailLeftFront.x, tailLeftFront.y,
      tailLeft.x, tailLeft.y);
    g.bezierCurveTo(tailLeftBack.x, tailLeftBack.y, 
      tailfinLeftFront.x, tailfinLeftFront.y, tailfinLeft.x, tailfinLeft.y);
    g.bezierCurveTo(tailfinLeftFront.x, tailfinLeftFront.y, 
      tailfinNotch.x, tailfinNotch.y, tail.x, tail.y);
    g.bezierCurveTo(tailfinNotch.x, tailfinNotch.y, 
      tailfinRightFront.x, tailfinRightFront.y, tailfinRight.x, tailfinRight.y);
    g.bezierCurveTo(tailfinRightFront.x, tailfinRightFront.y, 
      tailRightBack.x, tailRightBack.y, tailRight.x, tailRight.y);
    g.bezierCurveTo(tailRightFront.x, tailRightFront.y, midRightBack.x, midRightBack.y,
      midRight.x, midRight.y);
    g.bezierCurveTo(midRightFront.x, midRightFront.y, noseRight.x, noseRight.y,
      nose.x, nose.y);
    g.endFill();

    g.beginFill(0x000000, 0.5);

    g.moveTo(tailLeft.x, tailLeft.y);
    g.bezierCurveTo(tailLeftBack.x, tailLeftBack.y, 
      tailfinLeftFront.x, tailfinLeftFront.y, tailfinLeft.x, tailfinLeft.y);
    g.lineTo(tailfin.x, tailfin.y);
    g.lineTo(tailfinRight.x, tailfinRight.y);
    g.bezierCurveTo(tailfinRightFront.x, tailfinRightFront.y, 
      tailRightBack.x, tailRightBack.y, tailRight.x, tailRight.y);
    g.lineTo(tailLeft.x, tailLeft.y);

    g.moveTo(midLeft.x, midLeft.y);
    g.quadraticCurveTo(pecLeftControl.x, pecLeftControl.y, 
      pecLeft.x, pecLeft.y);
    g.lineTo(pecCenter.x, pecCenter.y);
    g.lineTo(pecRight.x, pecRight.y);
    g.quadraticCurveTo(pecRightControl.x, pecRightControl.y, 
      midRight.x, midRight.y);
    g.lineTo(midLeft.x, midLeft.y);

    g.endFill();

  }

}