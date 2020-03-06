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
//  move to DB file
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
  
  User.find({ username: username }, (error, document) => {
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

app.post('/api/exercise/add', (req, res, next) => {
  let user;
  let newExerciseArray = [];

  const { userId, description, duration, date } = req.body;
  const newExercise = { userId, date, description, duration };
  
  User.find({_id: userId}, (error, document) => {
    if (error) res.json({Error: "Error finding user with userId" });
    else {
      user = document[0]
      newExerciseArray.push(newExercise);

      if (user.exercise) {
        user.exercise.map((exercise) => newExerciseArray.push(exercise));
      }

      const objectToUpdate = { exercise: newExerciseArray };
      User.findByIdAndUpdate( userId, objectToUpdate , { new: true }, (error, document) => {
        if (error) res.json({ Error: "Error findAndUpdating user with userId" });
        else {
          res.json(document);
        }
      });
    }
  });
});

app.get('/api/exercise/log', (req, res, next) => {
  const { userId, from, to, limit } = req.query; 
  if (from)
  // let userObjectwithCount;
  
  if(!userId) res.sendError(null, "Bad request: no userId");
  
  let options = {};
  let query = { userId }; // this is incorrect query
  if (limit) options.limit = parseInt(limit);

  if(from && to) query.date = { $gtl: from, $lte: to};
  else if (from) query.date = { $gtl: from };
  else if (to) query.date = { $lte: to };


  User.find(query, null, options, (error, document) => {
    if (error) res.json({ error: "Error while finding this user"});
    // if (!document.length) res.json({ error: `No user exist with userId: ${userId}`});
    console.log('query', query); // filter
    console.log('document', document);
    // else {
    //   const { exercise } = document[0];
      
    //   userObjectwithCount = {
    //     userId,
    //     count: exercise ? exercise.length: 0,
    //     exercise
    //   }  
    //   res.json(userObjectwithCount)
    // }
  });
 });

app.get('/api/exercise/log', (req, res, next) => {
   // retrieve part of the log 
   // extra param
   // use the original route
});
  

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
