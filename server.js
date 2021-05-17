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
   // Array of rutins
  sesions: [{
    description: String,
    duration: String,
    date: String
  }],
});

const Person = mongoose.model('Athlete', PersonSchema);

app.post("/api/users/", function(req, res){
  //we can do that because there is the Parser 
  var newPerson = new Person({name: req.body.username, sesions: []});
	
  newPerson.save((error, data) => {
		if(error){
      console.log(error);
		}else{
			console.log("save successful")
      res.json({
        "username": newPerson.name,
        "_id": newPerson._id
      });
		}
	});
});


app.post("/api/users/:_id/exercises", function(req, res){
  //we can do that because there is the Parser 
  let {userId, description, duration, date} = req.body;
  console.log(req.body)
  if(!date){
    date = new Date();
  }

  var newSesion = {
    description: description,
    duration: duration,
    date: date
  };

  Person.findByIdAndUpdate(req.params._id, {$push: {sesions: newSesion}}, { new: true },(error,data)=>{
    if(error){
      console.log(error);
		}else{
      res.json({
        "description" : newSesion.description,
        "date": new Date(newSesion.date).toDateString(),
        "duration": newSesion.duration,
        _id: req.params._id
      });
		}
  });

  
});
  
  
  
  
  
  
  
  

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
