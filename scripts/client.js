/* global controls, metaControls, game, gameDisplay */

function startEverything() {
    console.log('start');
    controls.enable();
    metaControls.enablePause();
    game.start();
}

controls.init(
    game.left,
    game.right,
    game.lower,
    game.fastFall,
    () => {
        console.log('rotate');
        game.rotate(true);
    },
    () => {
        console.log('rotate cc');
        game.rotate(false);
    },
);

metaControls.init(
    () => {
        console.log('pause');
        controls.disable();
        game.pause(true);
    },
    () => {
        console.log('unpaused');
        controls.enable();
        game.pause(false);
    },
    () => {
        console.log('restart');
        controls.enable();
        metaControls.enablePause();
        gameDisplay.clear();
        game.restart();
    },
    startEverything,
);

var r = 20;
var c = 10;

game.init(
    (type, coords) => {
        gameDisplay.createShape(type, coords);
    },
    (coords) => {
        gameDisplay.updateShape(coords);
    },
    () => {
        controls.disable();
        metaControls.disablePause();
        console.log('defeat');
    },
    gameDisplay.updateBoard,
    r,
    c,
);

gameDisplay.init(r, c);
startEverything();
