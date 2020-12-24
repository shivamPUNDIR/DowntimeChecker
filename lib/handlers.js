/**
 * requestt handlers
 */

//Dependencies
var config = require('./config')
var _data = require('./data');
var helpers = require('./helpers');

//Define handlers

var handlers = {};
//sample handler
// handlers.sample = (data, callback) => {
//     //callback http status code,payload object
//     callback(406, { 'name': 'sample handler' });
// };


//ping handler
handlers.ping = (data, callback) => {
    callback(200);
};

//users handler
handlers.users = (data, callback) => {
    var acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._users[data.method](data, callback);
    } else {
        callback(405);
    }

};

//container for users submethods
handlers._users = {};


//submethods for _users

/**
 * @Users - post(create)
 * @RequiredData : first nae,lastname,phone,password,boolean tos
 * @OptionalData :data :none
 */

handlers._users.post = (data, callback) => {
    //check that all required fiels are filled out
    var firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    var phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length > 0 && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    var password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    var tosAgreement = typeof (data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

    if (firstName && lastName && phone && password && tosAgreement) {
        //key is phone number 
        //so make sure that user already doesn't exist
        _data.read('users', phone, (err, data) => {
            if (err) {
                //hash password
                var hashedPassword = helpers.hash(password);
                //create user object
                if (hashedPassword) {
                    var userObject = {
                        'firstName': firstName,
                        'lastName': lastName,
                        'phone': phone,
                        'password': hashedPassword,
                        'tosAgreement': true,
                    };
                    //create user file
                    _data.create('users', phone, userObject, (err) => {
                        if (err) {
                            console.log(err);
                            callback(500, { 'Error': 'Error creating user' });
                        } else {
                            callback(200);
                        }
                    });
                } else {
                    callback(500, { 'Error': 'Could not hash password' });
                }

            } else {
                callback(400, { 'Error': 'User already exists!Try again' });
            }
        });
    } else {
        callback(400, { 'Error': 'Missing requires fields' });
    }
};

/**
 * @Users - get(read)
 * @RequiredData : phone
 * @OptionalData :none
 * @TODO only logged in users to access their obj.Don't let them access anyone's else's
 * @Done -Todo completed
 */

handlers._users.get = (data, callback) => {
    //Check if the phone number is valid
    var phone = typeof (data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length > 0 && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
    if (phone) {
        //Get the token from headers
        var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
        //Verify that given token is valid for the user/phone number
        handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
            if (tokenIsValid) {
                _data.read('users', phone, (err, data) => {
                    if (!err && data) {
                        //remove hashed password from data
                        delete data.password;
                        callback(200, data);
                    } else {
                        callback(404);
                    }
                });
            } else {
                callback(403, { "Error": "Token - user mismatch" });
            }
        });

    } else {
        callback(400, { "Error": "Missing required fields" });
    }
};

/**
 * @Users - put(update user)
 * @RequiredParameters : phone
 * @OptionalData : firstname,lastName,password(at least one must be specified)
 * @TODO only logged in users to access/update their own obj.Don't let them access/update anyone's else's
 * @Done -Todo done
 */
handlers._users.put = (data, callback) => {
    //check for required field
    var phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length > 0 && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;

    //Check for optional fields
    var firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    var password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    //Error if phone is invalid
    if (phone) {
        if (firstName || lastName || password) {
            //Get the token from headers
            var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
            //Verify that given token is valid for the user/phone number
            handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
                if (tokenIsValid) {
                    //looking for existance of user
                    _data.read('users', phone, (err, data) => {
                        if (!err && data) {
                            //update necessary fields
                            if (firstName) {
                                data.firstName = firstName;
                            }
                            if (lastName) {
                                data.lastName = lastName;
                            }
                            if (password) {
                                var hashedPassword = helpers.hash(password);
                                if (hashedPassword) {
                                    data.password = hashedPassword;
                                } else {
                                    callback(400, { "Error": "Error hashing password" });
                                }

                            }
                            _data.update('users', phone, data, (err) => {
                                if (!err) {
                                    callback(200)
                                } else {
                                    callback(400, { "Error": "Error updating object." })
                                }
                            });
                            //store this object
                        } else {
                            callback(500, { "Error": "User doesn't exist" });
                        }
                    });
                } else {
                    callback(403, { "Error": "Token - user mismatch" });
                }

            });

        } else {
            callback(400, { "Error": "Enter any values to update" });
        }
    } else {
        callback(400, { "Error": "Missing required fiels" });
    }

};
//
/**
 * @Users - delete(user)
 * @RequiredParameters : phone
 * @TODO only logged in users to delete their own obj.Don't let them delete anyone's else's
 * @TODO clean up any data relate dwith user
 * @DONE -TODO
 */
