const { body, query, validationResult } = require('express-validator/check');
const User = require('./userModel');
const sanitiseValidationError = require('./helper');

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
        if (error) return next(new Error(error));
        res.json(documents);
      });
  });

  //////////////////////////////////////////
  // To view a single user and exercises
  // request POST would be 'api/users/user'
  ///////////////////////////////////////////

  app.post('/api/users/user', (req, res, next) => {
    const { username } = req.body;
    User.find({ username: username })
      .exec((error, documents) => {
        if (error) return next(new Error(error));
        if (!documents.length) {
          res.json({ Error: 'This username is not registered. Please register first' });
        } else {
          res.json({ username, exercises: documents[0].exercises });
        }
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

    const validationErrorMessage = sanitiseValidationError(validationResult(req));
    if (validationErrorMessage) return next(new Error(validationErrorMessage));

    const user = new User({
      username: username
    });

    User.find({ username: username }, (error, document) => {
      if (error) return next(new Error("Error while finding this user"));
      if (document.length) return next(new Error(`Username  ${username} is already exist, please choose a differnet username`));
      else {
        user.save((error, savedDocument) => {
          if (error) return next(new Error("Error= while saving a user"));
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

    const validationErrorMessage = sanitiseValidationError(validationResult(req));
    if (validationErrorMessage) return next(new Error(validationErrorMessage));
    // https://rollbar.com/guides/javascript-throwing-exceptions/

    const newExercise = { username, date, description, duration };

    User.findOne({ username: username }, (error, document) => {
      if (error) return next(new Error(error));
      if (document === null) return next(new Error(`${username} is not found`));

      document.exercises.push(newExercise);
      document.save((error, document) => {
        if (error) return next(new Error(error));
        res.json({
          success: true,
          message: 'New exercise entry successfully added',
          exercises: document.exercises
        });
      });
    });
  });

  //////////////////////////////////////////////////////////////////////////
  // Retrieve exercise history
  // GET /api/exercise/log?{username}[&from][&to][&limit]
  // FOR EXAMPLE /api/exercise/log?username=heathercoraje20&from&to&limit=1
  ///////////////////////////////////////////////////////////////////////////

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

    // set default values when input it empty string 
    // https://nodejs.org/en/knowledge/javascript-conventions/how-to-create-default-parameters-for-functions/
    const limit = req.query.limit === '' ? 100 : req.query.limit;
    const from = req.query.from === '' ? new Date(0) : req.query.from;
    const to = req.query.to === '' ? new Date() : req.query.to;


    const validationErrorMessage = sanitiseValidationError(validationResult(req));
    if (validationErrorMessage) return next(new Error(validationErrorMessage));

    User.aggregate([{ $match: { username } },
    { $unwind: '$exercises' },
    { $match: { 'exercises.date': { $gte: new Date(from), $lte: new Date(to) } } },
    { $limit: Number(limit) }
    ])
      .then(documents => res.json({ count: documents.length, exercises: documents}));
  });

  // Default route hanlder
  // not found redirects to main
  app.get('*', (req, res, next) => {
    res.redirect('/')
  });

  // Error Handle middleware
  app.use((error, req, res, next) => {
    console.error(error);
    res.json({
      success: false,
      error: error.message
    })
  })
}