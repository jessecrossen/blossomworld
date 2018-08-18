import * as PIXI from 'pixi.js';

import { IResizable, IVisible } from './core';

export class Bottom implements IResizable, IVisible {

  constructor() {
    this.view = new PIXI.Container();
    this._texture = this._makeTexture(512);
  }
  public view:PIXI.Container;
  private _tiling:PIXI.Sprite;
  private _texture:PIXI.Texture;

  public get width():number { return(this._width); }
  private _width:number = 0;
  public get height():number { return(this._height); }
  private _height:number = 0;
  public resize(w:number, h:number) {
    if ((w === this.width) && (h === this.height)) return;
    this._width = w;
    this._height = h;
    if ((! this._tiling) || 
        (w > this._tiling.width) || (h > this._tiling.height)) {
      if (this._tiling) this.view.removeChild(this._tiling);
      const tw = this._texture.width;
      const th = this._texture.height;
      this._tiling = new PIXI.extras.TilingSprite(
        this._texture, Math.ceil(w / tw) * tw, Math.ceil(h / th) * th);
      this.view.addChild(this._tiling);
    }
  }

  protected _makeTexture(size:number=256):PIXI.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, size, size);
    const pixels = imageData.data;
    // fill red channel with random data
    pixels[0] = 128;
    this._fillSquare(pixels, size, 0, 0, size, size);
    // transfer red channel to other channels
    let i = 0;
    let v:number;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        v = pixels[i] - 128;
        pixels[i++] = v < 0 ? - v * 0.25 : 0;
        pixels[i++] = v > 0 ? v * 0.25 : 0;
        pixels[i++] = 32;
        pixels[i++] = 32 + Math.abs(v);
      }
    }
    ctx.putImageData(imageData, 0, 0);
    return(PIXI.Texture.fromCanvas(canvas));
  }

  protected _fillSquare(pixels:Uint8ClampedArray, size:number, 
                        x0:number, y0:number, x1:number, y1:number) {
    const idx = (x:number, y:number):number => 
      ((y % size) * size * 4) + ((x % size) * 4);
    // exit if size is zero
    if ((x1 <= x0 + 1) || (y1 <= y0 + 1)) return;
    // sample the corners
    const tl = pixels[idx(x0, y0)];
    const tr = pixels[idx(x1, y0)];
    const bl = pixels[idx(x0, y1)];
    const br = pixels[idx(x1, y1)];
    // fill in midpoints
    const interp = (a:number, b:number, w:number) =>
      ((a * (1 - w)) + (b * w)) + ((Math.random() - 0.5) * 32);
    const mx = Math.round((x0 + x1) / 2);
    const my = Math.round((y0 + y1) / 2);
    const wx = (mx - x0) / (x1 - x0);
    const wy = (my - y0) / (y1 - y0);
    const mt = interp(tl, tr, wx);
    const mb = interp(bl, br, wx);
    const insert = (x:number, y:number, v:number) => {
      const i = idx(x, y);
      if (pixels[i] == 0) pixels[i] = v;
    };
    insert(mx, y0, mt);
    insert(mx, y1, mb);
    insert(x0, my, interp(tl, bl, wy));
    insert(x1, my, interp(tr, br, wy));
    insert(mx, my, interp(mt, mb, wy));
    // recurse
    this._fillSquare(pixels, size, x0, y0, mx, my);
    this._fillSquare(pixels, size, mx, y0, x1, my);
    this._fillSquare(pixels, size, x0, my, mx, y1);
    this._fillSquare(pixels, size, mx, my, x1, y1);
  }

}