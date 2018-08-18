import * as PIXI from 'pixi.js';

import { Composite, Grid } from './core';

import { Bottom } from './bottom';
import { Ripple } from './ripple';
import { Interaction } from './interaction';

export class App extends Composite {

  constructor(public readonly stage:PIXI.Container) {
    super();
    this.underwater.addLayer(new Bottom());
    //this.underwater.addLayer(new Grid());
    this.addLayer(this.underwater);
    this.addLayer(this.ripple);
    this.underwater.view.filters = [ this.ripple.filter ];
    this.stage.addChild(this.view);
  }
  public readonly interaction:Interaction = new Interaction(this);
  public readonly ripple:Ripple = new Ripple();
  public underwater:Composite = new Composite();

}