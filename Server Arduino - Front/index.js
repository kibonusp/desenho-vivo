const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static(__dirname + '/public'));

const PORT = 4000;

app.listen(PORT, () => {
    console.log(`Server is listening on http://localhost:${PORT}`)
})