////////////////////////////////////////////////////////////////
/// if there are more than 1 item excluding acceptable null input 
/// such as empty from / to / limit input is acceptable 
/// invalid date form or invalid date if it is later than new Date()
/// invalid username or empty username errors are not acceptable
//  then make an array of messages and pass to Error object
///////////////////////////////////////////////////////////////

function sanitiseValidationError(validationErrors) {
  if (!validationErrors.isEmpty()) {
    let errorMessages = [];
    const errorArray = validationErrors.array();

    errorArray.forEach(e => {
      if (e.param !== 'username' && e.value !== '' || e.param == 'username') {
        errorMessages.push(e.msg);
      }
    });

    if (errorMessages.length) return errorMessages;
    return null;
  }
}

module.exports = sanitiseValidationError;