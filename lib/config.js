/**
 * Createand export cofig variables
 * 
 */

//container for all environments
var environments = {};
//staging default env
environments.staging = {
    'httpPort': 3000,
    'httpsPort': 3001,
    'envName': 'staging',
    'hashingSecret': 'thisIsASecret',
    'maxChecks': 5
};

//Production environment
environments.production = {
    'httpPort': 5000,
    'httpsPort': 5001,
    'envName': 'production',
    'hashingSecret': 'thisIsASecret',
    'maxChecks': 5
};

//determine which environment was passed as a command-line argument
var currentEnvironmnet = typeof (process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';
//check
var environmentToExport = typeof (environments[currentEnvironmnet]) == 'object' ? environments[currentEnvironmnet] : environments.staging;

//export
module.exports = environmentToExport;

//how to run
/**
 * SET NODE_ENV=staging/production
 * node index.js
 */