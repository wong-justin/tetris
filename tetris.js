/* Justin Wong */

var gridW,
    gridH,
    gridPx,
    previewW,
    previewH,
    mainSpawn,
    previewSpawn,
    spawnDiff,
    roundSpeed,
    currShape,
    ticker,
    FRAME_MILLI = 1000/60,
    paused,
    lines,
    score,
    fixedData, 
    mainArea,
    previewArea,
    numTouch,
    controlsVisible;

let start = () => {
    updateScore(0);
    updateLines(0);
    setTicker();
    previewNextShape();
    grabNextShape();
    enableMovement();
    //togglePause();
}

let init = () => {
    // init components
    gridW = 10;
    gridH = 20;
    gridPx = 18;
    previewW = 4;
    previewH = 3;
    roundSpeed = 40 * FRAME_MILLI;
    paused = false;
    lines = 0;
    score = 0;
    numTouch = 0;
    controlsVisible = true;
    mainSpawn = rc(gridH - 1, Math.ceil(gridW/2)-2);
    previewSpawn = rc(gridH - 1, 0);
    spawnDiff = rc(mainSpawn.r - previewSpawn.r,
                   mainSpawn.c - previewSpawn.c);
    
    initPanes(); 
    initFixedData();
}

let initPanes = () => { 
    mainArea = document.getElementById("main");
    mainArea.style.width = px(gridW * gridPx);
    mainArea.style.height = px(gridH * gridPx);
    
    let overlay = document.getElementById("overlay");
    overlay.style.width = mainArea.style.width;
    overlay.style.height = mainArea.style.height;
    overlay.style.display = 'none';
    
    previewArea = document.getElementById("preview");
    previewArea.style.width = px(previewW * gridPx);
    previewArea.style.height = px(previewH * gridPx);
    previewArea.style.borderWidth = px(gridPx);

    let sidebar = document.getElementById("sidebar");
    sidebar.style.paddingLeft = px(gridPx);
}

let initFixedData = () => {
//    fixedData = new Array(gridW).fill().map
//    (o => new Array(gridH).fill(false));
    fixedData = new Array(gridW).fill();
    fixedData = fixedData.map(
        col => new Array(gridH).fill(false));
}

let logData = () => {
    let result = "";
    let r = gridH - 1;
    for (r; r >= 0; r--) {
        let c = 0;
        let line = "";
        for (c; c < gridW; c++) {
            if (fixedData[c][r]) {
                line += "O";
            } else {
                line += "*";
            }
        }
        line += "\n";
        result += line;
    }
    console.log(result);
}

let logRect = (rect) => {
    let {r, c} = posOf(rect);
    console.log(c + "," + r);
}

let restart = () => {
    while(mainArea.firstChild) {
        mainArea.lastChild.remove();
    }
    while(previewArea.firstChild) {
        previewArea.lastChild.remove();
    }
    clearTicker();
    init();
    start();
    //togglePause();
}

let togglePauseScreen = (on = true) => {
    let visible = on ? 'block' : 'none';
    document.getElementById('overlay').style.display = visible;
}

let togglePause = () => {
    if (paused) {
        togglePauseScreen(false);
        setTicker();
        enableMovement();
    } else { 
        togglePauseScreen(true);
        clearTicker();
        disableMovement();
    }
    paused = !paused;
}

let setTicker = () => {
    ticker = setInterval(tick, roundSpeed);
}

let clearTicker = () => {
    clearInterval(ticker);
}

let getAllRects = () => {
    return mainArea.getElementsByClassName("rect");
}

let getAllShapes = () => {
    return mainArea.getElementsByClassName("shape");
}

let createRect = (row, col) => {
    
    let {x0, y0} = posToPx(rc(row, col));
    let newRect = document.createElement("DIV");
    newRect.classList.add("rect");
    newRect.style.width = px(gridPx);
    newRect.style.height = px(gridPx);
    newRect.style.left = px(x0);
    newRect.style.top = px(y0);       
    return newRect;
}

let createShapeT = () => {
    let r = previewSpawn.r,
        c = previewSpawn.c;
    let r1 = rc(r-1, c+1),
        r2 = rc(r-1, c),
        r3 = rc(r, c+1),
        r4 = rc(r-1, c+2);
    return createShape("T", r1, r2, r3, r4);
}

