import * as PIXI from 'pixi.js';
import * as filter from 'pixi-filters';

import { IUpdatable, IResizable, IVisible } from './core';

type Disturbance = {
  x:number, 
  y:number,
  t:number,
  phase:number
};
type Chop = {
  angle:number,
  amplitude:number,
  phase:number,
  stops:number
};

export class Ripple implements IUpdatable, IResizable, IVisible {

  constructor() {
    this._canvas = document.createElement('canvas');
    this._texture = PIXI.Texture.fromCanvas(this._canvas);
    this.view = new PIXI.Container();
    // make a sprite to add an illumination effect to the ripples    
    this.visibleSprite = new PIXI.Sprite(this._texture);
    this.visibleSprite.alpha = 0.05;
    this.visibleSprite.filters = [ new filter.BlurFilter() ];
    this.visibleSprite.tint = 0xFFFFCC;
    // make a sprite to add a refraction effect to the ripples
    this.filterSprite = new PIXI.Sprite(this._texture);
    this.view.addChild(this.visibleSprite);
    this.view.addChild(this.filterSprite);
    this.filter = new PIXI.filters.DisplacementFilter(this.filterSprite, 32);
    // make some randomized background chop
    for (let i:number = 0; i < 4; i++) {
      this._chops.push({
        angle: Math.random() * (Math.PI / 2),
        amplitude: 0.5 + (Math.random() * 0.5),
        phase: Math.random(),
        stops: 16 + Math.ceil(Math.random() * 16)
      });
    }
  }
  public readonly view:PIXI.Container;
  public readonly visibleSprite:PIXI.Sprite;
  public readonly filterSprite:PIXI.Sprite;
  private _canvas:HTMLCanvasElement;
  private _texture:PIXI.Texture;
  private _chops:Chop[] = [ ];

  public speed:number = 256; // pixels per second
  public duration:number = 4; // seconds

  public readonly filter:PIXI.filters.DisplacementFilter;

  public disturb(x:number, y:number):void {
    this._disturbances.add({
      x, y, 
      t: window.performance.now(),
      phase: 0.0
    });
  }
  private _disturbances:Set<Disturbance> = new Set();

  public get width():number { return(this._canvas.width); }
  public get height():number { return(this._canvas.height); }
  public resize(w:number, h:number) {
    if ((w === this.width) && (h === this.height)) return;
    this._canvas.width = w;
    this._canvas.height = h;
    this.update();
  }

  public update():void {
    this._canvas.width = this._canvas.width;
    this._redraw(this._canvas.getContext('2d'));
    this._texture.update();
  }

  protected _redraw(ctx:CanvasRenderingContext2D):void {
    const now = window.performance.now();
    this._drawChop(ctx, now);
    this._drawDisturbances(ctx, now);
  }

  // draw background chop
  protected _drawChop(ctx:CanvasRenderingContext2D, now:number):void {
    const cx = this.width / 2;
    const cy = this.height / 2;
    const walk = (min:number, n:number, max:number, d:number):number => 
      Math.min(Math.max(min, n + ((Math.random() - 0.5) * d)), max);
    for (const c of this._chops) {
      const minRadius = Math.sqrt((cx * cx) + (cy * cy));
      const diameter = minRadius * 2.5;
      const phaseShift = diameter * (2 / (c.stops - 1));
      const dx = Math.cos(c.angle);
      const dy = Math.sin(c.angle);
      const p = phaseShift * c.phase;
      const r1 = minRadius + p;
      const r2 = diameter - r1;
      const g = ctx.createLinearGradient(cx - (dx * r1), cy - (dy * r1),
        cx + (dx * r2), cy + (dy * r2));
      const amp = c.amplitude * 0.1;
      for (let i:number = 0; i < c.stops; i++) {
        const pos = i / (c.stops - 1);
        const v = (i % 2 == 0) ? '223' : '32';
        g.addColorStop(pos, 'rgba('+v+', '+v+', '+v+', '+amp+')');
      }
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, this.width, this.height);
      c.amplitude = walk(0.5, c.amplitude, 1.0, 0.01);
      c.angle = walk(0, c.angle, Math.PI / 2, 0.02);
      c.phase = (c.phase + 0.02) % 1.0;
    }
  }

  // draw disturbances
  protected _drawDisturbances(ctx:CanvasRenderingContext2D, now:number):void {
    for (const d of this._disturbances) {
      // compute the current radii of the disturbance
      const elapsed = (now - d.t) / 1000;
      const ir = elapsed * (this.speed * 0.3);
      const or = elapsed * this.speed;
      const amp = Math.pow(2, Math.max(0.0, 1.0 - (elapsed / this.duration))) / 2;
      // see if the disturbance is no longer visible
      const ih = ir / 1.414213562; // half size of square inscribed in inner circle
      if ((amp < 0.02) ||
          ((d.x - ih < 0) && (d.x + ih > this.width) &&
           (d.y - ih < 0) && (d.y + ih > this.height))) {
        this._disturbances.delete(d);
        continue;
      }
      // draw ripples for the disturbance
      const g = ctx.createRadialGradient(d.x, d.y, ir, d.x, d.y, or);
      const peaks = 5;
      const stops = (peaks * 2) - 1;
      // move the peaks within the wave packet
      const phase = d.phase * 2;
      g.addColorStop(0, 'rgba(0, 0, 0, 0)');
      for (let i:number = -1; i < stops + 1; i++) {
        // compute the peak's position
        const pos = (i + phase) / (stops + 1);
        if ((pos <= 0.01) || (pos >= 0.99)) continue;
        // alternate high and low peaks
        const v = ((i + 2) % 2 == 0) ? '255' : '0';
        // shape the amplitude of the wave packet into half a sine wave
        const a = Math.sin(pos * Math.PI) * amp * 0.25;
        g.addColorStop(pos, 'rgba('+v+', '+v+', '+v+', '+a+')');
      }
      g.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(d.x - or, d.y - or, 2 * or, 2 * or);
      d.phase = (d.phase + 0.01) % 1;
    }
  }

}