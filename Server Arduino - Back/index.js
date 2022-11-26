const SOCKET_PORT = 3500;
const PORT = 3000;

const express = require('express');
const cors = require('cors');
const five = require('johnny-five');

const io = require('socket.io')(SOCKET_PORT, {
    cors: {
        origin: ['http://localhost:4000']
    }
});

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cors());

function createArduinoMatrix(matrix) {
    let aMatrix = []
    let row, byte, curByte;
    for (let i = 0; i < 16; i++) {
        row = []
        byte = "";
        curByte = 0;
        for (let j = 0; j < 80; j++) {
            if (curByte < 5) {
                byte += matrix[i][j].toString();
                curByte += 1;
            }
            else {
                row.push(byte);
                curByte = 1;
                byte = "";
                byte += matrix[i][j].toString();
            }
        }
        row.push(byte);
        aMatrix.push(row);
    }

    let finalMatrix = [[], []]
    let index;
    for (let i = 0; i < 16; i++) {
        index = 1;
        if (i < 8)
            index = 0;

        for (let j = 0; j < 16; j++) {
            if (i == 0 || i == 8)
                finalMatrix[index].push([aMatrix[i][j]])
            else
                finalMatrix[index][j].push(aMatrix[i][j])
        }
    }
    for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 16; j++) {
            for (let z = 0; z < 8; z++) {
                finalMatrix[i][j][z] = parseInt(finalMatrix[i][j][z], 2);
            }
        }
    }

    return finalMatrix;
}

const users = {};
let curMatrix = [];
for (let i = 0; i < 16; i++) {
    let row = []
    for (let j = 0; j < 80; j++) {
        row.push(0);
    }
    curMatrix.push(row);
}

// Start server listening
app.listen(PORT, () => {
    console.log(`Server is listening on http://localhost:${PORT}`);
})

// Sends users for page startup
app.get('/users', (req, res) => {
    return res.json({"users": users});
})

// Sends matrix for page startup
app.get('/matrix', (req, res) => {
    return res.json({"matrix": curMatrix});
})


io.on('connection', socket => {
    // update users & send to everyone
    users[socket.id] = socket.handshake.query.user;
    io.emit('receive-users', users);

    // receive matrix & update for everyone except sender
    socket.on('send-matrix', matrix => {
        curMatrix = matrix;
        socket.broadcast.emit('receive-matrix', curMatrix);
    })

    // disconnect socket & update for everyone
    socket.on('disconnect', () => {
        delete users[socket.id];
        io.emit('receive-users', users);
    })
})


// Arduino Board
const board = new five.Board({
    repl: false
});

board.on("ready", function() {
    lcd = new five.LCD({
      // LCD pin name  RS  EN  DB4 DB5 DB6 DB7
      pins: [12, 11, 5, 4, 3, 2],
      rows: 2,
      cols: 16
    });

    let arduinoMatrix = createArduinoMatrix(curMatrix);
    // console.log(arduinoMatrix)
    
    let n = 0;
    let nString;
    for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 16; j++) {
            nString = n.toString()
            lcd.createChar(nString, arduinoMatrix[i][j]);
            n += 1;
        }
    }

    for (let i = 0; i < 32; i++) {
        let index = 1;
        if (i < 16)
            index = 0;
        nString = i.toString();
        lcd.useChar(nString);
        lcd.cursor(index, i%16);
        lcd.print(`:${nString}:`);
    }
    lcd.clear();
});