let createShapeJ = () => {
    let r = previewSpawn.r,
        c = previewSpawn.c;
    let r1 = rc(r-1, c+1),
        r2 = rc(r, c),
        r3 = rc(r-1, c),
        r4 = rc(r-1, c+2);
    return createShape("J", r1, r2, r3, r4); 
}

let createShapeL = () => {
    let r = previewSpawn.r,
        c = previewSpawn.c;
    let r1 = rc(r-1, c+1),
        r2 = rc(r, c+2),
        r3 = rc(r-1, c),
        r4 = rc(r-1, c+2);
    return createShape("L", r1, r2, r3, r4); 
}

let createShapeS = () => {
    let r = previewSpawn.r,
        c = previewSpawn.c;
    let r1 = rc(r-1, c+1),
        r2 = rc(r, c+2),
        r3 = rc(r-1, c),
        r4 = rc(r, c+1);
    return createShape("S", r1, r2, r3, r4);
}

let createShapeZ = () => {
    let r = previewSpawn.r,
        c = previewSpawn.c;
    let r1 = rc(r-1, c+1),
        r2 = rc(r, c),
        r3 = rc(r-1, c+2),
        r4 = rc(r, c+1);
    return createShape("Z", r1, r2, r3, r4);
}

let createShapeO = () => {
    let r = previewSpawn.r,
        c = previewSpawn.c;
    let r1 = rc(r, c+1),
        r2 = rc(r, c+2),
        r3 = rc(r-1, c+2),
        r4 = rc(r-1, c+1);
    return createShape("O", r1, r2, r3, r4); 
}

let createShapeI = () => {    
    let r = previewSpawn.r,
        c = previewSpawn.c;
    let r1 = rc(r-1, c), 
        r2 = rc(r-1, c+1), 
        r3 = rc(r-1, c+2),
        r4 = rc(r-1, c+3);
    return createShape("I", r3, r4, r2, r1);
}

let createShape = (type, ...coords) => {
    // first point of coords will be labeled pivot
    let container = document.createElement("DIV");
    container.classList.add("shape");
    container.classList.add(type);
    
    let i = 0;
    for (i; i < coords.length; i++) {
        let {r, c} = coords[i];
        let rect = createRect(r, c);
        if(i == 0) {
            rect.classList.add("pivot");   
        }
        container.appendChild(rect);
    }
    return container;
}

let previewNextShape = () => {
    let rnd = Math.floor(Math.random() * 7);
    let nextShape;
    switch (rnd) {
        case 0:
            nextShape = createShapeS();
            break;
        case 1:
            nextShape = createShapeZ();
            break;
        case 2:
            nextShape = createShapeL();
            break; 
        case 3:
            nextShape = createShapeJ();
            break;
        case 4:
            nextShape = createShapeT();
            break;
        case 5:
            nextShape = createShapeO();
            break; 
        case 6:
            nextShape = createShapeI();
            break;    
    }
    previewArea.appendChild(nextShape);
}

let grabNextShape = () => {

    let nextShape = previewArea.lastChild;    
    
    mainArea.appendChild(nextShape);
    
    let up = spawnDiff.r, 
        right = spawnDiff.c;
    
    if (!moveShape(nextShape, up, right)) {
        // can't fit shape in spawn position so
        //      show losing piece in losing position
        Array.from(nextShape.children).map(
            (rect) => moveRect(rect, up, right));
        defeat();
        return;
    }
    
    currShape = nextShape;
    
    previewNextShape();
}

let willHitBottom = (rect) => {
    let {r, c} = posOf(rect);
    return r == 0 || fixedData[c][r-1] 
}

let stayAndCommit = (rect) => {
    let {r, c} = posOf(rect);
    fixedData[c][r] = true;
    //rect.style.backgroundColor = "purple";
}

let shapeWillHitBottom = (shape) => {
    let rects = Array.from(shape.children);

    return rects.map((rect) => willHitBottom(rect)).includes(true);
}

let forceLowerRectsAbove = (row) => {
    let allRects = getAllRects();
    let i = allRects.length - 1;
    for (i; i >= 0; i--) {
        let rect = allRects[i];
        let {r, c} = posOf(rect);
        if (r > row) {
            moveRect(rect, -1, 0);
        }
    }
}

let chkLineClear = (r) => {
    let c = 0;
    for (c; c < gridW; c++) {
        if (!fixedData[c][r]) {
            return false;
        }
    }
    return true;
}

