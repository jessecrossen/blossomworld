import * as PIXI from 'pixi.js';
import * as filter from 'pixi-filters';

import { IResizable, IVisible, IUpdatable } from './core';

type Fish = {
  x:number,
  y:number,
  width:number,
  length:number,
  cycle:number,
  color: number,
  headAmplitude:number,
  tailAmplitude:number,
  angle:number,
  velocity:number,
  angleDelta:number,
  velocityDelta:number,
  target?:Vector
};
const TURN_DELTA:number = 0.1;

type Vector = { x:number, y:number };

const approach = (v:number, target:number, f:number = 0.05):number => 
      ((v * (1 - f)) + (target * f));

const offset = 
      (p:Vector, a:number, len:number):Vector =>
        ({ x: p.x + (Math.cos(a) * len),
           y: p.y + (Math.sin(a) * len) });

export class Fishies implements IResizable, IVisible, IUpdatable {

  constructor() {
    this._graphics = new PIXI.Graphics();
    this.view.addChild(this._graphics);
    this.view.filters = [ 
      new filter.DropShadowFilter({
        alpha: 1,
        blur: 8,
        color: 0x000008,
        distance: 24,
        kernels: null,
        pixelSize: 1,
        quality: 3,
        resolution: PIXI.settings.RESOLUTION,
        rotation: 45,
        shadowOnly: false
      }) ];

    //!!!
    this._fish.add(this.oneFish);
  }

  //!!! temporary
  public readonly oneFish:Fish = this._makeFish(400, 400, 20);

  public readonly view:PIXI.Sprite = new PIXI.Sprite();
  private _graphics:PIXI.Graphics;

