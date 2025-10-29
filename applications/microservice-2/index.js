const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Microservice 2 is running!');
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Microservice 2 listening at http://localhost:${port}`);
});
