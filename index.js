const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');
const {Schema} = mongoose;
mongoose.connect(process.env.DB_URL);

const userSchema = new Schema({
  username: String,
});
const User = mongoose.model('User', userSchema);

const excerciseSchema = new Schema({
  user_id: {type: String, required: true},
  description: String,
  duration: Number,
  date: Date,
})
const Exercise = mongoose.model('Exercise', excerciseSchema);


app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({extended:true}))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', async (req,res)=>{
  console.log(req.body);
  const userObject = new User({
    username: req.body.username
  })
  try{
    const user = await userObject.save();
    res.json({
      _id: user._id,
      username: user.username,
    });
  }catch(err){
    console.log(err);
  }

})

app.get('/api/users',async (req,res)=>{
  try{
    const users = await User.find({}).select("_id username");
    const response = users.map((user)=>({
      username:user.username,
      _id:user._id
    }))
    res.json(response);
  }catch(error){
    console.log(error);
    console.log("There was an error saving the user");
  }
})

app.post('/api/users/:_id/exercises', async(req,res)=>{
  const id = req.params._id;
  const{description,duration,date} = req.body;
  try{
    const user = await User.findById(id);
    if(!user){
      res.send("Could not find user")
    }else{
      const exerciseObj = new Exercise({
        user_id: id,
        description: description,
        duration: duration,
        date : date ? new Date(date) : new Date()
      })
      const exercise = await exerciseObj.save();
      res.json({
        _id: user._id,
        username: user.username,
        description: exercise.description,
        duration: exercise.duration,
        date: new Date(exercise.date).toDateString()
      })
    }
  }catch(err){
    console.log(err);
    console.log("There was an error saving the excercise");
  }
})

// app.get('/api/users/:_id/logs',async (req,res)=>{
//   const id = req.params._id;
//   try{
//     const user = await User.findById(id);
//     if(!user){
//       res.send("Could not find user")
//     }else{
//       const exercises = await Exercise.find({user_id:id}).select("_id description duration date");
//       const log = exercises.map((exercise)=>{
//         return{
//           description: exercise.description,
//           duration: exercise.duration,
//           date: new Date(exercise.date).toDateString()
//         }
//       })
//       res.json({
//         username:user.username,
//         count:exercises.length,
//         _id:id,
//         log:log,
//       });
//     }
//   }catch(err){
//     console.log(err);
//   }
// })

app.get('/api/users/:_id/logs', async (req,res)=>{
  const{from,to,limit} = req.query;
  const id=req.params._id;
  const user = await User.findById(id);
  if(!user){
    console.log("Could not find user");
    return;
  }
  let dateObj = {};
  if(from){
    dateObj["$gte"] = new Date(from);
  }
  if(to){
    dateObj["$lte"] = new Date(to);
  }
  let filter = {
    user_id:id
  }
  if(from || to){
    filter.date = dateObj
  }
  console.log(filter);
  const exercises = await Exercise.find(filter).limit(+limit??500)
  const log = exercises.map((exercise)=>({
    description:exercise.description,
    duration:exercise.duration,
    date:exercise.date.toDateString()
  }))
  res.json({
    username:user.username,
    count:exercises.length,
    _id:id,
    log:log
  })
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
