var gameApp = (() => {

    var ROWS, COLS,
        currShape,
        boardState,
        spawnPos,
        speed,
        ticker,
        score;

    var onUpdate,
        onBoardUpdate,
        onCreate,
        onDefeat;

    const MS_PER_FRAME = 1000/60;

    const spawns = {  // given pos, these are rel coords based around it
        T: [[-1, 1], [-1, 0], [ 0, 1], [-1, 2]],
        J: [[-1, 1], [ 0, 0], [-1, 0], [-1, 2]],
        L: [[-1, 1], [ 0, 2], [-1, 0], [-1, 2]],
        S: [[-1, 1], [ 0, 2], [-1, 0], [ 0, 1]],
        Z: [[-1, 1], [ 0, 0], [-1, 2], [ 0, 1]],
        O: [[ 0, 1], [ 0, 2], [-1, 2], [-1, 1]],
        I: [[-1, 0], [-1, 1], [-1, 2], [-1, 3]],
    };

    // transformations on curr shape

    function rotate(clockwise=true) {

      let newCoords;
      switch (currShape.type) {
        case 'O':
          return;
        case 'I':   // hacky workaround for special case
          let pivot = clockwise ? currShape.coords[2] : currShape.coords[1];
          newCoords = rotateAround(pivot, !clockwise).reverse();
          break;
        default:
          newCoords = rotateAround(currShape.coords[0], clockwise);
      }

      checkNewCoords(newCoords, {
        onSuccess: assign,
        onFail: () => console.log('cannot rotate'),
      });
    }

    function rotateAround([r0, c0], clockwise) {
      // returns curr coords rotated 90 degrees.
      // works by normalizing around pivot point r0, c0
      return currShape.coords
        .map(([r, c]) => [r-r0, c-c0])
        .map(([r, c]) => clockwise ? [-c, r] : [c, -r])
        .map(([r, c]) => [r+r0, c+c0]);
    }

    function lower() {
      checkNewCoords(shifted(-1, 0), {
        onSuccess: assign,
        onFail: () => {
          settle();
          clearLinesIfAny();
          randNewShape();
        }
      });
    }

    function shifted(dr, dc) {
      // new coords if currShape was shifted + dr rows, + dc cols
      return currShape.coords.map(([r, c]) => [r + dr, c + dc]);
    }

    function checkNewCoords(newCoords, {onSuccess, onFail}) {
      // perform onSuccess(newCoords) if new coords are valid, else onFail
      if ( isValid(newCoords) ) {
        if (onSuccess) onSuccess(newCoords);
      } else {
        if (onFail) onFail();
      }
    }

    function isValidPos([r, c]) {
      // check a unit at r,c
      return !((r < 0 || r >= ROWS) ||  // out of bounds R
               (c < 0 || c >= COLS) ||  // out of bounds C
               (boardState[r][c]));       // overlaps existing
    }

    function isValid(coords) {
      // check an iterable of units at r,c
      return coords.every(pos => isValidPos(pos));
    }

    function assign(newCoords) {
      // update currShape coords
      currShape.coords = newCoords;
      update();
    }

    function update() {
      // let outside know that curr shape changed
      onUpdate(currShape.coords);
    }

    function createShape(type, spawnPos) {

        var coords = spawns[type].map(([dr, dc]) => [spawnPos[0] + dr, spawnPos[1] + dc]);

        checkNewCoords(coords, {
          onSuccess: () => {  // create
            var shape = {
                type: type,
                coords: coords,
                rotation: 0,
                pos: spawnPos,  // pos ~= origin
            };
            currShape = shape;
            onCreate(shape);
          },
          onFail: defeat, // board is stacked up to spawn; new would overlap
        });
    }

    function randNewShape() {
      let type = randChoice(Object.keys(spawns));
      createShape(type, spawnPos);
    }

    function randChoice(arr) {
      let n = Math.floor(Math.random() * arr.length);
      return arr[n];
    }

    // updating board state

    function clearLinesIfAny() {
      let oldState = Array.from(boardState);
      let numCleared = 0;
      let r = ROWS - 1;
      for (r; r >= 0; r--) {
          if (rowIsFilled(r)) {
              numCleared++;
              clearRow(r);
              lowerDataAbove(r);
              onBoardUpdate(oldState, boardState);
          }
      }
      // updateLines(numCleared);
      return numCleared;
    }

    function rowIsFilled(r) {
      return boardState[r].every(c => c == true);
    }

    function clearRow(r) {
      boardState[r] = new Array(COLS).fill(false);
    }

    function lowerDataAbove(r) {
      r += 1;
      for (r; r < ROWS; r++) {
          boardState[r-1] = Array.from(boardState[r]);
      }
      boardState[r-1] = new Array(COLS).fill(false);
    }

    function settle() {
      // make shape permanent in board state
      currShape.coords.map(([r, c]) => {
        boardState[r][c] = true;
      });
    }

    /**** Meta Controls ****/

    function pause(on=true) {
        if (on) {
            clearTicker();
        }
        else {
            lower();
            setTicker();
        }
    }

    function start() {
        initState();
        randNewShape();
        setTicker();
    }

    function restart() {
        clearTicker();
        start();
    }

    function defeat() {
        clearTicker();
//        togglePauseScreen(true);
        onDefeat();
    }

    function tick() {
        if (currShape) {
          lower();
          // console.log('tick')
          // clearTicker();  // debugging; stalls in place
        }
    }

    function initState() {
        boardState = new Array(ROWS).fill()
            .map(col => new Array(COLS).fill(false));
        setSpeedFPS(20);
        score = 0;
    }

    function initSize(r, c) {
        ROWS = r;
        COLS = c;
        spawnPos = [r - 1, Math.floor(c/2) - 2];
    }

    function setTicker() {ticker = setInterval(tick, speed)}

    function clearTicker() {clearInterval(ticker)}

    function setSpeedFPS(fps) {speed = fps * MS_PER_FRAME}

    /**** Exports ****/
    window.game = {
        init: (_onCreate, _onUpdate, _onDefeat, _onBoardUpdate, r=20, c=10) => {
            onCreate = _onCreate;
            onUpdate = _onUpdate;
            onBoardUpdate = _onBoardUpdate;
            onDefeat = _onDefeat;
            initSize(r, c);
        },
        left:  () => checkNewCoords(shifted(0,-1), {onSuccess: assign}),
        right: () => checkNewCoords(shifted(0, 1), {onSuccess: assign}),
        fastFall: () => {
          while ( isValid(shifted(-1, 0)) ) {
            lower();
          }
          lower();
        },
        // lower: () => {
        //   clearTicker();
        //   lower();
        //   setTicker();
        // },
        lower: lower,
        rotate: rotate,
        pause: pause,
        start: start,
        restart: restart,
    }
})();
