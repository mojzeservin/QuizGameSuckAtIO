const mysql = require("mysql");
//require("dotenv").config();
let { Game } = require("./classes");

let games = [];

let pool = mysql.createPool({
    connectionLimit : 10,
    host            : process.env.DBHOST,
    user            : process.env.DBUSER,
    password        : process.env.DBPASS,
    database        : process.env.DBNAME
});

function createGame(user, gameName)
{
    games.push(new Game(gameName));

    games.find(game => game.name == gameName).AddUser(user.id, user.name);
}

function joinGame(user, gameName)
{
    if (!doesGameAlreadyExists(gameName))
    {
        return;
    }

    games.find(game => game.name == gameName).AddUser(user.id, user.name);
}

function leaveGame(userID, gameName)
{
    if (!doesGameAlreadyExists(gameName))
    {
        return;
    }

    games.find(game => game.name == gameName).RemoveUser(userID);
}

function deleteGame(gameName)
{
    let index = games.findIndex(game => game.name == gameName);

    if (index != -1)
    {
        games.splice(index, 1);
    }
}

function getUsersInGame(gameName)
{
    if (!doesGameAlreadyExists(gameName))
    {
        return;
    }

    return games.find(game => game.name == gameName).users;
}

function getUserFromGame(userID, gameName)
{
    if (!doesGameAlreadyExists(gameName))
    {
        return;
    }

    return games.find(game => game.name == gameName).users.find(user => user.id == userID);
}

function doesGameAlreadyExists(gameName)
{
    return games.find(game => game.name == gameName)? true : false;
}

async function getQuestionsForGame(gameName)
{
    pool.query("SELECT * FROM questions ORDER BY rand() LIMIT 10", (err, results) => {
        if (err)
        {
            console.log(err);
            return;
        }

        if (!doesGameAlreadyExists(gameName))
        {
            return;
        }

        games.find(game => game.name == gameName).AddQuestions(results);
    });
}

function doesGameHaveQuestions(gameName)
{
    if (!doesGameAlreadyExists(gameName))
    {
        return;
    }

    return games.find(game => game.name == gameName).questions.length > 0? true : false;
}

async function tryToStartGame(gameName, playerCount, startGameCountdownCB)
{
    if (!doesGameAlreadyExists(gameName))
    {
        return;
    }

    let gameCopy = games.find(game => game.name == gameName);

    if (gameCopy.users.length == playerCount)
    {
        await getQuestionsForGame(gameName);
        startGameCountdownCB();
    }
}

function sendQuestionToGame(secondsBetweenQuestions, gameName, sendQuestionCB, endGameCB)
{
    if (!doesGameAlreadyExists(gameName))
    {
        return;
    }

    let questionIndex = -1;

    questionIndex++;
    games.find(game => game.name == gameName).currentQuestionIndex = questionIndex;
    sendQuestionCB(questionIndex, games.find(game => game.name == gameName).questions[questionIndex].question);

    let displayInterval = setInterval(() => {
        if (!doesGameAlreadyExists(gameName))
        {
            clearInterval(displayInterval);
            return;
        }

        questionIndex++;
        games.find(game => game.name == gameName).currentQuestionIndex = questionIndex;
        sendQuestionCB(questionIndex, games.find(game => game.name == gameName).questions[questionIndex].question);

        if (games.find(game => game.name == gameName).questions.length - 1 == questionIndex)
        {
            clearInterval(displayInterval);

            setTimeout(() => {
                endGameCB();
            }, secondsBetweenQuestions * 1000);
        }
    }, secondsBetweenQuestions * 1000);
}

function checkUsersAnswersInGame(gameName)
{
    if (!doesGameAlreadyExists(gameName))
    {
        return;
    }

    let game = games.find(game => game.name == gameName);

    game.users.forEach(user => {
        user.answers.forEach(answer => {
            if (game.questions[answer.id].answer == answer.text)
            {
                user.score++;
            }
        });
    });
}

function getWinner(gameName)
{
    if (!doesGameAlreadyExists(gameName))
    {
        return;
    }
    
    let game = games.find(game => game.name == gameName);

    game.users.sort((a, b) => {
        a.score > b.score;
    });

    return game.users[0];
}

function getGameReference(gameName)
{
    if (!doesGameAlreadyExists(gameName))
    {
        return;
    }

    return games.find(game => game.name == gameName);
}


module.exports = {
    games,
    createGame,
    joinGame,
    leaveGame,
    getUsersInGame,
    getUserFromGame,
    doesGameAlreadyExists,
    deleteGame,
    tryToStartGame,
    doesGameHaveQuestions,
    sendQuestionToGame,
    getGameReference,
    checkUsersAnswersInGame,
    getWinner
}