let clearLine = (row) => {
    let allRects = getAllRects();
    let i = allRects.length - 1;
    for (i; i >= 0; i--) {
        let rect = allRects[i];
        let {r, c} = posOf(rect);

        if (r == row) {
            rect.remove();
        }
    }

    let c = 0;
    for (c; c < gridW; c++) {
        fixedData[c][row] = false;
    }
}

let clearLinesIfAny = () => {
    let numCleared = 0;
    let r = gridH - 1;
    for (r; r >= 0; r--) {
        if(chkLineClear(r)) {
            numCleared++;
            clearLine(r);
            lowerData(r);
            forceLowerRectsAbove(r);
        }
    }
    updateLines(numCleared);
    return numCleared;
}

let lowerShape = (shape) => {
    
    if (shapeWillHitBottom(shape)) {
        
        if (chkShapeMove(shape, 0, 0)) {
            Array.from(shape.children).map((rect) => stayAndCommit(rect));
            clearLinesIfAny();
            grabNextShape();    
        }
        else {  // already overlapping, must be at top and losing
            defeat();
        }            
    } else {
        moveShape(shape, -1, 0);
    }
}

let fastFall = (shape) => {
    while(!shapeWillHitBottom(shape)) {
        lowerShape(shape);
    }
    lowerShape(shape);
}

let coordsOf = (shape) => {
    let rects = Array.from(shape.children);
    rects = rects.map(rect => posOf(rect));
    return rects;
}

let findPivot = (shape) => {
    let rects = shape.children;
    let i = 0;
    for (i; i < rects.length; i++) {
        let rect = rects[i];
        if (rect.classList.contains("pivot")) {
            return posOf(rect);
        }
    }
    console.log('no pivot found :(');
}

let rotate = (coords, pivot, clockwise) => {        
    let relative = coords.map(({r, c}) => rc(r-pivot.r, c-pivot.c)); 

    let relRotate = relativeRotate(relative, clockwise);

    let unrelative = relRotate.map(({r, c}) => rc(r+pivot.r, c+pivot.c));

    return unrelative;
}  

let relativeRotate = (relCoords, clockwise) => {
    if (clockwise) {
        return relCoords.map((pos) => rc(-pos.c, pos.r));
    } else {
        return relCoords.map((pos) => rc(pos.c, -pos.r));
    }
}

let rotateShape = (shape, clockwise) => {    
    // calc new coords
    var resultCoords;
    let type = shape.classList[1];
    switch (type) {
        case "O":
            return;
            break;
        case "I":
            // rotating backwards around a middle pivot gives correct positions, just out of order
            var coords = coordsOf(shape);
            var pivot = findPivot(shape);
            
            if (!clockwise) {
                pivot = posOf(shape.children[2]);
            }
            let misCoords = rotate(coords, pivot, !clockwise);
            resultCoords = [misCoords[2], 
                            misCoords[3], 
                            misCoords[0], 
                            misCoords[1]];   
            break;
        default:
            var coords = coordsOf(shape);  
            var pivot = findPivot(shape);
            
            resultCoords = rotate(coords, pivot, clockwise);
            break;
    }  
    // check bounds on result
    let isValidRotation = !resultCoords.map(
        (pos) => chkBounds(pos)).includes(false);
    
    // execute
    if (isValidRotation) {
        resultCoords.map((pos, i) => moveToPos(shape.children[i], pos));
    }
}

let moveShape = (shape, up, right) => {
    if (chkShapeMove(shape, up, right)) {
        Array.from(shape.children).map(
            (rect) => moveRect(rect, up, right));
        return true;
    }
    else {
        return false;
    }
}

let moveRect = (rect, up, right) => {
    let pos = posOf(rect);
    let newPos = rc(pos.r + up, pos.c + right);
    moveToPos(rect, newPos);
}

let chkRectMove = (rect, up, right) => {
        let pos = posOf(rect);
        let newPos = rc(pos.r + up, pos.c + right);
        return chkBounds(newPos);
    }

let chkShapeMove = (shape, up, right) => {
    return !Array.from(shape.children).map(
        (rect) => chkRectMove(rect, up, right)).includes(false);
}

let chkBounds = (pos) => {
    let isProper = true;
    if (pos.r < 0 || pos.r >= gridH) {
        isProper = false;
    } else if (pos.c < 0 || pos.c >= gridW) {
        isProper = false;
    } else if (fixedData[pos.c][pos.r]) {
        isProper = false;
    }
    return isProper;
}

