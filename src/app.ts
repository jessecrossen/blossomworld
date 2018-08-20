import * as PIXI from 'pixi.js';

import { Composite } from './core';

import { Bottom } from './bottom';
import { Fishies } from './fish';
import { Ripple } from './ripple';
import { Interaction } from './interaction';

export class App extends Composite {

  constructor(public readonly stage:PIXI.Container) {
    super();
    this.underwater.addLayer(new Bottom());
    this.underwater.addLayer(this.fishies);
    this.addLayer(this.underwater);
    //this.addLayer(this.ripple);
    //this.underwater.view.filters = [ this.ripple.filter ];
    this.stage.addChild(this.view);
  }
  public readonly interaction:Interaction = new Interaction(this);
  public readonly ripple:Ripple = new Ripple();
  public readonly fishies:Fishies = new Fishies();
  public underwater:Composite = new Composite();

}