var MongoClient = require( 'mongodb' ).MongoClient;

var _db;


module.exports = {

  connectServer: function() {
   return MongoClient.connect('mongodb://localhost:27017/GCQuestionnaire', { useNewUrlParser: true })
  }

};