let lowerData = (row) => {
    let r = row + 1;
    for (r; r < gridH; r++) {
        let data = getRow(r);
        setRow(r-1, data);
    }
    setRow(r-1, new Array(gridW).fill(false));
}

let getRow = (r) => {
    let rowData = new Array(gridW);
    let c = 0;
    for (c; c < gridW; c++) {
        rowData[c] = fixedData[c][r];
    }
    return rowData;
}

let setRow = (r, data) => {
    let c = 0;
    for (c; c < gridW; c++) {
        fixedData[c][r] = data[c];
    }
}

let rc = (r, c) => ({r, c});

let px = (val) => val+"px";

let parsePx = (str) => parseInt( str.substring(0,str.length-2) );

let posToPx = (pos) => {
    let y0 = (gridH - 1 - pos.r) * gridPx;
    let x0 = (pos.c) * gridPx;
    return {x0, y0};
}

let pxToPos = (x0, y0) => {
    let r = gridH - 1 - (y0 / gridPx);
    let c = (x0 / gridPx);
    return {r, c};
}

let pxOf = (rect) => {
    let x0 = parsePx(rect.style.left);
    let y0 = parsePx(rect.style.top);
    return {x0, y0};
}

let posOf = (rect) => {
    let {x0, y0} = pxOf(rect);
    return pxToPos(x0, y0);
}

let moveToPos = (rect, pos) => {
    let {x0, y0} = posToPx(pos);
    rect.style.left = px(x0);
    rect.style.top = px(y0);
}

let defeat = () => {
    clearTicker();
    disableMovement();
    togglePauseScreen(true);
    console.log('defeat');
}

let disableMovement = () => {
    document.removeEventListener('keydown', movementListener);
    let controls = document.getElementsByClassName('touch');
    let i = 0;
    for (i; i < controls.length; i++) {
        controls[i].style.visibility = 'hidden';
    }
}

let enableMovement = () => {
    document.addEventListener('keydown', movementListener);
    let controls = document.getElementsByClassName('touch');
    let i = 0;
    for (i; i < controls.length; i++) {
        controls[i].style.visibility = 'visible';
    }
}

let movementListener = (e) => {
    if (e.code === "ArrowLeft") {
        moveShape(currShape, 0, -1);
    }
    else if (e.code === "ArrowRight") {
        moveShape(currShape, 0, 1);
    }
    else if (e.code === "ArrowDown") {
        //clearTicker();
        lowerShape(currShape);
        //setTicker();
    }
    else if (e.code === "ArrowUp") {
        
        fastFall(currShape);
        clearTicker();
        setTicker(); 
        updateScore(2);
    }
    else if (e.code === "KeyA") {
        rotateShape(currShape, false);
    }
    else if (e.code === "KeyD") {
        rotateShape(currShape, true);
    }
}

document.addEventListener('keydown', (e) => {
    if (e.code === "KeyP") {
        togglePause();
    }
    else if (e.code === "KeyR") {
        restart();
    }
});

let updateLines = (linesCleared = 0) => {
    lines += linesCleared;
    
    if (lines >= 90) {
        roundSpeed = 3 * FRAME_MILLI;
    } else if(lines >= 80) {
        roundSpeed = 5 * FRAME_MILLI;
    } else if(lines >= 70) {
        roundSpeed = 7 * FRAME_MILLI;
    } else if(lines >= 60) {
        roundSpeed = 9 * FRAME_MILLI;
    } else if(lines >= 50) {
        roundSpeed = 12 * FRAME_MILLI;
    } else if(lines >= 40) {
        roundSpeed = 15 * FRAME_MILLI;
    } else if(lines >= 30) {
        roundSpeed = 19 * FRAME_MILLI;
    } else if(lines >= 20) {
        roundSpeed = 25 * FRAME_MILLI;
    } else if(lines >= 10) {
        roundSpeed = 33 * FRAME_MILLI;
    }

    if (linesCleared !== 0) {
        clearTicker();
        setTicker();
    }
    
    document.getElementById("lines").innerHTML = lines;

    let points = Math.floor( 
        ((49 * FRAME_MILLI) - roundSpeed ) * 
        linesCleared * linesCleared);
    updateScore(points);
}

let updateScore = (newPoints = 0) => {
    score += newPoints;
    document.getElementById("score").innerHTML = score;
}

