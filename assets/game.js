let usersListBox = document.querySelector('#usersList');
let messagesBox = document.querySelector('#messages');
let leaveGameBtn = document.querySelector('#leaveRoomBtn');
let sendBtn = document.querySelector('#sendBtn');
let newMsgField = document.querySelector('#newmsg');

const socket = io();

socket.emit("joinedGame");

socket.on("updateUsersListInGame", (users) => {
    usersListBox.innerHTML = '';
    let ul = document.createElement('ul');
    usersListBox.appendChild(ul);
    users.forEach(user => {
        let li = document.createElement('li');
        li.innerText = user.name;
        ul.appendChild(li);
    });
});

socket.on('userConnected', (username)=>{
    renderMessage('System', username + ' connected to the game...');
});

socket.on('message', (from, message)=>{
    renderMessage(from, message);
});

socket.on('alert', (msg) => {
    window.location.href = "/";
    alert(msg? msg : "Error");
});

leaveGameBtn.addEventListener('click', ()=>{
    socket.emit('leaveGame');
});

sendBtn.addEventListener('click', ()=>{
    if (newMsgField.value != ''){
        socket.emit('sendMsg', newMsgField.value);
        newMsgField.value = '';
    }
});

newMsgField.addEventListener('keypress', (event)=>{
    if (event.key === 'Enter'){
        if (newMsgField.value != ''){
            socket.emit('sendMsg', newMsgField.value);
            newMsgField.value = '';
        }
    } 
});

function renderMessage(sender, message){
    let newMessage = document.createElement('div');
    newMessage.classList.add('msg');
   
    if (sender.id == socket.id){
        newMessage.classList.add('outgoing');
    }
    else
    {
        if (sender == 'System')
        {
            newMessage.classList.add('system');
            sender = {
                username: 'System'
            }
        }
        else
        {
            newMessage.classList.add('incoming');
        }
    }

    newMessage.innerHTML =  '<strong>' + sender.username + '</strong><br><p>' + message + '</p>';
    let timestamp = document.createElement('span');
    timestamp.innerText = moment(new Date()).format('YYYY.MM.DD - H:mm');
    timestamp.classList.add('timestamp');
    newMessage.appendChild(timestamp);
    messagesBox.appendChild(newMessage);
    messagesBox.scrollTo({ top: messagesBox.scrollHeight });
}