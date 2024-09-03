const express = require('express')
const app = express()
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

const cors = require('cors')
require('dotenv').config()

const mongoose = require('mongoose');
mongoose.connect(process.env['MONGO_URI'], { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = mongoose.Schema({
  'username': {
    type: String,
    required: true
  }
}, {versionKey: false});

let User = mongoose.model('User', userSchema);

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


const exerciseSchema = mongoose.Schema({
  'description': {
    type: String,
    required: true
  },
  'duration': {
    type: Number,
    required: true
  },
  'date': String,
  
}, {__v:{type: Number, select: false}});

let Exercise = mongoose.model('Exercise', exerciseSchema);


const exerciseLogSchema = mongoose.Schema({
  '_id': {
    type: String,
    required: true
  },

  'username': {
    type: String,
    required: true
  },

  'count': {
    type: Number,
  },

  'log': {
    type: [Map]
  },

});

let ExerciseLog = mongoose.model('ExerciseLog', exerciseLogSchema);


app.post('/api/users', (req, res) => {
  const body = req.body;
  let user = User({ username: body.username });
  user.save((err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);

ExerciseLog({ '_id': result._id, 'username': result.username, 'count': 0, 'log': [] }).save();
    }
  });

});

app.post('/api/users/:_id/exercises', (req, res) => {
  const id = req.params._id;
  const body = req.body;

  let date = new Date();


  if(body.date) {
    const data = body.date.split('-');
    date = new Date(data[0],data[1] - 1, data[2]);
  
  }

  const exercise = Exercise({ description: body.description, duration: Number(body.duration), date: date.toDateString() });

  User.findOne({ '_id': id }).lean().then(doc => {  
    // doc.date = body['date'] == '' ? date.toDateString() : body['date'];
    // doc.duration= Number(body['duration']);
    // doc.description= body.description;
    
    
    res.json({
      '_id': doc._id,
      'username': doc.username,
      'date': exercise.date,
      'duration': exercise.duration,
      'description': exercise.description
    }
    );
  });


  ExerciseLog.findById({_id: id}).then(value => {
    value.count += 1;
      value.log.push({
        'date': exercise.date,
      'duration': exercise.duration,
      'description': exercise.description
      });
      value.save();
    });

});

app.get('/api/users/:_id/logs', (req, res) => {
  const id = req.params._id;
  
  if(!req.query.from && !req.query.to && !req.query.limit) {
    ExerciseLog.findById({_id: id}).lean().then(value => {
      res.send(value);
    });
  } else {
    const from = req.query.from;
    const to = req.query.to;
    const limit = req.query.limit;

    ExerciseLog.find({_id: id,}).lean().then(doc => {
      
      let logs =doc[0]['log'];
      // logs.sort(function(a,b) {
      //   return new Date(a.date) -new Date(b.date);
      // });
      // let result = [];
      
      // for(let i = 0; i < logs.length; i++) {
        
      //   if(Date.parse(logs[i]['date']) >= Date.parse(from ?? '2020-01-01') && Date.parse(logs[i]['date'])<= Date.parse(to??Date())) {
      //     result.push(logs[i]);
      //   }
      // }

      if(from){
        const fromDate= new Date(from)
        logs = logs.filter(exe => new Date(exe.date) > fromDate);
      }
      
      if(to){
        const toDate = new Date(to)
        logs = logs.filter(exe => new Date(exe.date) < toDate);
      }
      
      if(limit){
        logs = logs.slice(0,limit);
      }

      // result = result.slice(0,limit);
      res.json({
        '_id': id,
        'username': doc[0]['username'],
        'count': logs.length,
        'log': logs});
      
      
    });
  }



});

app.get('/api/users', (req, res) => {
  User.find().then(value => {

    res.send(value);
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
