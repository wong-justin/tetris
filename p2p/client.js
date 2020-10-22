var socket = io.connect();

var servers = null;
var pcConfig = null;
var pcConstraint = null;
var dataConstraint = null;

var connection = new RTCPeerConnection(pcConfig, pcConstraint);
var sendChannel = null;
var recieveChannel = null;

var room = '9887654321abc';  // input.value

// on joinBtn.click
socket.emit('host or join', room);

////// ice

connection.onicecandidate = (e) => {
    if (e.candidate) {
        socket.emit('ice out', room, e.candidate);
    }
}

socket.on('ice in', (candidate) => {
    
    connection.addIceCandidate(candidate)
    .then(console.log('got ice candidate'))
    .catch((err) => console.log(err));
});

////// main connection

socket.on('initiate p2p', () => {
    // you are the (first) sender
    
    connection.createOffer().then((offer) => {
        console.log('i sent an offer');
        console.log(offer);
        
        connection.setLocalDescription(offer);
        
        socket.emit('offer out', room, offer);
    });
});

socket.on('offer in', (offer) => {
    // you are the (first) reciever
    
    console.log('i received an offer');
    console.log(offer);
    
    connection.setRemoteDescription(offer);
    connection.createAnswer().then((answer) => {
        connection.setLocalDescription(answer);
        
        console.log('i sent an answer');
        console.log(answer);
            
        socket.emit('answer out', room, answer);
    });            
});

socket.on('answer in', (answer) => {
    console.log('i received an answer');
    console.log(answer);
    
    connection.setRemoteDescription(answer);
});

////// channel

initiateChannels();

function initiateChannels() {
    
    sendChannel = connection.createDataChannel('sendDataChannel', dataConstraint);
    sendChannel.onopen = () => console.log('send channel opened');
    sendChannel.onclose = () => console.log('send channel closed');

    connection.ondatachannel = (e) => {
        recieveChannel = e.channel;
        recieveChannel.onopen = () => console.log('recieve channel opened');
        recieveChannel.onclose = () => console.log('receive channel closed');
        recieveChannel.onmessage = (e) => console.log('received message: ' + e.data);
    }   
}

document.getElementById('sendBtn').onclick = (e) => sendChannel.send('hello from the other side!');

socket.on('log', (message) => {
    console.log(message);
});