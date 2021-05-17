const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')
const mongoose = require('mongoose');
require('dotenv').config()

var jsonParser = bodyParser.json()


// connect to the database
mongoose 
 .connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,   })   
 .then(() => console.log("Database connected!"))
 .catch(err => console.log(err));


 app.use(cors())
 app.use(bodyParser.urlencoded({ extended: false }));
 app.use(bodyParser.json());
 app.use(express.static('public'))
 app.get('/', (req, res) => {
   res.sendFile(__dirname + '/views/index.html')
 });

// const sesionSchema = new mongoose.Schema({
//   description: String,
//   duration: String,
//    // Array of rutins
//   date: String,
// });

// const sesion = mongoose.model('sesion', sesionSchema);

const PersonSchema = new mongoose.Schema({
  name: {type:String, unique:true},
  count: Number,
   // Array of rutins
  sesions: [{
    description: String,
    duration: Number,
    date: Date
  }],
});

const Person = mongoose.model('Athlete', PersonSchema);

app.post("/api/users", function(req, res){
  
  //we perform certain verifications
	// if (req.body.username === '') {
  //   res.send('Username cannot be blank');
  // } else if (req.body.username.length > 100) {
  //   res.send('Username cannot be greater than 100 characters');
  // } else {
    //if everything is okey:
    var newPerson = new Person({name: req.body.username, count: 0, sesions: []});

    newPerson.save((error, data) => {
      if(error){
        if (error.name === 'MongoError' && error.code === 11000) { // Duplicate key error
          res.send('Duplicate username, try a different username');
        } else{
        console.log(error);
        }
      }else{
        console.log("save successful")
        res.json({
          "username": newPerson.name,
          "_id": newPerson._id
        });
      }
    });
  // }
});


app.post("/api/users/:_id/exercises", function(req, res){
  //we can do that because there is the Parser 
  let {userId, description, duration, date} = req.body;
  console.log(req.body)
  date = new Date(date);
  //we perform certain verifications
  // if (req.params._id === undefined || description === undefined || duration === undefined) {
  //   res.send('Required Field(s) are missing.');
  //   console.log(userId);
  // } else if (req.params._id === '' || description === '' || duration === '') {
  //   res.send('Required Field(s) are blank.');
  // } else if (description.length > 1000) {
  //   res.send('Description cannot be greater than 100 characters');
  // } else if (isNaN(duration)) {
  //   res.send('Duration must be a number');
  // } else if (Number(duration) > 1440) {
  //   res.send('Duration must be less than 1440 minutes (24 hours)');
  // } else if (date !== '' && isNaN(Date.parse(date)) === true) {
  //   res.send('Date is not a valid date');
  // } else {

    //if everything is okey
    console.log("la fecha introducida fue:", date)
    if(!date){
      date = new Date();
    } else if( typeof req.body.date === 'undefined'){
      date = new Date();
    }

    var newSesion = {
      description: description,
      duration: parseInt(duration),
      date: date
    };

    Person.findByIdAndUpdate(req.params._id, {$push: {sesions: newSesion}, $inc: { count:1 }}, { new: true },(error,data)=>{
      if(error){
        console.log(error);
      }else if(!data){
        res.send('Username not found');
      } else {
        console.log("el username fue:", data)
        res.json({
          username: data.name,
          description: newSesion.description,
          date: new Date(newSesion.date).toDateString(), 
          duration: newSesion.duration,
          _id: req.params._id
        });
      }
    });
  
  //}
  
});


app.get('/api/users', (req, res) => {
  Person.find({}, (err, data) => {
    if (err) return console.log(err);
    res.send(data.map((user) => { return { username: user.name, _id: user._id }; }));
  });
});

app.get('/api/users/:_id/logs', (req, res) => {
  if (!req.params){
    return res.json({ error: 'there are no parameters'});
  } else if(!req.params._id){ 
    return res.json({ error: 'invalid id' });
  }
  Person.findById(req.params._id, (err, data) => {
    if (err) return res.json({ error: err });
    else if (!data) return res.json({ error: 'invalid id'})

    var userSesionsToShow = data.sesions;
    if (req.query.from && req.query.to) {
      console.log("tiene desde y hasta")

      userSesionsToShow = userSesionsToShow.filter(sesion => sesion.date > new Date(req.query.from) && sesion.date < new Date(req.query.to)
      );

    }else{
      console.log("NO tiene desde y hasta")
    }
    if (req.query.limit){ 
      userSesionsToShow = userSesionsToShow.slice(0, req.query.limit);
    }
    console.log(data)
    res.json({
      username: data.name,
      count: data.count,
      log: userSesionsToShow.map((sesion) => { return { description: sesion.description, duration: sesion.duration, date: sesion.date   }; })
    });
  });
});

  
  
  

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