//Using getlike equest
handlers._users.delete = (data, callback) => {
    var phone = typeof (data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length > 0 && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
    if (phone) {
        //Get the token from headers
        var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
        //Verify that given token is valid for the user/phone number
        handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
            if (tokenIsValid) {
                _data.read('users', phone, (err, data) => {
                    if (!err && data) {
                        _data.delete('users', phone, (err) => {
                            if (!err) {
                                //delete ech of check associated with the user
                                var userChecks = typeof (data.checks) == 'object' && data.checks instanceof Array ? data.checks : [];
                                var checksToDelete = userChecks.length;
                                if (checksToDelete > 0) {
                                    var checksDeleted = 0;
                                    var deletionErrors = false;
                                    userChecks.forEach(checkId => {
                                        //delet check
                                        _data.delete('checks', checkId, (err) => {
                                            if (err) {
                                                deletionErrors = true;
                                            } 
                                            checksDeleted++;
                                            if(checksDeleted==checksToDelete){
                                                if(!deletionErrors){
                                                    callback(200);
                                                }else{
                                                    callback(500,{"Error":"Errors encounter while attempting to delte checks of users!"})
                                                }
                                            }
                                        })
                                    });
                                }
                                else {
                                    callback(200);
                                }
                            } else {
                                callback(500, { "Error": "Could not delete user!" });
                            }
                        });
                    } else {
                        callback(400, { "Error": "User doesn't exist" });
                    }
                });
            } else {
                callback(403, { "Error": "Token - user mismatch" });
            }
        });

    } else {
        callback(400, { "Error": "Missing required fields" });
    }
};
//delete using post like request in payload
/*
handlers._users.delete = (data, callback) => {
    var phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length > 0 && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    if (phone) {
        _data.read('users', phone, (err, data) => {
            if (!err && data) {
                _data.delete('users', phone, (err) => {
                    if (!err) {
                        callback(200);
                    } else {
                        callback(400, { "Error": "Could not delete user!" });
                    }
                });
            } else {
                callback(400, { "Error": "User doesn't exist" });
            }
        });
 
    } else {
        callback(400, { "Error": "Missing required fields" });
    }
}
*/

//token handler(blanket handler just like handlers.users)
handlers.tokens = (data, callback) => {
    var acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._tokens[data.method](data, callback);
    } else {
        callback(405);
    }
};
//Container for tokens submethods
handlers._tokens = {};
/**
 * Tokens - post
 */

handlers._tokens.post = (data, callback) => {

};

/**
 * @Tokens - post(user creating a token)
 * @RequiredData - Phone,password
 * @OptionalData - none
 */