let tick = () => {
    if (currShape) {
        lowerShape(currShape);
    } else {
        console.log('tick but no shape');
    }
}

let createQuarterZone = (top, left, height, content) => {
    let test = document.createElement('DIV');
    test.classList.add('touch');
    test.style.width = '32.8%';
    test.style.height = px(height);
    test.style.position = 'absolute';
    test.style.top = px(top);
    test.style.left = px(left);
    
    let inner = document.createElement('DIV');
    inner.innerHTML = content;
    inner.style.display = 'inline-block';
    inner.style.lineHeight = px(height);
    test.appendChild(inner);
    
    // visual for testing
    test.style.backgroundColor = 'grey';
    test.style.opacity = '50%';
    test.style.border = '1px solid black';
        
    document.getElementsByTagName('HTML')[0].appendChild(test);
    return test;
}

let createTapControls = () => {    
    let viewW = document.documentElement.clientWidth;
    let viewH = document.documentElement.clientHeight;

    let headerH = document.getElementById('header').offsetHeight;
    
    
    let tl = createQuarterZone(headerH, 
                               0, 
                               Math.floor(viewH/2 - headerH/2),
                               'LEFT &#8592');
    tl.addEventListener('touchstart', function () {
        moveShape(currShape, 0, -1);
    });
    let tr = createQuarterZone(headerH, 
                               Math.floor(2 * viewW/3), 
                               Math.floor(viewH/2 - headerH/2),
                               'RIGHT &#8594');
    tr.addEventListener('touchstart', function () {
            moveShape(currShape, 0, 1);
    });
    
    let mid = createQuarterZone(headerH, 
                                Math.floor(viewW/3),
                                Math.floor(viewH - headerH - 3),
                                'DOWN &#8595');
    mid.addEventListener('touchstart', function () {
        lowerShape(currShape);
    })
    
    let bl = createQuarterZone(Math.floor(viewH/2 + headerH/2), 
                               0,
                               Math.floor(viewH/2 - headerH/2 - 2),
                               'ROTATE &#8634');
    bl.addEventListener('touchend', function () {
        if (numTouch == 1) {
          rotateShape(currShape, false);
        } else {
          // just came back from a double touch so reset
        }
        numTouch = 0;
    });
    let br = createQuarterZone(Math.floor(viewH/2 + headerH/2),
                               Math.floor(2 * viewW/3),
                               Math.floor(viewH/2 - headerH/2 - 2),
                               'ROTATE &#8635');
    br.addEventListener('touchend', function () {
        if (numTouch == 1) {
          rotateShape(currShape, true);
        } else {
          // just came back from a double touch so reset
        }
        numTouch = 0;
    });
    
    bl.addEventListener('touchstart', function () {
        numTouch += 1;
        if (numTouch == 2) {
            
            fastFall(currShape);
            clearTicker();
            setTicker(); 
            updateScore(2);
        }
    });
    br.addEventListener('touchstart', function () {
        numTouch += 1;
        if (numTouch == 2) {
            
            fastFall(currShape);
            clearTicker();
            setTicker(); 
            updateScore(2);
        }
    });
    return {tl, tr, mid, bl, br};
}

let toggleControlVisibility = () => {
    controlsVisible = !controlsVisible
    
    let controls = document.getElementsByClassName('touch');
    let i = 0;
    for (i; i < controls.length; i++) {
//        controls[i].style.visibility = 
//            controlsVisible ? 'visible' : 'hidden';
        controls[i].style.opacity = 
            controlsVisible ? '50%' : '0';
    }
    
    document.getElementById('toggle-controls').textContent = 
        controlsVisible ? 'hide controls' : 'show controls'
}

init();
if (window.matchMedia('(max-width: 500px)').matches) {
    
    console.log('skinny screen');
    window.onload = () => {
        
        let btnControlVisibility = document.createElement('BUTTON');
//        btnControlVisibility.textContent = 'toggle controls';
        btnControlVisibility.id = 'toggle-controls';
        btnControlVisibility.addEventListener('click', toggleControlVisibility); 
        
        document.getElementById('header').appendChild(btnControlVisibility);
    
        createTapControls();
        toggleControlVisibility();
    }
    document.getElementById('controls-desktop').style.display = 'none';
    
    
} else {
    document.getElementById('controls-mobile').style.display = 'none';
}


start();