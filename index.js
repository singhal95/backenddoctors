// all necessary imports need to make serve listen and database to connect
//to get information about the modules search https://www.npmjs.com/ with module name
const express = require('express');
const mongoose= require('mongoose');
const userRoutes = require('./routes/userRoutes');
const newRoutes = require('./routes/newRoute')
const adminRoutes = require('./routes/adminRoute')
const patientRoutes = require('./routes/patientRoute')
const doctorRoutes = require('./routes/doctorRoute')
const cors = require("cors")
const path = require('path');

//creating an object for express
const app = express();

//defining a port where the server will run 
const PORT = 3001;



// all necessary midlware that will be use in express server from getting the request to sending the response 
//to jum from one midlware to another midlware use next()
//the order in which you will use app.use() function in that order the midleware will stack.
//midleware means that has access to req,res,next object.
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use(userRoutes);
app.use(newRoutes);
app.use(adminRoutes);
app.use(doctorRoutes)
app.use(patientRoutes)


//defining these midlware so that if any url comes whose route isnot defined we can send the default response





//connecting to the mongodb server
//27017 is a default port number where monogodb server runs 
//doctorsapp is a db name that will be created for our application.





mongoose.connect("mongodb+srv://nitin07singhal:dCFOl2TRnlMLUFhb@workshop.uktxcbm.mongodb.net/doctorsapp?retryWrites=true&w=majority&appName=workshop").then(()=>{
    console.log("connected to mongoDB");
}).catch((err)=>{
    console.log(err);
})


//making the express server to listen the incomming request.
app.listen(PORT, ()=> {
    console.log(`server started at ${PORT}`);
})