handlers._tokens.post = (data, callback) => {
    //check that all required fiels are filled out
    var phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length > 0 && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    var password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    if (phone && password) {
        _data.read('users', phone, (err, data) => {
            if (!err && data) {
                //Hash the sent password && compare to passwd stored in user file
                var hashedPassword = helpers.hash(password);
                //if equal,user credential are correct
                if (hashedPassword == data.password) {
                    //create new token and set expirationtime1 hour in the future
                    var tokenId = helpers.createRandomString(50);
                    var expires = Date.now() + (1000 * 60 * 60);//1 hour
                    var tokenObj = {
                        "phone": phone,
                        "tokenId": tokenId,
                        "expires": expires
                    };
                    //console.log(tokenObj);
                    //store token on server

                    _data.create('tokens', tokenId, tokenObj, (err) => {
                        if (!err) {
                            callback(200, tokenObj);
                        } else {
                            console.log(err);
                            callback(400, { "Error": "Token creation failed" });
                        }
                    });
                } else {
                    callback(400, { "Error": "Wrong credentials!! Try Again." });
                }
            } else {
                callback(400, { "Error": "User doesn't exist" });
            }
        });
    } else {
        callback(400, { "Error": "Required fields missing!!" });
    }
};

/**
 * @Tokens - put(allow user to extend their token expiration time)
 * @RequiredData - id,extend
 * @OptionalData - none
 */

handlers._tokens.put = (data, callback) => {
    console.log(data.payload.id, data.payload.extend);
    var id = typeof (data.payload.id) == 'string' && data.payload.id.trim().length > 0 && data.payload.id.trim().length == 50 ? data.payload.id.trim() : false;
    var extend = typeof (data.payload.extend) == 'boolean' && data.payload.extend == true ? data.payload.extend : false;

    if (id && extend) {
        //lookup token
        _data.read('tokens', id, (err, data) => {
            if (!err && data) {
                //if token exists
                if (data.expires - Date.now() <= 0) {
                    callback(400, { "Error": "Session expired" });
                }
                else {
                    data.expires = Date.now() + (1000 * 60 * 60);
                    _data.update('tokens', id, data, (err) => {
                        if (!err) {
                            callback(200);
                        } else {
                            callback(500, { "Error": "Token update failed" });
                        }
                    });
                }

            } else {
                callback(400, { "Error": "Token not found" });
            }
        });
    } else {
        callback(400, { "Error": "Missing required fields." });
    }


};

/**
 * @Tokens - get
 * @RequiredData - tokenid
 * @OptionalData - none
 */

handlers._tokens.get = (data, callback) => {
    var id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length > 0 && data.queryStringObject.id.trim().length == 50 ? data.queryStringObject.id.trim() : false;

    if (id) {
        _data.read('tokens', id, (err, data) => {
            if (!err && data) {
                //remove hashed password from data
                callback(200, data);
            } else {
                callback(404, { "Error": "Token does not exist!" });
            }
        });
    } else {
        callback(400, { "Error": "id is wrong" });
    }

};

/**
 * Tokens - delete
 * @RequiredData - tokenid
 * @OptionalData - none
 */

handlers._tokens.delete = (data, callback) => {
    var id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length > 0 && data.queryStringObject.id.trim().length == 50 ? data.queryStringObject.id.trim() : false;
    if (id) {
        _data.read('tokens', id, (err, data) => {
            if (!err && data) {
                _data.delete('tokens', id, (err) => {
                    if (!err) {
                        callback(200);
                    } else {
                        callback(400, { "Error": "Could not delete token!" });
                    }
                });
            } else {
                callback(400, { "Error": "Token doesn't exist" });
            }
        });

    } else {
        callback(400, { "Error": "Missing fields required" });
    }
};
/**
 * Verify if a given token id is currently valid for a given user
 */
