const express = require("express");
const app = express();
const server = app.listen(process.env.PORT);
app.use(express.static('public'));

const socketIO = require('socket.io');
const io = socketIO(server);

io.sockets.on('connection', (socket) => {
    
    log('new connection: ' + socket.id + ' with app listening on ' + server.address().port);
    log('existing rooms: ' + JSON.stringify(io.sockets.adapter.rooms));
    
    function leaveRooms() {
        var olds = [];
        if (socket.rooms) {
            Object.keys(socket.rooms).forEach(oldRoom => {
                socket.leave(oldRoom);
                olds.push(oldRoom);
            });
        }
        log('left room(s) ' + olds.join(', '));
    }
    
    function join(room) {
        socket.join(room);
        log('you joined room ' + room);
    }

    socket.on('host or join', (room) => { 
        leaveRooms();
        
        if (room in io.sockets.adapter.rooms) {
            var numParticipants = io.sockets.adapter.rooms[room]['length'];
            log(numParticipants.toString() + ' in room ' + room);
            
            if (numParticipants < 2) {  // decided 2 max per room
                join(room);
                if (numParticipants + 1 == 2) {
                    // ready to start the p2p offer/answer process; tell other
                    socket.broadcast.to(room).emit('initiate p2p');
                }
            } else {
                log('room ' + room + ' is full');
            }
        } else {
            log('creating new room ' + room);
            join(room);
        }
    });
    
    socket.on('offer out', (room, data) => {
        log('recieved offer from ' + room);
        
        socket.broadcast.to(room).emit('offer in', data);
    });
    
    socket.on('answer out', (room, data) => {
        log('recieved answer from ' + room);
        
        socket.broadcast.to(room).emit('answer in', data);
    });
    
    socket.on('ice out', (room, ice) => {
        log('recieved ice from ' + room);
        
        socket.broadcast.to(room).emit('ice in', ice);
    });
        
    function log(message) {
        socket.emit('log', 'Server log: ' + message);
    }
});


app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html');
});