  protected _makeFish(x:number, y:number, size:number):Fish {
    return({
      x, y, 
      width: Math.round(size + (size * Math.random() * 0.1)), 
      length: Math.round((size * 6) + (size * Math.random() * 0.1)), 
      color: 0x400000, 
      angle: 0, 
      velocity: 0, 
      cycle: 0,
      headAmplitude: 0.8, tailAmplitude: 0.8,
      angleDelta: 0, velocityDelta: 0
    });
  }
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
    const now = window.performance.now() / 1000;
    const elapsed = isNaN(this._lastUpdateTime) ? 0 : now - this._lastUpdateTime;
    this._lastUpdateTime = now;
    this._graphics.clear();
    for (const f of this._fish) {
      this._steerFish(f);
      this._moveFish(f, elapsed);
      this._drawFish(this._graphics, f);
    }
  }
  protected _lastUpdateTime:number;

  protected _steerFish(f:Fish):void {
    if (! f.target) {
      f.angleDelta = approach(f.angleDelta, 0);
      f.velocityDelta = approach(f.velocityDelta, 0);
      return;
    }
    const dx = f.target.x - f.x;
    const dy = f.target.y - f.y;
    const a = Math.atan2(dy, dx);
    const d = Math.sqrt((dx * dx) + (dy * dy));
    let da = a - f.angle;
    if (da < - Math.PI) da += Math.PI * 2;
    else if (da > Math.PI) da -= Math.PI * 2;
    // change direction
    if (d > 64) {
      f.angleDelta = approach(f.angleDelta, Math.min((da / Math.PI) * 0.1, 0.2));
    }
    else {
      f.angleDelta = approach(f.angleDelta, 0);
    }
    // change speed
    const travelTime = d / f.velocity;
    if (travelTime < 1.0) {
      f.velocityDelta = approach(f.velocityDelta, - 16);
    }
    else {
      f.velocityDelta = travelTime * 2;
    }
  }

  protected _moveFish(f:Fish, elapsed:number):void {
    if (f.angleDelta < - TURN_DELTA) {
      if (! (f.velocityDelta > 0)) f.cycle = approach(f.cycle, 0.25);
      f.headAmplitude = approach(f.headAmplitude, 4);
      f.tailAmplitude = approach(f.tailAmplitude, 0);
    }
    else if (f.angleDelta > TURN_DELTA) {
      if (! (f.velocityDelta > 0)) f.cycle = approach(f.cycle, 0.75);
      f.headAmplitude = approach(f.headAmplitude, 4);
      f.tailAmplitude = approach(f.tailAmplitude, 0);
    }
    if (f.velocityDelta > 0) {
      f.cycle = (f.cycle + (f.velocity * 0.01 * elapsed)) % 1;
      f.headAmplitude = approach(f.headAmplitude, Math.min(f.velocityDelta * 0.05, 0.6));
      f.tailAmplitude = approach(f.tailAmplitude, f.headAmplitude * 2);
    }
    else {
      f.cycle = (f.cycle + 0.3 * elapsed) % 1;
      f.headAmplitude = approach(f.headAmplitude, 0.1);
      f.tailAmplitude = approach(f.tailAmplitude, 0.2);
    }
    if (! isNaN(f.angleDelta)) f.angle += f.angleDelta;
    if (! isNaN(f.velocityDelta)) {
      f.velocity = Math.min(Math.max(0, 
        f.velocity + (f.velocityDelta * elapsed)), 128);
    }
    f.x += f.velocity * elapsed * Math.cos(f.angle);
    f.y += f.velocity * elapsed * Math.sin(f.angle);
    // wrap fish
    if (f.x <= - this.width * 0.5) f.x += this.width * 2;
    if (f.y <= - this.height * 0.5) f.y += this.height * 2;
    if (f.x >= this.width * 1.5) f.x -= this.width * 2;
    if (f.y >= this.height * 1.5) f.y -= this.height * 2;
  }

  protected _drawFish(g:PIXI.Graphics, f:Fish):void {
    const rightAngle:number = Math.PI / 2;
    // set overall parameters
    const headLen = f.length * 0.3;
    const tailLen = f.length * 0.7;
    const tailWidth = f.width * 0.125;
    const center = offset(f, f.angle + rightAngle, 
      Math.sin(f.cycle * Math.PI * 2) * f.width * 0.2 * f.headAmplitude);
    const turning = ((f.angleDelta < - TURN_DELTA) || 
                     (f.angleDelta > TURN_DELTA));
    // compute body bending
    const bendForCycle = (cycle:number):number => 
      Math.sin(cycle * Math.PI * 2) * 0.2;
    const bend = bendForCycle(f.cycle);
    // position head
    const headAngle = f.angle - (bend * f.headAmplitude);
    const noseCurve = f.width * 0.3;
    const nose = offset(center, headAngle, headLen);
    const noseLeft = offset(nose, headAngle - rightAngle, noseCurve);
    const noseRight = offset(nose, headAngle + rightAngle, noseCurve);
    // position midsection
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
    // position tail
    const tailAngle = f.angle + Math.PI + (bend * f.tailAmplitude);
    const tailCurve = tailLen * 0.3;
    const tailCurveAngle = f.angle - bendForCycle((f.cycle + 0.25) % 1);
    const tail = offset(center, tailAngle, tailLen);
    const tailLeft = offset(tail, tailAngle + rightAngle, tailWidth);
    const tailRight = offset(tail, tailAngle - rightAngle, tailWidth);
    const tailLeftFront = offset(tailLeft, tailCurveAngle, tailCurve);
    const tailRightFront = offset(tailRight, tailCurveAngle, tailCurve);
    const tailLeftBack = offset(tailLeft, tailCurveAngle, - (tailCurve * 0.25));
    const tailRightBack = offset(tailRight, tailCurveAngle, - (tailCurve * 0.25));
    // position pectoral fins
    const pecRadius = f.width * 0.6;
    const pecCurve = pecRadius * 0.3;
    const pecLeftAngle = tailCurveAngle - (rightAngle * 1.7);
    const pecRightAngle = tailCurveAngle + (rightAngle * 1.7);
    const pecLeft = offset(midLeft, pecLeftAngle, pecRadius);
    const pecRight = offset(midRight, pecRightAngle, pecRadius);
    const pecLeftControl = offset(midLeft, f.angle - rightAngle, pecCurve);
    const pecRightControl = offset(midRight, f.angle + rightAngle, pecCurve);
    const pecCenter = offset(center, tailAngle, pecRadius * 0.6);
    // position tail fins
    const tailfinLen = f.length * 0.25;
    const tailfinRadius = f.width * 0.6;
    const tailfinCurve = tailfinLen * 0.6;
    const tailfinBaseAngle = turning ? tailAngle + bend : headAngle + Math.PI;
    let tailfinAngle = turning ? tailAngle : f.angle + Math.PI;
    if (! turning) tailfinAngle += (bendForCycle((f.cycle + 0.2) % 1) * 1.5);
    const tailfin = offset(tail, tailfinBaseAngle, tailfinLen);
    const tailfinLeft = offset(tailfin, tailfinAngle + (rightAngle * 0.25), tailfinRadius);
    const tailfinRight = offset(tailfin, tailfinAngle - (rightAngle * 0.25), tailfinRadius);
    const tailfinLeftFront = offset(tailfinLeft, tailfinAngle, - tailfinCurve);
    const tailfinRightFront = offset(tailfinRight, tailfinAngle, - tailfinCurve);
    const tailfinNotch = offset(tail, tailfinBaseAngle, tailfinLen * 0.5);

    // draw body
    g.beginFill(f.color);
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

    // draw translucent parts
    g.beginFill(f.color, 0.75);
    // tail
    g.moveTo(tailLeft.x, tailLeft.y);
    g.bezierCurveTo(tailLeftBack.x, tailLeftBack.y, 
      tailfinLeftFront.x, tailfinLeftFront.y, tailfinLeft.x, tailfinLeft.y);
    g.lineTo(tailfin.x, tailfin.y);
    g.lineTo(tailfinRight.x, tailfinRight.y);
    g.bezierCurveTo(tailfinRightFront.x, tailfinRightFront.y, 
      tailRightBack.x, tailRightBack.y, tailRight.x, tailRight.y);
    g.lineTo(tailLeft.x, tailLeft.y);
    // pectoral fins
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