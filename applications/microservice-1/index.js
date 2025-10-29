// index.js
const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Microservice 1 is running!');
});

app.listen(port, () => {
  console.log(`Microservice 1 listening at http://localhost:${port}`);
});
