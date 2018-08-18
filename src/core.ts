import * as PIXI from 'pixi.js';

export interface IUpdatable {
  update():void;
}
export function isIUpdatable(obj:any):obj is IUpdatable {
  return('update' in obj);
}

export interface IResizable {
  readonly width:number;
  readonly height:number;
  resize(w:number, h:number):void;
}
export function isIResizable(obj:any):obj is IResizable {
  return('resize' in obj);
}

export interface IVisible {
  readonly view:PIXI.DisplayObject;
}
export function isIVisible(obj:any):obj is IVisible {
  return('view' in obj);
}

type Layer = IUpdatable|IResizable|IVisible;

export class Composite implements IUpdatable, IResizable, IVisible {

  public readonly view:PIXI.Container = new PIXI.Container;

  public addLayer(layer:Layer):void {
    this.layers.push(layer);
    if (isIVisible(layer)) this.view.addChild(layer.view);
  }
  public readonly layers:Layer[] = [ ];

  public get width():number { return(this._width); }
  private _width:number = 0;

  public get height():number { return(this._height); }
  private _height:number = 0;

  public resize(w:number, h:number) {
    if ((w === this._width) && (h === this._height)) return;
    this._width = w;
    this._height = h;
    for (const layer of this.layers) {
      if (isIResizable(layer)) layer.resize(w, h);
      if (isIVisible(layer)) {
        if (! layer.view.filterArea) {
          layer.view.filterArea = new PIXI.Rectangle();
        }
        layer.view.filterArea.width = w;
        layer.view.filterArea.height = h;
      }
    }
  }

  public update() {
    for (const layer of this.layers) {
      if (isIUpdatable(layer)) layer.update();
    }
  }

}

// for testing visual effects and measurements
export class Grid implements IVisible, IResizable {

  constructor(public readonly spacing:number=16, 
              public readonly color:number=0xFFFFFF, 
              public readonly alpha:number=0.25) {
    this.view = new PIXI.Sprite();
    this._graphics = new PIXI.Graphics();
    this.view.addChild(this._graphics);
  }
  public readonly view:PIXI.Sprite;
  private _graphics:PIXI.Graphics;

  public get width():number { return(this._width); }
  private _width:number = 0;

  public get height():number { return(this._height); }
  private _height:number = 0;

  public resize(w:number, h:number) {
    if ((w === this._width) && (h === this._height)) return;
    this._width = w;
    this._height = h;
    this._redraw(this._graphics); 
  }

  protected _redraw(g:PIXI.Graphics):void {
    g.clear();
    g.lineStyle(1, this.color, this.alpha);
    for (let x = 0; x < this.width; x += this.spacing) {
      g.moveTo(x, 0);
      g.lineTo(x, this.height);
    }
    for (let y = 0; y < this.height; y += this.spacing) {
      g.moveTo(0, y);
      g.lineTo(this.width, y);
    }
  }

}