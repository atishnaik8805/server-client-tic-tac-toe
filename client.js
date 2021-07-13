// This below module is for reading the command line arguments in a better, understandable way
const argv = require('minimist')(process.argv.splice(2))
// For reading the inputs from clients
const readline = require("readline");
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let domain = argv.domain | 'localhost'
const port = argv.port | 5050 
if (domain!== 'localhost' && domain!== '127.0.0.1') {
    domain = 'localhost'
}

const url = 'http://'+domain+':'+port
// console.log('url', url)
// Connect to server
var io = require('socket.io-client')
var socket = io.connect(url, {reconnect: true});

// Add a connect listener
socket.on('connect', function(socket) { 
    console.log('Connected To the Server');
});

// For Displaying the Max number of players connected
socket.on("maxPlayers", (data) => {
    console.log(data.reason)
    socket.close()
    process.exit()
});

socket.on("Player1", (data) => {
    if(data.won) {
        console.log('You win');
        socket.close()
        process.exit()
    } 
    if (data.waiting) {
        if (socket.id === data.id)
        console.log('You are Player 1, waiting for two')
    } else {
        if (socket.id === data.id)
        console.log('Player 2 joined, Lets Play')
    }

    if (data.startGame && data.turn === parseInt(data.player)) {
        listTheChoices(data.gameData)
        rl.question("Choose the first", function(choice) {
            socket.emit('playTurn', {play:choice, player:1 ,id: data.id})
        });
    }
});

socket.on("Player2", (data) => {
    if(data.won) {
        console.log('You win');
        socket.close()
        process.exit()
    }
    if (data.waiting) {
        if (socket.id === data.id)
        console.log('Player 1 left, you are player 1 now')
    } else {
        if (socket.id === data.id)
        console.log('You are Player 2 , Lets Play')

    }

    if (data.startGame && data.turn === parseInt(data.player)) {
        listTheChoices(data.gameData)
        rl.question("Choose the Play", function(choice) {
            socket.emit('playTurn', {play:choice, player:2 ,id: data.id})
        });
    }
});


socket.on("tie", (data) => {
    console.log(data.msg)
    socket.close()
    process.exit()
});

socket.on("quit", (data) => {
    console.log(data.reason)
    socket.close()
    process.exit()
});


function listTheChoices(gameData) {
    console.log('Board Display')
    for(let i in gameData.display) {
        for (let j in gameData.display[i]) {
            if ((j+1)%3==0) {
                console.log(gameData.display[i][j] +'\n')
            } else {
                console.log(gameData.display[i][j])
            }
        }
    }
    console.log('\n')
    console.log('Choices')
    for(let value in gameData.choices) {
      console.log(gameData.choices[value]+',')
    }
    console.log('\n')
}