/* global io */

// p2p connection with a signaling server

var rtcApp = (() => {
    var socket = io.connect();

    // main rtc variables
    var connection = null;
    var sendChannel = null;
    var receiveChannel = null;

    var iceCandidates = null; // queued until connection.remoteDescription is set

    // rtc configuration settings
    var pcConfig = {
        'iceServers': [{
            // STUN servers help matchmake different IPs (ie. peers on different networks).
            // there's free STUN servers out there for a side project like this.
            'urls': 'stun:stun.l.google.com:19302'

            // not really any free TURN servers for backup when p2p fails, 
            // but that would be slower than the desired pure p2p anyways.
        }]
    };
    var pcConstraint = null;
    var dataConstraint = null;

    var room = null;    // custom room id; auto-generated would be nice
    
    // callbacks to be supplied from importer
    var onReceive = (data) => log(data);
    var onReady = () => log('READY');
    var onClose = () => log('CLOSED');
    
    var logsOn = false;

    ////// Main p2p connection process
    
    async function connect(_room) {
        if (connection !== null) {
            await sendChannel.close();
        }
        log('connection is ' + (connection ? 'existing' : 'null'));

        room = _room;
        // tell signaling server I want to join or create this room 
        socket.emit('host or join', room);
    }

    socket.on('initiate p2p', () => {
        // server wants you to start offer process; 
        // you will five the offer and get the answer
        if (!connection) {
            initConnection();
        }

        log('server told me to start p2p connection');
        // create an offer, set as this local and give to peer to set as his remote
        connection.createOffer().then((offer) => {
            log('i sent an offer');

            connection.setLocalDescription(offer);

            socket.emit('offer out', room, offer);
        })
        .catch(err => log(err));
    });

    socket.on('offer in', (offer) => {
        // you will get the offer and give the answer
        if (!connection) {
            initConnection();
        }

        log('i received an offer');
        connection.setRemoteDescription(offer);

        // create an answer, set as this local and give to peer to set as his remote
        connection.createAnswer().then((answer) => {
            connection.setLocalDescription(answer);

            log('i sent an answer');

            socket.emit('answer out', room, answer);

            // dequeue ice now that this remote is set
            consumeQueuedIces();
        })
        .catch(err => log(err));            
    });

    socket.on('answer in', (answer) => {
        log('i received an answer');

        connection.setRemoteDescription(answer);

        // dequeue ice now that this remote is set
        consumeQueuedIces();
    });

    ////// Ice functions

    socket.on('ice in', (candidate) => {
        // add ice candidate from peer

        if (connection.remoteDescription === null) {    // not set yet so add ice to queue
            iceCandidates.push(candidate);
        }   
        else {   // remote descrip is set so we can directly add ice now
            connection.addIceCandidate(candidate)
            .then(log('added ice candidate'))
            .catch((err) => log(err));
        }
    });

    async function consumeQueuedIces() {

        var len = iceCandidates.length;
        for (var i = 0; i < len; i++) {
            await connection.addIceCandidate(iceCandidates[i]);
        }
        log('added ' + len + ' ice candidates from queue');
    }

    ////// Init of connection and channels

    function initConnection() {
        // called on every new connection session

        connection = new RTCPeerConnection(pcConfig, pcConstraint);
        iceCandidates = [];
        initChannels();
        connection.onicecandidate = (e) => {
            // this connection wants to send out an ice candidate
            if (e.candidate) {
                socket.emit('ice out', room, e.candidate);
            }
        }
        connection.oniceconnectionstatechange = (e) => {
            log('ice connection state: ' + connection.iceConnectionState);
            
            switch (connection.iceConnectionState) {
                case 'connected':
                    onReady();
                    break;
//                case 'failed':
//                    // restart
//                    console.log('trying to restart ice');
//                    connection.createOffer({iceRestart: true}).then((offer) => {
//                        console.log('i sent an offer');
//                        console.log(offer);
//
//                        connection.setLocalDescription(offer);
//
//                        socket.emit('offer out', room, offer);
//                    })
//                    .catch(err => console.log(err));
//                    break;
            }
        }
    }

    function initChannels() {

        sendChannel = connection.createDataChannel('sendDataChannel', dataConstraint);
        sendChannel.onopen = () => log('send channel opened');
        sendChannel.onclose = async () => {
            // use this channel onclose listener to close whole connection
            log('send channel closed');
            await connection.close();
            connection = null;
            
            onClose();
        }

        connection.ondatachannel = (e) => {
            receiveChannel = e.channel;
            receiveChannel.onopen = () => log('receive channel opened');
            receiveChannel.onclose = () => log('receive channel closed');

            // handle p2p data exchange
            receiveChannel.onmessage = (e) => onReceive(e.data);
        }   
    }

    // show server logs (debugging)
    socket.on('log', (message) => {
        log(message);
    });
    
    function log(message) {
        if (logsOn) {
            console.log(message);
        }
    }
    
    // exports
    window.rtcFunctions = {
        connect: (room) => connect(room),
        send: (data) => sendChannel.send(data),
        init: ({_onReceive = null, _onReady = null, _onClose = null, _logsOn = false} = {}) => {
            onReceive = _onReceive ? _onReceive : onReceive;
            onReady = _onReady ? _onReady : onReady;
            onClose = _onClose ? _onClose : onClose;
            logsOn = _logsOn;
        },
    }
})();