const socket = io();

let nameField = document.querySelector('#name');
let gameField = document.querySelector('#game');
let gamesSelect = document.querySelector('#games');
let loginBtn = document.querySelector('#login');

loginBtn.addEventListener('click', ()=>{
    if (nameField.value == ''){
        alert('Missing username!');
        return;
    }

    if (gameField.value == '' && gamesSelect.value == ''){
        alert('Missing gamename!');
        return;
    }
    
    let username = nameField.value;
    let game = gameField.value;

    if (game == '')
    {
        game = gamesSelect.value;
        
    }

    document.location.href = `/game/${game}/${username}`;

});

socket.on("updateGamesList", (games) => {
    gamesSelect.innerHTML = '';
    gamesSelect.innerHTML = '<option value="" selected>Join to an existing room: </option>';
    games.forEach(game => {
        let option = document.createElement('option');
        option.value = game.name;
        option.innerText = game.name;
        gamesSelect.appendChild(option);
    });
});