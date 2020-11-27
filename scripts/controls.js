var controlsApp = (() => {

//    var left, right, down, hardDown, rotate, rotateCC, pause, restart;
    var onLeft,
        onRight,
        onDown,
        onHardDown,
        onRotate,
        onRotateCC;

    var touchControls = [];
    var controlsVisible = true;
    var numTouches = 0;

    var btnControlVisibility;

    onLeft = onRight = onDown = onHardDown = onRotate = onRotateCC = () => {};    // arbitrary init

    function init(_onLeft, _onRight, _onDown, _onHardDown, _onRotate, _onRotateCC) {
        onLeft = _onLeft;
        onRight = _onRight;
        onDown = _onDown;
        onHardDown = _onHardDown;
        onRotate = _onRotate;
        onRotateCC = _onRotateCC;

        initScreenSize();
    }

    function initScreenSize() {
        if (window.matchMedia('(max-width: 500px)').matches) {

            touchControls = createTouchControls();
            initVisibilityBtn();

            document.getElementById('controls-desktop').style.display = 'none';

        } else {
            document.getElementById('controls-mobile').style.display = 'none';
        }
    }

    function enableMovement() {
        document.addEventListener('keydown', movementListener);
        touchControls.map(c => c.style.visibility = 'visible');
    }

    function disableMovement() {
        document.removeEventListener('keydown', movementListener);
        touchControls.map(c => c.style.visibility = 'hidden');  // won't be touchable
    }

    function movementListener(e) {
        switch (e.code) {
            case 'ArrowLeft':
                onLeft();
                break;
            case 'ArrowRight':
                onRight();
                break;
            case 'ArrowDown':
                onDown();
//                //clearTicker();
//                lowerShape(currShape);
//                //setTicker();
                break;
            case 'ArrowUp':
                onHardDown();
//                fastFall(currShape);
//                clearTicker();
//                setTicker();
//                updateScore(2);
                break;
            case 'KeyA':
                onRotateCC();
                break;
            case 'KeyD':
                onRotate();
                break;
        }
    }

    //// for touch controls:

    function createTouchControls() {
        let viewW = document.documentElement.clientWidth;
        let viewH = document.documentElement.clientHeight;
        let headerH = document.getElementById('header').offsetHeight;

        let tl = createZone(headerH,
                            0,
                            Math.floor(viewH/2 - headerH/2),
                            'LEFT &#8592');

        let tr = createZone(headerH,
                            Math.floor(2 * viewW/3),
                            Math.floor(viewH/2 - headerH/2),
                            'RIGHT &#8594');

        let mid = createZone(headerH,
                             Math.floor(viewW/3),
                             Math.floor(viewH - headerH - 3),
                             'DOWN &#8595');

        let bl = createZone(Math.floor(viewH/2 + headerH/2),
                            0,
                            Math.floor(viewH/2 - headerH/2 - 2),
                            'ROTATE &#8634');

        let br = createZone(Math.floor(viewH/2 + headerH/2),
                            Math.floor(2 * viewW/3),
                            Math.floor(viewH/2 - headerH/2 - 2),
                            'ROTATE &#8635');

        addListeners(tl, tr, mid, bl, br);

        return [tl, tr, mid, bl, br];
    }

    function createZone(top, left, height, content) {
        // helper for creating touch controls

        let zone = document.createElement('div');
        zone.classList.add('touch');
        zone.style.width = '32.8%';
        zone.style.height = height + 'px';
        zone.style.top = top + 'px';
        zone.style.left = left + 'px';

        let inner = document.createElement('div');
        inner.innerHTML = content;
        inner.style.display = 'inline-block';
        inner.style.lineHeight = height + 'px';
        zone.appendChild(inner);

        document.getElementsByTagName('HTML')[0].appendChild(zone);
        return zone;
    }

    function addListeners(tl, tr, mid, bl, br) {

        tl.addEventListener('touchstart', onLeft);
        tr.addEventListener('touchstart', onRight);
        mid.addEventListener('touchstart', onDown);

        // interaction for touching these two at a time

        bl.addEventListener('touchend', () => {
            if (numTouches == 1) {
              onRotateCC(); // single touch
            } else {
              // just came back from a double touch so only need to reset
            }
            numTouches = 0;
        });

        br.addEventListener('touchend', () => {
            if (numTouches == 1) {
              onRotate();   // single touch
            } else {
              // just came back from a double touch so only need to reset
            }
            numTouches = 0;
        });

        bl.addEventListener('touchstart', () => {
            numTouches += 1;
            if (numTouches == 2) {onHardDown()} // together touch
        });

        br.addEventListener('touchstart', () => {
            numTouches += 1;
            if (numTouches == 2) {onHardDown()} // together touch
        });
    }

    function initVisibilityBtn() {
        btnControlVisibility = document.createElement('button');
        btnControlVisibility.addEventListener('click', toggleTouchControlsVisibility);

        document.getElementById('header').appendChild(btnControlVisibility);

        toggleTouchControlsVisibility();
    }

    function toggleTouchControlsVisibility() {
        controlsVisible = !controlsVisible;

        touchControls.map(c => c.style.opacity = (controlsVisible ? '50%' : '0'));

        btnControlVisibility.textContent =
            controlsVisible ? 'hide controls' : 'show controls';
    }

    //// exports
    window.controls = {
        init: (_onLeft, _onRight, _onDown, _onHardDown, _onRotate, _onRotateCC) => {
            init(_onLeft, _onRight, _onDown, _onHardDown, _onRotate, _onRotateCC);
        },
        enable: enableMovement,
        disable: disableMovement,
    }

})();
