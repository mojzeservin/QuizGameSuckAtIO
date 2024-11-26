const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const ejs = require('ejs');

const app = express();
var session = require('express-session');
const moment = require('moment');
const server = http.createServer(app);
const io = socketio(server);

const port = 3000;

const { users, rooms, userJoin, userLeave, getRoomUsers, getCurrentUser, inRoomsList, roomLeave } = require('./utils');

app.use('/assets', express.static('assets'));


app.get('/', (req, res)=>{
    res.render('index.ejs');
});

app.get('/chat/:room/:user', (req, res)=>{
    // let { name, room } = req.body;
    session.user = req.params.user;
    session.room = req.params.room;
    res.render('chat.ejs', {user:session.user, room:session.room});
});

io.on('connection', (socket)=>{
    console.log(socket.id)

    socket.on('getRoomList', ()=>{
        io.emit('updateRoomList', rooms)
    });

    socket.on('joinToChat', ()=>{
        let user = userJoin(socket.id, session.user, session.room);
        socket.join(session.room);
        io.to(session.room).emit('updateRoomUsers', getRoomUsers(session.room));
        io.to(session.room).emit('userConnected', user);
        if (!inRoomsList(session.room)){
            rooms.push(session.room);
            io.emit('updateRoomList', rooms); 
        }
    });

    socket.on('leaveChat', ()=>{
        let user = getCurrentUser(socket.id);
        userLeave(socket.id);
        io.to(user.room).emit('message', 'System', `${user.username} left the chat...`);
        io.to(user.room).emit('updateRoomUsers', getRoomUsers(user.room));
        if (getRoomUsers(user.room).length == 0){
            roomLeave(user.room)
            io.emit('updateRoomList', rooms); 
        }
    });

    socket.on('sendMsg', (msg)=>{
        let user = getCurrentUser(socket.id);
        io.to(user.room).emit('message', user, msg);
    });
});


server.listen(port, ()=>{
    console.log(`Server listening on http://localhost:${port}`);
});