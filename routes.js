const User = require('./userModel');

module.exports = function (app) {
  //////////////
  // main 
  /////////////////
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
        res.json(documents);
      });
  });

  app.post('/api/users/user', (req, res, next) => {
    const { username } = req.body;
    User.find({ username: username })
      .exec((error, documents) => {
        if (error) next(new Error(error));
        res.json(documents);
      });
  });
  //////////////////////////////////////////
  // To view a single user and exercises
  // request would be 'api/users/{username}'
  ///////////////////////////////////////////
  app.get('/api/users/:username', (req, res, next) => {
    console.log(req.params);
    const { username } = req.params;
    User.findOne({ username })
      .exec((error, { username, exercises }) => {
        if (erorr) return next(new Error(error));
        res.json({ username, exercises })
      });
  });

  //////////////////////////////////////////////
  // Register new user if username is not taken
  //////////////////////////////////////////////
  app.post('/api/users/new-user', (req, res, next) => {
    const { username } = req.body;
    const user = new User({
      username: username
    });

    User.find({ username: username }, (error, document) => {
      if (error) res.json({ error: "Error while finding this user" });
      if (document.length) res.json({ error: `Username  ${username} is already exist, please choose a differnet username` });
      else {
        user.save((error, savedDocument) => {
          if (error) res.json({ error: "Error while saving a user" });
          res.json({ username: savedDocument.username, id: savedDocument._id })
        });
      }
    });
  });


  //////////////////////////////////////////
  // Add new exercise entry
  ///////////////////////////////////////////

  app.post('/api/exercise/add', (req, res, next) => {
    const { username, description, duration, date } = req.body;
    const newExercise = { username, date, description, duration };

    User.findOne({ username: username }, (error, document) => {
      if (error) return next(new Error(error));
      if (document === null) return next(new Error(`username: ${username} is not found`));

      document.exercises.push(newExercise);
      document.save((error, document) => {
        if (error) return next(new Error('Something wrong while saving data'));
        res.json({
          success: true,
          message: 'New exercise entry successfully added',
          data: document
        });
      });
    });
  });


  //////////////////////////////////////////
  // Retrieve exercise history
  // GET /api/exercise/log?{username}[&from][&to][&limit]
  // FOR EXAMPLE /api/exercise/log?username=heathercoraje20&from&to&limit=1
  ///////////////////////////////////////////
  app.get('/api/exercise/log', (req, res, next) => {
    const { username, from = new Date(0), to = new Date(), limit = 100 } = req.query;

    User.aggregate([{ $match: { username } },
    { $unwind: '$exercises' },
    { $match: { 'exercises.date': { $gte: new Date(from), $lte: new Date(to) } } },
    { $limit: Number(limit) }
    ])
      .then(documents => {
        res.json(documents);
      })
  });
}