const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const ejs = require('ejs');

const app = express();
var session = require('express-session');
const moment = require('moment');
const server = http.createServer(app);
const io = socketio(server);

var mysql = require('mysql');
require("dotenv").config();

var pool  = mysql.createPool({
  connectionLimit : 10,
  host            : process.env.DBHOST,
  user            : process.env.DBUSER,
  password        : process.env.DBPASS,
  database        : process.env.DBNAME
});

const port = process.env.PORT;

const { users, rooms, userJoin, userLeave, getRoomUsers, getCurrentUser, inRoomsList, roomLeave } = require('./utils');

app.use('/assets', express.static('assets'));


app.get('/', (req, res)=>{
    res.render('index.ejs');
});

app.get('/game/:room/:user', (req, res)=>{
    session.user = req.params.user;
    session.room = req.params.room;
    res.render('game.ejs', {user:session.user, room:session.room});
});

io.on('connection', (socket)=>{
    console.log(socket.id)

    socket.on('getRoomList', ()=>{
        io.emit('updateRoomList', rooms);
    });

    socket.on('joinToChat', ()=>{
        if (getRoomUsers(session.room).length > 1)
        {
            io.to(socket.id).emit('alert', "The game is full!");
            return;
        }

        if (getRoomUsers(session.room).find(roomUser => roomUser.username == session.user))
        {
            io.to(socket.id).emit('alert', "There is already a user with this name in the room!");
            return;
        }

        let user = userJoin(socket.id, session.user, session.room);
        socket.join(session.room);
        io.to(session.room).emit('updateRoomUsers', getRoomUsers(session.room));
        io.to(session.room).emit('userConnected', user);
        if (!inRoomsList(session.room)){
            rooms.push(session.room);
            io.emit('updateRoomList', rooms);
        }

        if (getRoomUsers(session.room).length == 2)
        {
            StartGameCountdown(user.room);
        }
    });

    socket.on('leaveChat', ()=>{
        let user = getCurrentUser(socket.id);
        userLeave(socket.id);
        io.to(user.room).emit('message', 'System', `${user.username} left the game...`);
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

function StartGameCountdown(userRoom)
{
    let timeToStart = 5;
    let startCountdown = setInterval(() => {
        io.to(userRoom).emit('message', 'System', `The game starts in ${timeToStart}!`);
        timeToStart--;

        if (timeToStart == 0)
        {
            setTimeout(() => {
                io.to(userRoom).emit('message', 'System', `The game has started!`);
                StartGame(userRoom);
                clearInterval(startCountdown);
            }, 1000);
        }
    }, 1000);
}

function StartGame(userRoom)
{
    let timeTilNextQuestion = 2000;
    let questionIndex = 0;

    pool.query(`SELECT * FROM questions ORDER BY rand() LIMIT 10`, (err, results) => {
        if (err)
        {
            io.to(userRoom).emit('message', 'System', `Failed to start the game!`);
        }

        io.to(userRoom).emit('message', 'System', `${questionIndex + 1}. ${results[questionIndex].question}`);
        questionIndex++;
        
        let questionSequence = setInterval(() => {
            io.to(userRoom).emit('message', 'System', `${questionIndex + 1}. ${results[questionIndex].question}`);
            questionIndex++;

            if (questionIndex == 10)
            {
                setTimeout(() => {
                    io.to(userRoom).emit('message', 'System', `The game has ended!`);
                    clearInterval(questionSequence); 
                }, timeTilNextQuestion);
            }
        }, timeTilNextQuestion);
    });
}

server.listen(port, ()=>{
    console.log(`Server listening on http://localhost:${port}`);
});