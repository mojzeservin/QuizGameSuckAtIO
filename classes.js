class User
{
    constructor(userID, userName) {
        this.id = userID;
        this.name = userName;
        this.answers = this.GenerateAnswerPlaceholders();
        this.score = 0;
    }

    GenerateAnswerPlaceholders()
    {
        let answerPlaceholders = [];

        for (let index = 0; index < 10; index++)
        {
            let answer = {
                id: index,
                text: "-"
            };

            answerPlaceholders.push(answer);
        }

        return answerPlaceholders;
    }

    SetAnswer(answerIndex, answer)
    {
        this.answers[answerIndex].text = answer;
    }
}

class Game
{
    constructor(gameName) {
        this.name = gameName;
        this.users = [];
        this.questions = [];
        this.currentQuestionIndex = -1;
    }

    AddUser(userID, userName)
    {
        this.users.push(new User(userID, userName));
    }

    RemoveUser(userID)
    {
        let index = this.users.findIndex(user => user.id == userID);

        if (index != -1){
            this.users.splice(index, 1);
        }
    }

    AddQuestions(dbQuestions)
    {
        dbQuestions.forEach(dbQuestion =>
        {
            this.questions.push(dbQuestion);
        });
    }
}

module.exports = {
    User,
    Game
}