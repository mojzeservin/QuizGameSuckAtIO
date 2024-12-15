const express = require('express');
const app = express();

const ejs = require('ejs');
var session = require('express-session');
const moment = require('moment');

const http = require('http');
const server = http.createServer(app);
const socketio = require('socket.io');
const io = socketio(server);

let timeBetweenQuestions = 15;

require("dotenv").config();

const { games, createGame, joinGame, getUsersInGame, getUserFromGame, leaveGame, doesGameAlreadyExists, deleteGame, tryToStartGame, doesGameHaveQuestions, sendQuestionToGame, getGameReference, checkUsersAnswersInGame, getWinner } = require('./utils');


app.use('/assets', express.static('assets'));

app.get('/', (req, res)=>{
    res.render('index.ejs');
});

app.get('/game/:game/:user', (req, res)=>{
    session.game = req.params.game;
    session.user = req.params.user;
    res.render('game.ejs', { user: session.user, game: session.game });
});

io.on('connection', (socket)=>{
    console.log(socket.id);

    io.to(socket.id).emit("updateGamesList", games);
    
    let maxPlayerCount = 2
    socket.on("joinedGame", () => {
        if (doesGameAlreadyExists(session.game))
        {
            if (getUsersInGame(session.game).length > maxPlayerCount)
            {
                io.to(socket.id).emit('alert', "The game is full!");
                return;
            }

            if (getUsersInGame(session.game).find(gameUser => gameUser.name == session.user))
            {
                io.to(socket.id).emit('alert', "There is already a user with this name in the game!");
                return;
            }

            let user = {
                id: socket.id,
                name: session.user
            };

            joinGame(user, session.game);
            tryToStartGame(session.game, maxPlayerCount, () => {
                let timer = 6
                let countdown = setInterval(() => {
                    if (timer == 1)
                    {
                        clearInterval(countdown);

                        if (!doesGameHaveQuestions(session.game))
                        {
                            io.to(session.game).emit('message', 'System', `The game could not be started! Missing questions!`);
                            return;
                        }

                        io.to(session.game).emit('message', 'System', `The game has started!`);
                        sendQuestionToGame(timeBetweenQuestions, session.game, (questionIndex, question) => {
                            io.to(session.game).emit('message', 'System', questionIndex + 1 + ". " + question);
                        }, () => {
                            checkUsersAnswersInGame(session.game);  // maybe better scoring system

                            let winner = getWinner(session.game);
                            io.to(session.game).emit('message', 'System', winner.score == 0? "The game has ended! Noone won! Draw!" : " The game has ended! The winner is " + winner.name + "!");
                        });

                        return;
                    }

                    timer--;
                    io.to(session.game).emit('message', 'System', `The game starts in ${timer}!`);
                }, 1000);
            });
        }
        else
        {
            let user = {
                id: socket.id,
                name: session.user
            };

            createGame(user, session.game);
            io.emit("updateGamesList", games);
        }

        socket.join(session.game);

        io.to(session.game).emit("updateUsersListInGame", getUsersInGame(session.game));
        io.to(session.game).emit('userConnected', session.user);
    });

    socket.on('leaveGame', () => {
        leaveGame(socket.id, session.game);

        io.to(session.game).emit('message', 'System', `${session.user} left the game...`);
        io.to(session.game).emit('updateUsersListInGame', getUsersInGame(session.game));

        if (getUsersInGame(session.game).length === 0)
        {
            deleteGame(session.game);

            io.emit('updateGamesList', games);
        }
    });

    socket.on('sendMsg', (msg) => {
        let user = {
            id: socket.id,
            username: session.user
        }

        io.to(session.game).emit('message', user, msg);

        let game = getGameReference(session.game);

        if (game != null && game.currentQuestionIndex != -1)
        {
            getUserFromGame(socket.id, session.game).SetAnswer(game.currentQuestionIndex, msg);
        }
    });
});

server.listen(process.env.PORT, ()=>{
    console.log(`Server listening on http://localhost:${process.env.PORT}`);
});