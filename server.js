//http://localhost:7000/

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const formidable = require('formidable');
var fs = require('fs');
var mv = require('mv');
const jsonParser = bodyParser.json();
const mongoClient = require('mongodb').MongoClient;
//////////////////////////Week7////////////
const http = require('http').createServer(app);
const io = require('socket.io')(http);
///////////////////////////////////////////////////

const uri ="mongodb+srv://mongo_user:8GfwvD6PYgFZ6fU6@leaflix-east.5ioyh.mongodb.net/myFirstDatabase?retryWrites=true&w=majority"

let db  = null
let collection = null;
mongoClient.connect(uri, function(error, client){
    if (error) return console.log(error);
    db = client.db("db1");
    collection = db.collection('images');
    console.log("Database connected.");
});

///////////////////////////////////////////////////
app.use(express.static('public'));
const port = process.env.PORT || 3000;

app.get('/', function(request, response){
    response.sendFile(__dirname + '/public/index.html')
});

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('figure', (data, name) => {
    if(name!=null){
      //console.log(name +' Figure : ' + JSON.stringify(data));
      io.emit('figure_to_client', data, name); // This will emit the event to all connected sockets
    }
  });
  socket.on('line', (data, name) => {
    if(name!=null){
      //console.log(name +' Line : ' + JSON.stringify(data));
      io.emit('line_to_client', data, name); // This will emit the event to all connected sockets
    }
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

http.listen(port, () => {
  console.log(`listening on *:3000`);
});

///////////////////////////////////////////////////////////////

app.post('/upload',(req, res) => {
  var form = new formidable.IncomingForm();
  form.parse(req, function (err, fields, files) {
    var oldpath = files.file.path;
    var newpath = './public/uploads/' + files.file.name;
    mv(oldpath, newpath, function (err) {
      if (err) throw err;
      res.end();
    });
    newpath = newpath.replace("./public/",'');
    insertImageDoc(fields.username,fields.datetime, newpath);

  });
})

async function insertImageDoc(username, datetime, path){
  const doc = {
      username: username,
      datetime: datetime,
      path_image: path
  };
  const result = await collection.insertOne(doc);
  //console.log(`Document id: ${result.insertedId}`);
};

/////////////////////////////////

async function sendImagesList(res){
  const results = await collection.find().toArray();
  //console.log(results)
  res.json({images:results});
};

app.get('/images_list', function(req,res){
  sendImagesList(res);
});
