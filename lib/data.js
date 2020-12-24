/**
 * Library for storing and editing data
 */
var fs = require('fs');
var path = require('path');
var helpers = require('./helpers')
//Container for the lib;

var lib = {};
//basedir
lib.baseDir = path.join(__dirname, '/../.data/');
// console.log(lib.baseDir);
lib.create = (dir, file, data, callback) => {
    //open file for writing
    fs.open(lib.baseDir + dir + '/' + file + '.json', 'wx', (err, fileDescriptor) => {
        if (!err && fileDescriptor) {
            //convert data to string
            var stringData = JSON.stringify(data);
            //write to file
            fs.writeFile(fileDescriptor, stringData, (err) => {
                if (!err) {
                    fs.close(fileDescriptor, (err) => {
                        if (!err) {
                            callback(false);
                        } else {
                            callback('error closing new file');
                        }
                    });
                } else {
                    callback('error writing to file!')
                }
            });
        } else {
            console.log(err);
            callback('could not create new file,it may already exist!');
        }
    });
};
//Read data from a file
lib.read = (dir, file, callback) => {
    fs.readFile(lib.baseDir + dir + '/' + file + '.json', 'utf-8', (err, data) => {
        if (!err && data) {
            callback(false, helpers.parseTsonToObject(data));
        } else if (err) {
            callback('Error reading from file');
        } else {
            callback(err, data);
        }

    });
};
//update data
lib.update = (dir, file, data, callback) => {
    fs.open(lib.baseDir + dir + '/' + file + '.json', 'r+', (err, fileDescriptor) => {
        if (!err && fileDescriptor) {
            //convert data to string
            var stringData = JSON.stringify(data);
            //truncate contents of file
            fs.ftruncate(fileDescriptor, (err) => {
                if (!err) {
                    //write to file
                    fs.writeFile(fileDescriptor, stringData, (err) => {
                        if (!err) {
                            fs.close(fileDescriptor, (err) => {
                                if (!err) {
                                    callback(false);
                                } else {
                                    callback('error closing new file');
                                }
                            });
                        } else {
                            callback('error writing to file!')
                        }
                    });
                } else {
                    callback("could not delete previous contents");
                }
            });
        } else {
            callback('Could not open file,it may not exist!');
        }
    })
}
//delete data
lib.delete = (dir, file, callback) => {
    fs.unlink(lib.baseDir + dir + '/' + file + '.json', (err) => {
        if (!err) {
            callback(false);
        } else {
            callback('Error deleting file');
        }

    });
};
//exports
module.exports = lib;