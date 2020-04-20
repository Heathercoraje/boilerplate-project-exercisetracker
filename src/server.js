require('dotenv').config();
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const mongoose = require('mongoose')


////////////////////////////////////
// Configure and connect to MongoDB 
////////////////////////////////////
const Schema = mongoose.Schema;

mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true
});

const db = mongoose.connection;

db.on('error', ({ message }) => console.error(`Mongoose connection error: ${message}`));
db.once('open', () => {
  console.log('Mongoose default connection open');
});

/////////////////////////////////////////
// configure Express app and middlewares
/////////////////////////////////////////

const app = express();
app.set("port", process.env.port || 3000);
app.use(cors()); // Handle cross-site request
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());
app.use(express.static('public'));


////////////////////////////////
// Import Express Routes
///////////////////////////////
require('./routes')(app)

/////////////////////////////////
// Start Express Server
/////////////////////////////////

const server = app.listen(app.get('port'), () => {
  const { port, address } = server.address();
  console.log(`Express server started on ${address}: ${port}`);
});
