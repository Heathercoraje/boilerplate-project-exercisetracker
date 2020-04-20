 const User = require('./userModel');
 
module.exports = function(app) {
  app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html')
  });

  //////////////////////////////////
  // To view all users
  /////////////////////////////////
  app.get('/api/users', (req, res, next) => {
    User.find({})
    .exec((error, documents) => {
      if (error) next(new Error(error));
      res.json(users);
    });
  });

  //////////////////////////////////////////
  // To view a single user and exercises
  // request would be 'api/users/{username}'
  ///////////////////////////////////////////
  app.get('/api/users/:username', (req, res, next) => {
    const { username } = req.params;
    User.findOne({username})
      .exec((error, { username, exercises }) => {
        if (erorr) next(new Error(error));
        res.json({ username, exercises })
      });
  });
  
  app.post('/api/exercise/new-user', (req, res, next) => {
    const username = req.body.username;
    const user = new User({
      username: username
    });
  
    User.find({ username: username }, (error, document) => {
      if (error) res.json({ error: "Error while finding this user" });
      if (document.length) res.json({ error: "Username already exist, please choose a differnet username" });
      else {
        user.save((error, savedDocument) => {
          if (error) res.json({ error: "Error while saving a user" });
          res.json({ username: savedDocument.username, id: savedDocument._id })
        });
      }
    });
  });
  
  app.post('/api/exercise/add', (req, res, next) => {
    let user;
    let newExerciseArray = [];
  
    const { userId, description, duration, date } = req.body;
    const newExercise = { userId, date, description, duration };
  
    User.find({ _id: userId }, (error, document) => {
      if (error) res.json({ Error: "Error finding user with userId" });
      else {
        user = document[0]
        newExerciseArray.push(newExercise);
  
        if (user.exercise) {
          user.exercise.map((exercise) => newExerciseArray.push(exercise));
        }
  
        const objectToUpdate = { exercise: newExerciseArray };
        User.findByIdAndUpdate(userId, objectToUpdate, { new: true }, (error, document) => {
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
  
      if (!userId) res.sendError(null, "Bad request: no userId");
  
    let options = {};
    let query = { userId }; // this is incorrect query
    if (limit) options.limit = parseInt(limit);
  
    if (from && to) query.date = { $gtl: from, $lte: to };
    else if (from) query.date = { $gtl: from };
    else if (to) query.date = { $lte: to };
  
  
    User.find(query, null, options, (error, document) => {
      if (error) res.json({ error: "Error while finding this user" });
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
}