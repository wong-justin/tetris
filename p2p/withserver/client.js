/* gloabl io */

// p2p connection with a signaling server

var rtcApp = (() => {
    var socket = io.connect();

    // main rtc variables
    var connection = null;
    var sendChannel = null;
    var receiveChannel = null;

    var iceCandidates = null; // queued until connection.remoteDescription is set

    // rtc configuration settings; all null would still be ok
    var pcConfig = {
        'iceServers': [{
            // STUN servers help matchmake different IPs.
            // there's enough free STUN servers out there for a side project like this.
            'urls': 'stun:stun.l.google.com:19302'

            // not really any free TURN servers for backup when p2p fails, 
            // but that would be slower than the desired pure p2p anyways.
        }]
    };
    var pcConstraint = null;
    var dataConstraint = null;

    var room = null;    // custom room id; could be auto-generated

    // widgets from html
    var roomInput = document.getElementById('roomInput');
    var connectBtn = document.getElementById('connectBtn');
    var sendBtn = document.getElementById('sendBtn');
    var messageInput = document.getElementById('messageInput');
    var messageOutput = document.getElementById('messageOutput');
    
    // callbacks supplied from importer
    var onReceive = null;
    var onReady = null;
    var onClose = null;

    async function connect(_room) {
        if (connection !== null) {
            await sendChannel.close();
        }
        console.log('connection is ' + (connection ? 'existing' : 'null'));

        room = _room;
        // tell signaling server I want to join or create this room 
        socket.emit('host or join', room);
    }


    ////// main p2p connection process

    socket.on('initiate p2p', () => {
        // server wants you to start offer process; 
        // you will five the offer and get the answer
        if (!connection) {
            initConnection();
        }

        console.log('server told me to start p2p connection');
        // create an offer, set as this local and give to peer to set as his remote
        connection.createOffer().then((offer) => {
            console.log('i sent an offer');

            connection.setLocalDescription(offer);

            socket.emit('offer out', room, offer);
        })
        .catch(err => console.log(err));
    });

    socket.on('offer in', (offer) => {
        // you will get the offer and give the answer
        if (!connection) {
            initConnection();
        }

        console.log('i received an offer');
        connection.setRemoteDescription(offer);

        // create an answer, set as this local and give to peer to set as his remote
        connection.createAnswer().then((answer) => {
            connection.setLocalDescription(answer);

            console.log('i sent an answer');

            socket.emit('answer out', room, answer);

            // dequeue ice now that this remote is set
            consumeQueuedIces();
        })
        .catch(err => console.log(err));            
    });

    socket.on('answer in', (answer) => {
        console.log('i received an answer');

        connection.setRemoteDescription(answer);

        // dequeue ice now that this remote is set
        consumeQueuedIces();
    });

    ////// ice

    socket.on('ice in', (candidate) => {
        // add ice candidate from peer

        if (connection.remoteDescription === null) {    // not set yet so add ice to queue
            iceCandidates.push(candidate);
        }   
        else {   // remote descrip is set so we can directly add ice now
            connection.addIceCandidate(candidate)
            .then(console.log('added ice candidate'))
            .catch((err) => console.log(err));
        }
    });

    async function consumeQueuedIces() {

        var len = iceCandidates.length;
        for (var i = 0; i < len; i++) {
            await connection.addIceCandidate(iceCandidates[i]);
        }
        console.log('added ' + len + ' ice candidates from queue');
    }

    ////// init of connection and channels

    function initConnection() {

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
            console.log('ice connection state: ' + connection.iceConnectionState);
            
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
        sendChannel.onopen = () => console.log('send channel opened');
        sendChannel.onclose = async () => {
            // use this channel onclose listener to close whole connection
            console.log('send channel closed');
            await connection.close();
            connection = null;
            
            onClose();
        }

        connection.ondatachannel = (e) => {
            receiveChannel = e.channel;
            receiveChannel.onopen = () => console.log('receive channel opened');
            receiveChannel.onclose = () => console.log('receive channel closed');

            // handle p2p data exchange
            receiveChannel.onmessage = (e) => onReceive(e.data);
        }   
    }

    // show server logs (debugging)
    socket.on('log', (message) => {
        console.log(message);
    });
    
    // exports
    window.rtcFunctions = {
        connect: (room) => connect(room),
        send: (data) => sendChannel.send(data),
        init: (_onReceive, _onReady, _onClose) => {
            onReceive = _onReceive;
            onReady = _onReady;
            onClose = _onClose;
        },
    }
})();