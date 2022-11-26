const map = (value, x1, y1, x2, y2) => (value - x1) * (y2 - x2) / (y1 - x1) + x2;

function showActiveUsers(users) {
    const list = document.querySelector('.usuarios');
    list.innerHTML = "";

    for (let key in users) {
        let li = document.createElement('li');
        li.innerHTML = users[key];
        list.appendChild(li);
    }
}

async function getStartUsers() {
    const response = await fetch(
		'http://localhost:3000/users',
		{
			method: 'GET',
			headers: {
				'Content-Type': 'application/json'
			}
		}
	);
    if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}
	const data = await response.json();
    return Object.values(data.users);
}

async function getStartGrid() {
    const response = await fetch(
		'http://localhost:3000/matrix',
		{
			method: 'GET',
			headers: {
				'Content-Type': 'application/json'
			}
		}
	);
    if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}
	const data = await response.json();
    return data.matrix;
}

function drawGrid(matrix, rows, columns, w, h, context) {
    context.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    let x, y;
    for (let i = 0; i < rows; i++) {
        y = h*i;
        for (let j = 0; j < columns; j++) {
            x = w*j;
            
            // Draw Grid
            context.fillStyle = 'white';
            if (matrix[i][j] == 1)
                context.fillStyle = 'black';
            context.beginPath();
            context.rect(x, y, w, h);
            context.fill();
            context.stroke();
        }
    }
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

// ======= MAIN =======

// socket

async function main() {

    const socket = io('http://localhost:3500', {query: {user: getCookie("user")}});

    // draw
    const canvas = document.querySelector('canvas');

    const context = canvas.getContext('2d');

    const width = 990;
    const height = 240;

    context.fillStyle = 'white';
    context.beginPath();
    context.rect(0, 0, width, height);
    context.fill();

    const rows = 16;
    const columns = 80;

    const w = width/columns;
    const h = height/rows;

    let matrix = await getStartGrid();
    let users = await getStartUsers();

    drawGrid(matrix, rows, columns, w, h, context);
    showActiveUsers(users);

    socket.on('receive-users', users => {
        showActiveUsers(users);
    })

    socket.on('receive-matrix', recMatrix => {
        matrix = recMatrix;
        drawGrid(matrix, rows, columns, w, h, context);
    })

    window.onbeforeunload = function(e) {
        socket.disconnect();
    };

    canvas.addEventListener('click', e => {
        let x = e.clientX;
        let y = e.clientY;
        let canvasPosition = canvas.getBoundingClientRect();
        let mX = Math.floor(map(x, canvasPosition.left, canvasPosition.right, 0, columns-1));
        let mY = Math.floor(map(y, canvasPosition.top, canvasPosition.bottom, 0, rows-1));
    
        matrix[mY][mX] = Math.abs(matrix[mY][mX]-1);
        
        context.fillStyle = 'white';
        context.strokeStyle = 'white';
        if (matrix[mY][mX] == 1) {
            context.fillStyle = 'black';
            context.strokeStyle = 'black';
        }
    
        // Paint Cell
        context.beginPath();
        context.rect(mX*w, mY*h, w, h);
        context.fill();
    
        socket.emit('send-matrix', matrix);
    })
}

main();