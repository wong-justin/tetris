var connectionA;
var connectionB;
var channelA;
var channelB;

var servers = null;
var pcConfig = null;
var pcConstraint = null;
var dataConstraint = null;

function simulateConnection() {
    
    connectionA = new RTCPeerConnection(pcConfig, pcConstraint);
    connectionB = new RTCPeerConnection(pcConfig, pcConstraint);
    
    // offers and answers

    connectionA.createOffer().then((offer) => {
        console.log(offer);
        connectionA.setLocalDescription(offer);
        
        // give offer to B
        
        var jsonifiedOffer = JSON.stringify(offer);
        console.log(jsonifiedOffer);
        offer = JSON.parse(jsonifiedOffer);
        
        connectionB.setRemoteDescription(offer);
        connectionB.createAnswer().then((answer) => {
            connectionB.setLocalDescription(answer);
            
            // give answer to A
            
            var jsonifiedAnswer = JSON.stringify(answer);
            console.log(jsonifiedAnswer);
            answer = JSON.parse(jsonifiedAnswer);
            
            connectionA.setRemoteDescription(answer);
        })
    });
    
    // ice candidate matching
    
    connectionA.onicecandidate = (e) => {
        if (e.candidate) {
            // give to B
            
//            var jsonifiedCandidate = JSON.stringify(e.candidate);
//            console.log(jsonifiedCandidate);
//            candidate = JSON.parse(jsonifiedCandidate);

            connectionB.addIceCandidate(e.candidate)
            .then(console.log('B got ice candidate'))
            .catch((err) => console.log(e));
        }
    }
    connectionB.onicecandidate = (e) => {
        if (e.candidate) {
            // give to A
            
//            var jsonifiedCandidate = JSON.stringify(e.candidate);
//            console.log(jsonifiedCandidate);
//            candidate = JSON.parse(jsonifiedCandidate);

            connectionA.addIceCandidate(e.candidate)
            .then(console.log('A got ice candidate'))
            .catch((err) => console.log(e));
        }
    }
    
    // communicating

    channelA = connectionA.createDataChannel('sendDataChannel', dataConstraint);
    channelA.onopen = () => console.log('send channel opened');
    channelA.onclose = () => console.log('send channel closed');

    connectionB.ondatachannel = (e) => {
        channelB = e.channel;
        channelB.onopen = () => console.log('recieve channel opened');
        channelB.onclose = () => console.log('receive channel closed');
        channelB.onmessage = (e) => console.log('received message: ' + e.data);
    }
}

// closing

function closeEverything() {
    channelA.addEventListener('close', (e) => {
        connectionA.close();
        connectionA = null;
    });
    channelB.addEventListener('close', (e) => {
        connectionB.close();
        connectionB = null;
    });
    channelA.close();
    channelB.close();
}

document.getElementById('connectBtn').onclick = simulateConnection;
document.getElementById('sendBtn').onclick = (e) => channelA.send('hello world B!');
document.getElementById('closeBtn').onclick = (e) => closeEverything();