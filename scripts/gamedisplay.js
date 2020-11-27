var displayApp = (() => {

    var gridPx = 20,
        margin = 1,
        ROWS = 0,
        COLS = 0,
        bgColor = 'black';

    var curr,
        lastCoords;
    var ctx,
        overlay;

    // var Colors = {
    //   'J': 'blue',
    //   'O': 'green',
    // }

    function createShape(shape) {
      curr = shape;
      drawCoords(curr.coords, 'blue');
      lastCoords = curr.coords;
    }

    function drawCoords(coords, color) {
      // ctx.globalAlpha = 1;
      // ctx.strokeStyle = color;
      ctx.fillStyle = color;
      coords.map(([r, c]) => createUnit(r, c));
    }

    function updateShape(coords) {

      clearLastPosition();
      drawCoords(coords, 'blue');//curr.color
      lastCoords = coords;
      // curr.coords = coords;
    }

    function clearLastPosition() {
      lastCoords.map(([r, c]) => clearUnit(r, c));
      // drawCoords(lastCoords, 'rgb(255, 255, 255, 10)');
    }

    function createUnit(r, c) {
      // let oldStyle = ctx.fillStyle;
      ctx.fillRect(...unitRectCoords(r, c));

      // ctx.fillStyle = oldStyle;
    }

    function clearUnit(r, c) {
      ctx.clearRect(...unitRectCoords(r, c));
    }

    function unitRectCoords(r, c) {
      // return [x0, y0, width, height] for square unit at r,c
      // usage: someRectDrawingFunc(...unitRectCoords(r, c))
      let [x, y] = coordsToPxs(r, c);
      return [x+margin, y+margin, gridPx-2*margin, gridPx-2*margin];  // or maybe (x, y, gridPx, gridPx)
    }

    function coordsToPxs(r, c) {
        let y = (ROWS - 1 - r) * gridPx;
        let x = c * gridPx;
        return [x, y];
    }

    function updateBoard(oldState, newState) {
      iterBoard((r, c) => {
        let wasExisting = oldState[r][c];
        let isExisting = newState[r][c];
        if (wasExisting == isExisting) {
          return;
        }
        if (isExisting) createUnit(r, c);
        else clearUnit(r, c);
      });
    }

    function iterBoard(func) {
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          func(r, c);
        }
      }
    }

    function clearBoard() {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    function initPanes(r, c) {

      ROWS = r;
      COLS = c;
      let canvas = document.getElementById('canvas');
      canvas.style.width = (gridPx * c) + 'px';
      canvas.style.height = (gridPx * r) + 'px';
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      canvas.style.backgroundColor = bgColor;
      ctx = canvas.getContext('2d');

      overlay = document.getElementById('overlay');
      overlay.style.width = canvas.style.width;
      overlay.style.height = canvas.style.height;
      overlay.style.display = 'none';

      // OLD:
       // previewArea = document.getElementById('preview');
       // // previewArea.style.width = (previewW * gridPx) + 'px';
       // // previewArea.style.height = (previewH * gridPx) + 'px';
       // previewArea.style.width = (5 * gridPx) + 'px';
       // previewArea.style.height = (4 * gridPx) + 'px';
       // previewArea.style.borderWidth = (gridPx) + 'px';
//
       // let sidebar = document.getElementById('sidebar');
       // sidebar.style.paddingLeft = gridPx + 'px';
    }

    /**** Exports ****/
    window.gameDisplay = {
        init: initPanes,
        createShape: createShape,
        updateShape: updateShape,
        updateBoard: updateBoard,
        clear: clearBoard,
    }
})();
