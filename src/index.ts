import * as PIXI from 'pixi.js';

import { App } from './app';

const renderer = PIXI.autoDetectRenderer({
  antialias: false,
  backgroundColor: 0x000020
});

const stage = new PIXI.Container();
const app = new App(stage);

// dynamically resize the app to track the size of the browser window
const container = document.getElementById('container');
container.style.overflow = 'hidden';
const resizeApp = () => {
  const r = container.getBoundingClientRect();
  renderer.resize(r.width, r.height);
  app.resize(r.width, r.height);
}
resizeApp();
window.addEventListener('resize', resizeApp);

// startup
const onReady = () => {
  // remove the loading animation
  const loading = document.getElementById('loading');
  if (loading) {
    loading.style.opacity = '0';
    // clear it from the display list after the animation,
    //  in case the browser still renders it at zero opacity
    setTimeout(() => loading.style.display = 'none', 1000);
  }
  // attach the stage to the document and fade it in
  container.appendChild(renderer.view);
  container.style.opacity = '1';
  // start the game loop
  PIXI.ticker.shared.add(onUpdate);
};

// game loop
let counter:number = 0;
const onUpdate = () => {
  if (counter++ % 2 == 0) {
    app.update();
    renderer.render(stage);
  }
};

onReady();