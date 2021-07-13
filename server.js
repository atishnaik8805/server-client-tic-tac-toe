const app = require('express')();
// This below module is for reading the command line arguments in a better, understandable way
const argv = require('minimist')(process.argv.splice(2))
const http = require('http').Server(app)
var io = require('socket.io')(http);
// For reading the inputs from clients
const readline = require("readline");
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
//const args = process.argv
port = argv.port | 5050

let display = [
    ['_','_','_'],
    ['_','_','_'],
    ['_','_','_']
]

let choices=[1,2,3,4,5,6,7,8,9]
let winner = null
let gameData = {display, choices} 

let clients = 1;
let clientDetails ={'1' :null, '2': null}
let waiting = true;
let turn = 1
let moves = 1
let tie = false

// On getting a client connection
io.on('connection', function(socket){
    // Allowing 2 clients to get connected
    if (clients<=2) {
        if (clientDetails[clients]===null)
        clientDetails[clients] = socket.id;
        console.log(`Player ${clients} connected`);
        if (clients === 1) {
            waiting = true;
            io.to(clientDetails[1]).emit('Player1', {id: clientDetails[1],waiting});
        } else {
            waiting = false
            io.to(clientDetails[2]).emit('Player2', {id: clientDetails[2], waiting});
            io.to(clientDetails[1]).emit('Player1', {id: clientDetails[1], waiting});
            startGame()
        }

        clients = clients+1;
    } else {
        // Letting the additional client know capacity reached
        io.to(socket.id).emit('maxPlayers', {reason: 'Max players on load'});
    }

    // For every turn played b the clients
    socket.on("playTurn", (data)=> {
        // Checking if the client entered 'R' or 'r' to exit 
        if (data.play.toUpperCase() === 'R') {
            otherPlayerid = data.player === 1 ? '2' : '1';
            console.log(otherPlayerid)
            io.to(clientDetails[data.player]).emit('quit', {reason: 'Bye'});
            io.to(clientDetails[otherPlayerid]).emit('tie', {msg: 'Player Left'});
            io.close()
            process.exit()
        }
        //If the user enters continous to play.
        if (setValues(data)) {
            winner = computeWinner(data)
            // console.log('winer', winner)
            if (winner!==null) {
                sendWinner()
            } else {
                // console.log('winer some answer', winner)
                if (turn === 1) { turn = 2 } else { turn = 1 }
                io.to(clientDetails[turn]).emit('Player'+turn, {player : turn, turn ,id: clientDetails[turn], waiting, startGame: true, gameData});
            }
        } else {
            // If we enter tie or some invalid input is given
            if (tie) {
                io.emit('tie', {msg: 'Draw'})
            } else {
                io.emit('tie', {msg: 'Invalid Input'})
            }
        }
    })
});

// A function that triggers the game
function startGame() {
        io.to(clientDetails[turn]).emit('Player1', {player : turn, turn ,id: clientDetails[turn], waiting, startGame: true, gameData});    
}

//A function that sends winner
function sendWinner() {
if (winner === 'X') {
    io.to(clientDetails[1]).emit('Player1', {won: true});
    io.to(clientDetails[2]).emit('tie', {msg: 'You Loose'});
    close()
} else if (winner === 'O'){
    io.to(clientDetails[2]).emit('Player2', {won: true});
    io.to(clientDetails[1]).emit('tie', {msg: 'You Loose'});
    close()
}
}

// logic to compute
function computeWinner(data) {
let checkVal = ''
if (data.player === 1) {
    checkVal = 'X'
} else 
{
    checkVal = 'O'
}

for (let i = 0; i < 8; i++)
if (i<=2 && gameData.display[0][i] === checkVal &&
    gameData.display[1][i] === checkVal &&
    gameData.display[2][i] === checkVal ) {
     winner = checkVal   
    }
    else if (i>2 && i<=5 && gameData.display[i-3][0] === checkVal &&
        gameData.display[i-3][1] === checkVal &&
        gameData.display[i-3][2] === checkVal ) {
            winner = checkVal
        }
    else if (i>5 && i<=7) {
        if (i===6 && gameData.display[0][0] === checkVal &&
            gameData.display[1][1] === checkVal &&
            gameData.display[2][2] === checkVal ) {
                winner = checkVal
            } else if (i===7 && gameData.display[0][2] === checkVal &&
                gameData.display[1][1] === checkVal &&
                gameData.display[2][0] === checkVal) {
                    winner = checkVal
                }
    }
// console.log('winer val', winner)
if (winner!==null) {
    return winner
}
return null
}

function setValues(data) {
// console.log('da', data, moves)
if (moves >= 9) {
    tie = true
    return false
}
if (parseInt(data.play) >9 || parseInt(data.play)<=0){
    return false
} else if (gameData.choices.indexOf(parseInt(data.play))===-1) {
    return false;
}  else {
    // console.log(parseInt(data.play))
    moves= moves+1
    delete gameData.choices[parseInt(data.play)-1]
    let col = 0;
    if (parseInt(data.play) === 1 || parseInt(data.play) === 4 || parseInt(data.play) === 7 ) col = 0;
    if (parseInt(data.play) === 2 || parseInt(data.play) === 5 || parseInt(data.play) === 8 ) col = 1;
    if (parseInt(data.play) === 3 || parseInt(data.play) === 6 || parseInt(data.play) === 9 ) col = 2;
    if(data.player === 1) {
        // console.log(Math.floor((parseInt(data.play)-1)/3))
        gameData.display[Math.floor((parseInt(data.play)-1)/3)][col] = 'X'
    } else if (data.player === 2) {
        // console.log(Math.floor((parseInt(data.play)-1)/3))
        gameData.display[Math.floor((parseInt(data.play)-1)/3)][col] = 'O'
    }

    return true;
}
}

function close() {
    console.log('Game Completed!!')
    io.close()
    process.exit()
}

http.listen(port, () => console.log(`Active on ${port} port.\n`))