handlers._tokens.verifyToken = (id, phone, callback) => {
    //Lookup the token
    _data.read('tokens', id, (err, data) => {
        if (!err && data) {
            //Check the token is for givenuser and has not expired
            if (data.phone == phone && data.expires > Date.now()) {
                callback(true);
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    });

}

/** 
 * Checks handler
*/

handlers.checks = (data, callback) => {
    var acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._checks[data.method](data, callback);
    } else {
        callback(405);
    }
};
//Container for checks submethod
handlers._checks = {};

/** 
 * Checks post method
 * @RequiredData : protocol,url,method,successCode,timeoutSeconds
 * @OptionalData : none
*/
handlers._checks.post = (data, callback) => {
    //Validate inputs
    var protocol = typeof (data.payload.protocol) == 'string' && ['http', 'https'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol.trim() : false;
    // var id = typeof (data.payload.id) == 'string' && data.payload.id.trim().length > 0 && data.payload.id.trim().length == 50 ? data.payload.id.trim() : false;
    var url = typeof (data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
    var method = typeof (data.payload.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method.trim() : false;
    var successCode = typeof (data.payload.successCode) == 'object' && data.payload.successCode instanceof Array && data.payload.successCode.length > 0 ? data.payload.successCode : false;
    var timeoutSeconds = typeof (data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds > 0 && data.payload.timeoutSeconds <= 5 && data.payload.timeoutSeconds % 1 === 0 ? data.payload.timeoutSeconds : false;
    // console.log(config.maxChecks);
    // console.log(protocol,url,method,successCode,timeoutSeconds)

    //if valid
    if (protocol && url && method && successCode && timeoutSeconds) {
        var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
        if (token) {
            //Read user by token
            _data.read('tokens', data.headers.token, (err, data) => {
                if (!err && data) {
                    var userPhone = data.phone;
                    //Lookuo the user using phone
                    _data.read('users', userPhone, (err, data) => {
                        if (!err && data) {
                            var userChecks = typeof (data.checks) == 'object' && data.checks instanceof Array ? data.checks : [];
                            //Verify that user has checks left
                            if (userChecks.length < config.maxChecks) {
                                //create a random string as checkId
                                var checkId = helpers.createRandomString(20);

                                //Create the check object and include user's phone
                                var checkObj = {
                                    'userPhone': data.phone,
                                    'id': checkId,
                                    'url': url,
                                    'successCode': successCode,
                                    'timeoutSeconds': timeoutSeconds,
                                    'method': method,
                                    'protocol': protocol
                                };

                                _data.create('checks', checkId, checkObj, (err) => {
                                    if (!err) {
                                        data.checks = userChecks;
                                        data.checks.push(checkId);
                                        //save new userdata
                                        _data.update('users', userPhone, data, (err) => {
                                            if (!err) {
                                                callback(200, checkObj);
                                            } else {
                                                callback(500, { "Error": "Check linking failed" });
                                            }
                                        });
                                    } else {
                                        callback(500, { "Error": "Check creation failed!" });
                                    }
                                });
                            }
                            else {
                                callback(400, { "Error": `Max checks exceeded on the linked account!(${config.maxChecks})` })
                            }
                        } else {
                            callback(403, { "Error": "User doesn't exist as o f that in token!" });
                        }
                    });
                } else {
                    callback(403)
                }
            });
        } else {
            callback("Token-User mismatch!")
        }
    } else {
        callback(400, { "Error": "Missing required inputs!" })
    }




};
/**
 * Checks get method
 * @RequiredData : IDF
 * @OptionalData : none
 */
handlers._checks.get = (data, callback) => {

    //Check if the phone number is valid
    var id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length > 0 && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    //Get the token from headers
    let token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
    if (id) {
        //Lookup the check
        _data.read('checks', id, (err, data) => {
            if (!err && data) {
                //Verify that given token is valid for the user/phone number who created the check
                handlers._tokens.verifyToken(token, data.userPhone, (tokenIsValid) => {
                    if (tokenIsValid) {
                        //retrn the check data
                        callback(200, data);
                    } else {
                        callback(403, { "Error": "Token - user mismatch" });
                    }
                });
            } else {
                callback(404, { "Error": "No id found." })
            }
        });


    } else {
        callback(400, { "Error": "Missing required fields" });
    }

};
/**
 * Check put method
 * @RequiredData : Id
 * @OptinalData : userPhone,timeoutSeconds,protocol,method,url,successCode
 */
handlers._checks.put = (data, callback) => {
    //check for required field
    var id = typeof (data.payload.id) == 'string' && data.payload.id.trim().length > 0 && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;

    //Check for optional fields
    var protocol = typeof (data.payload.protocol) == 'string' && ['http', 'https'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol.trim() : false;
    // var id = typeof (data.payload.id) == 'string' && data.payload.id.trim().length > 0 && data.payload.id.trim().length == 50 ? data.payload.id.trim() : false;
    var url = typeof (data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
    var method = typeof (data.payload.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method.trim() : false;
    var successCode = typeof (data.payload.successCode) == 'object' && data.payload.successCode instanceof Array && data.payload.successCode.length > 0 ? data.payload.successCode : false;
    var timeoutSeconds = typeof (data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds > 0 && data.payload.timeoutSeconds <= 5 && data.payload.timeoutSeconds % 1 === 0 ? data.payload.timeoutSeconds : false;
    console.log(id);
    let token = typeof (data.headers.token) == 'string' ? data.headers.token : false;

    //Error if phone is invalid
    if (id) {
        //check if one or more optional fields have been sent
        if (protocol || url || method || successCode || timeoutSeconds) {
            //Looking up the check
            _data.read('checks', id, (err, data) => {
                if (!err && data) {
                    //Verify that given token is valid for the user/phone number who created the check
                    handlers._tokens.verifyToken(token, data.userPhone, (tokenIsValid) => {
                        if (tokenIsValid) {
                            //update the check data
                            if (protocol) {
                                data.protocol = protocol;
                            }
                            if (url) {
                                data.url = url;
                            }
                            if (successCode) {
                                data.successCode = successCode;
                            }
                            if (method) {
                                data.method = method;
                            }
                            if (timeoutSeconds) {
                                data.timeoutSeconds = timeoutSeconds;
                            }
                            //Store the updates
                            _data.update('checks', id, data, (err) => {
                                if (!err) {
                                    callback(200);
                                } else {
                                    callback(500, { "Error": "Error updating the checks" });
                                }
                            });
                        } else {
                            callback(403, { "Error": "Token - user mismatch" });
                        }
                    });
                } else {
                    callback(400, { "Error": "Check id does not exist" });
                }
            });

        } else {
            callback(400, { "Error": "Enter any values to update" });
        }
    } else {
        callback(400, { "Error": "Missing required fiels" });
    }

};
/**
 * Check delete method
 * @RequiredData : Id
 * @OptinalData : none
 */
handlers._checks.delete = (data, callback) => {
    let id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length > 0 && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    let token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
    if (id) {
        _data.read('checks', id, (err, data) => {
            if (!err && data) {
                handlers._tokens.verifyToken(token, data.userPhone, (isValid) => {
                    if (isValid) {
                        //delete token
                        _data.delete('checks', id, (err) => {
                            if (!err) {
                                _data.read('users', data.userPhone, (err, userData) => {

                                    if (!err && userData) {

                                        var userChecks = typeof (userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];

                                        //remove the deleted check from list of checks

                                        var checkPosition = userChecks.indexOf(id) > -1 ? userChecks.indexOf(id) : false;
                                        if (checkPosition > -1 || checkPosition != false) {
                                            userChecks.splice(checkPosition);
                                            // console.log(typeof(userChecks));
                                            userData.checks = userChecks;
                                            //update userdata
                                            _data.update('users', userData.phone, userData, (err) => {
                                                if (!err) {
                                                    callback(200);
                                                } else {
                                                    callback(500, { "Error": "Bsdk nhi hua delete..jaa maa chuda!" })
                                                }
                                            });

                                        } else {
                                            callback(400, { "Error": "Check doesn't exit in userlist" });
                                        }

                                    } else {
                                        callback(500, { "Error": "User doesn't exist" });
                                    }
                                });
                            } else {
                                callback(500, { "Error": "Error deleting check!" });
                            }
                        });
                    } else {
                        callback(403);
                    }
                });
            } else {
                callback(400, { "Error": "Check doesn't exist" });
            }
        });

    } else {
        callback(400, { "Error": "Missing fields required" });
    }
};
//not found handler
handlers.notFound = (data, callback) => {
    callback(404);
};



//export handlers

module.exports = handlers;