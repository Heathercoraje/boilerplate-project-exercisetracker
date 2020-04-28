const { body, query, validationResult } = require('express-validator/check');
const User = require('./userModel');

// fix this validation
function handleValidationError(validationErrors, next) {
  if (!validationErrors.isEmpty()) {
    const errorArray = validationErrors.array();
    if (errorArray.length === 1) {
      const { param, msg: message } = errorArray[0];
      return next(new Error(JSON.stringify({ param, message })));
    }

    ////////////////////////////////////////////////////////////
    /// if errorArray has more than 1 item 
    /// if username or other param problems 
    /// while them not being null input i.e. wrong date format
    ////////////////////////////////////////////////////////////

    let errors = [];
    errorArray.forEach(e => {
      if (e.param !== 'username' && e.value !== '' || e.param == 'username') {
        console.log(errors);
        errors.push(JSON.stringify({
          param: e.param,
          message: e.message
        }))
      }
    });
    if (errors.length) {
      return next(new Error(errors));
    }
  }
}

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
  app.post('/api/users/new-user', [
    // username validation
    body('username')
      .trim()
      .isLength({ min: 4, max: 20 })
      .withMessage('Username must be between 4 to 20 characters and numbers inclusive')
      .isAlphanumeric()
      .withMessage('Username must consist of only alphanumeric characters')
  ], (req, res, next) => {
    const { username } = req.body;
    const validationErrors = validationResult(req);

    handleValidationError(validationErrors, next);

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

  app.post('/api/exercise/add', [
    // Exercise validation
    body('username')
      .trim()
      .isLength({ min: 4, max: 20 }).withMessage('Invalid Username')
      .isAlphanumeric().withMessage('Invalid Username'),

    body('description')
      .trim()
      .isLength({ min: 4, max: 50 })
      .withMessage('Description must be between 4 and 50 characters, inclusive')
      .optional({ checkFalsy: true, }).isAscii()
      .withMessage('Description must contain only valid ascii characters'),

    body('duration')
      .trim()
      .isLength({ min: 1, max: 9999 })
      .withMessage('Duration must be between 1 and 9999 characters, inclusive')
      .isNumeric()
      .withMessage('Duration must be a numeric value'),

    body('date')
      .trim()
      .isISO8601()
      .withMessage('Invalid date form')
      .isAfter(new Date(0).toJSON())
      .isBefore(new Date().toJSON())
      .withMessage("Date must not be later than current date"),

  ], (req, res, next) => {
    const { username, description, duration, date } = req.body;

    const validationErrors = validationResult(req);
    handleValidationError(validationErrors, next);

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
  app.get('/api/exercise/log', [
    // Exercise validation
    query('username')
    .trim()
    .isLength({ min: 4, max: 20 }).withMessage('Invalid Username')
    .isAlphanumeric().withMessage('Invalid Username'),

  query('from')
    .trim()
    .isISO8601()
    .withMessage('Invalid date')
    .isAfter(new Date(0).toJSON())
    .isBefore(new Date('2999-12-31').toJSON())
    .withMessage("Invalid Date"),

  query('to')
    .trim()
    .isISO8601()
    .withMessage('Invalid date')
    .isAfter(new Date(0).toJSON())
    .isBefore(new Date('2999-12-31').toJSON())
    .withMessage("Invalid Date"),

  query('limit')
    .trim()
    .isNumeric({ no_symbols: true })
    .withMessage('Invalid Number')

  ], (req, res, next) => {
    const { username } = req.query;
    const limit = req.query.limit === '' ? 100 : req.query.limit;
    console.log('Limit', limit)
    // https://nodejs.org/en/knowledge/javascript-conventions/how-to-create-default-parameters-for-functions/

    const validationErrors = validationResult(req);
    handleValidationError(validationErrors, next);

  User.aggregate([{ $match: { username }},{ $unwind: '$exercises' },{ $limit: Number(limit) }])
      .then(documents => {
        res.json(documents);
      })
  });
}