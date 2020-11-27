var metaControlsApp = (() => { 

    var onPause,
        onUnpause,
        onRestart,
        onStart;

    var paused = false;
    var togglePause = realPauseToggle;

    var btnPause;

    function init(_onPause, _onUnpause, _onRestart, _onStart) {
        onPause = _onPause;
        onUnpause = _onUnpause;
        onRestart = _onRestart;
        onStart = _onStart;

        initBtns();
        document.addEventListener('keydown', keyboardListener);
        disablePause();
    }

    function initBtns() {
        btnPause = document.getElementById('pauseBtn');
        btnPause.onclick = () => togglePause();

        document.getElementById('restartBtn').onclick = () => restart();
    }

    function keyboardListener(e) {
        switch (e.code) {
            case 'KeyP':
                togglePause();
                break;
            case 'KeyR':
                restart();
                break;
        }
    }

    function realPauseToggle() {
        paused = !paused;

        if (paused) {
            btnPause.textContent = 'unpause';
            onPause();
        }
        else {
            btnPause.textContent = 'pause';
            onUnpause();
        }
    }

    function enablePause() {
        togglePause = realPauseToggle;
    }

    function disablePause() {
        togglePause = () => {};
    }

    function restart() {
        if (paused) {togglePause()}
        onRestart();
    }

    function start() {
        enablePause();
        onStart();
    }

    // exports
    window.metaControls = {
        init: (_onPause, _onUnpause, _onRestart, _onStart) => {
            init(_onPause, _onUnpause, _onRestart, _onStart);
        },
        enablePause: enablePause,
        disablePause: disablePause,
    }

})();
