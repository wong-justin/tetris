const express = require("express");
const app = express();
const server = app.listen(3000);
// const listener = app.listen(process.env.PORT, () => {
//   console.log("Your app is listening on port " + listener.address().port);
// });
app.use(express.static('public'));

const socketIO = require('socket.io');
const io = socketIO(server);

var rooms = [];
var fullRooms = [];

io.sockets.on('connection', (socket) => {
    
    log('new connection: ' + socket.id);
    
    function log(message) {
        socket.emit('log', 'Server log: ' + message);
    }

    socket.on('host or join', (room) => {        
        log('curr rooms: ' + JSON.stringify(io.sockets.adapter.rooms));
        
        if (room in io.sockets.adapter.rooms) {
            var numParticipants = io.sockets.adapter.rooms[room]['length'];
            log(numParticipants.toString() + ' in room');
            
            if (numParticipants < 2) {
                socket.join(room);
                if (numParticipants + 1 == 2) {
                    socket.broadcast.to(room).emit('initiate p2p');
                }
            } else {
                log('room ' + room + ' is full');
            }
        } else {
            log('creating new room ' + room);
            socket.join(room);
        }
    });
    
    socket.on('offer out', (room, data) => {
        log('recieved offer from ' + room);
        
        socket.broadcast.to(room).emit('offer in', data);
//        socket.broadcast('offer in', data);
    });
    
    socket.on('answer out', (room, data) => {
        log('recieved answer from ' + room);
        
        socket.broadcast.to(room).emit('answer in', data);
    });
    
    socket.on('ice out', (room, ice) => {
        log('recieved ice from ' + room);
        
        socket.broadcast.to(room).emit('ice in', ice);
    });
  
    socket.on('message', (message) => {
        console.log(message);
        socket.emit('answer', 'ill help you');
    });
});



app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html');
});


