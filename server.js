require('dotenv').config();

const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose')
const Schema = mongoose.Schema;

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true
});

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// Schema/model setup 
const userSchema = new Schema({
  username: { type: String, required: true },
  exercise: { type: Array, required: false }
});

const User = mongoose.model('users', userSchema);

app.get('/api/exercise/users', (req, res, next) => {
  User.find({}, (error, data) => {
    if (error || !data.length) res.json({ error: "No user exist"});
    else res.send(data);
  });
});

app.post('/api/exercise/new-user', (req, res, next) => {
  const username = req.body.username;
  const user = new User({
    username: username
  });
  
  User.find({ username: username }, (error, document) => { // TODO REFACTOR
    if (error) res.json({ error: "Error while finding this user"});
    if (document.length) res.json({ error: "Username already exist, please choose a differnet username"});
    else {
      user.save((error, savedDocument) => {
        if (error) res.json({ error: "Error while saving a user"});
        res.json({ username: savedDocument.username, id: savedDocument._id})
      });
    }
  });
});

app.get('/api/exercise/log/:userId', (req, res, next) => {
  // retrive a full log of exercise 
  // a full exercise log of user object with added array log and count // // (total exercise count).
 });

app.get('/api/exercise/log/:userId', (req, res, next) => {
   // retrieve part of the log
  });
  
app.post('/api/exercise/add', (req, res, next) => {
  // add exercise document to excercise collection
  // return json of user object with exercise fields added
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
