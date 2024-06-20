//importing all the necessary modules that are required.
const userModel = require('../models/users')
const inventoryModel = require('../models/inventory');
const { get } = require('mongoose');
const Bookings = require('../models/booking')


/*
this function will get all the doctors whose approval is 1 as all the doctors whose approval is 1 their profile is pending for approval.
As we have to restrict the api to only admin we have check the token if tis admin then only will be processing it.
*/
getApprovalRequestList = async(req,res)=>{
    if(req.data.user.role === "admin"){ // checking the token if it is from admin or not
    try {
        const doctorsList = await userModel.find({ role: 'doctor', approval: 1 });
        res.status(200).json({ status : 200,doctorsList: doctorsList });
    } catch (error) {
        //got error while doing server thing if you want to check either use some debug tool or console.log(error) here
        res.status(404).json({status:500});
    }
     }
    else{
    //send this code when the access user is not admin
    res.status(400).json({ status: 401 });
   }
}


/*
This api will approve the doctor profile i.e approval = 2 and we have to make the api restricted by checking the role in the jwt token is from admin or not 
after than as the approve doctor is post request and it accepts the _id in the body of the request and approval from the request body as admin can approve i. approval =2 or admin
can reject that is admin approval = 0 and will update it to the database.
*/
approveDoctor = async(req,res)=>{
    if(req.data.user.role == "admin"){
    try{
        const {_id} = req.body
        const updateData ={
            approval:req.body.approval
        }
          await  userModel.findByIdAndUpdate(_id,updateData,{ new: true }) // making it {new:true} is to the query should return the updated docuements.
        res.status(200).json({status:200})
    
    }catch(error){
        //got error while doing server thing if you want to check either use some debug tool or console.log(error) here
        res.status(500).json({status:500})
    
    }
    }
    else{
        //send this code when the access user is not admin
        res.status(400).json({status:401})
    }
}


/*
This api will return the doctor details of the sent id that is sent in query in get request and its a restricted api as we are checking the role from the 
jwt toekn as admin.
*/
getDoctorDetails=async(req,res)=>{
    if(req.data.user.role == "admin"){
        try{
            const id = req.query.id
            const userDetails =await userModel.findById({_id:id})
            res.status(200).json(userDetails)
        }catch(error){
            //got error while doing server thing if you want to check either use some debug tool or console.log(error) here
            res.status(500).json({status:500}) 
        }
        }
        else{
            //send this code when the access user is not admin
            res.status(400).json({status:401})
        }
}

/*
This function will return all the medicine inventories and it is restricted to the admin role as we are checking the role as admin from the jwt token.

*/
getAllInventory = async (req,res)=>{
    if(req.data.user.role == "admin"){
        try{
            const inventoryDetails =await inventoryModel.find()
            res.status(200).json(inventoryDetails)
        }catch(error){
            //got error while doing server thing if you want to check either use some debug tool or console.log(error) here
            res.status(500).json({status:500}) 
        }
        }
        else{
            //send this code when the access user is not admin
            res.status(400).json({status:401})
        }
}

/*
This function will accept the medicine_name and available_quantity as body in the request and it will find the document in the inventory collection 
with medicine_name and update it with available_quantity.And one more this we are also changing the medicine_name to lowercase for making our 
database consistent.
*/
updateInventory = async(req,res)=>{
    if(req.data.user.role == "admin"){
        try{
            console.log(req.body.medicine_name)
             req.body.medicine_name = req.body.medicine_name.toLowerCase()
            const inventoryDetails =await inventoryModel.findOneAndUpdate({medicine_name:req.body.medicine_name},req.body,{ new: true }) // {new:true} so that after updating the document it will return the updated document.
            res.status(200).json(inventoryDetails)
        }catch(error){
            //got error while doing server thing if you want to check either use some debug tool or console.log(error) here
            res.status(500).json({status:500}) 
        }
        }
        else{
            //send this code when the access user is not admin
            res.status(400).json({status:401})
        }
}



/*
This function wll bulk update and insert if it does not exisits.It will accept the json array containing the  
*/
bulkInsertInventory = async(req,res)=>{
    if(req.data.user.role == "admin"){
    try{
    const doc = req.body.data
    doc.forEach(obj => {
        obj.medicine_name=obj.medicine_name.toLowerCase()
      });
    const result = await inventoryModel.bulkWrite(
        doc.map(obj => ({
            updateOne: {
                filter: { medicine_name: obj.medicine_name },
                update: { $set: obj },
                upsert: true 
            }
        }))
    );
    console.log(result)
    res.status(200).json({status:200})
    }catch(error){
        console.log(error)
        res.status(500).json({status:500}) 
    }
    }
    else{
        res.status(400).json({status:401})
    }
}



getTotalPatientByDoctor = async (req,res) =>{
        try{
  

 const details=  await Bookings.aggregate([
  {
    $group: {
      _id: '$doctor_id', 
      uniquePatients: { $addToSet: '$patient_id' },
    }
  },
  {
    $project: {
      _id: 1, 
      uniquePatientCount: { $size: '$uniquePatients' },
    }
  },
  {
    $lookup: {
      from: 'users',
      localField: '_id',
      foreignField: '_id',
      as: 'doctorDetails'
    }
  },
  {
    $unwind: "$doctorDetails" // To deconstruct the array from the lookup
  }
])


        res.status(200).json(details)
        }catch(error){
            console.log(error)
            res.status(500).json({status:500}) 
        }
   
}


getTotalPAtientByDate = async (req,res)=>{
    try{

        const date = await Bookings.aggregate([{ $group: { _id: null, maxDate: { $max: "$bookingDate" } } }])
        if(date.length == 0)
           res.status(200).json({status:210})
        const maxDate = date[0].maxDate
        maxDate.setHours(0, 0, 0, 0)
        console.log(maxDate)
        maxDate.setDate(maxDate.getDate() -9);
        console.log(maxDate)

        const details=  await Bookings.aggregate([
            {
              $match: {
                bookingDate: {
                  $gte: new Date(maxDate)
                }
              }
            },
            {
              $group: {
                _id: {
                  $dateToString: { format: "%Y-%m-%d", date: "$bookingDate" }
                },
                totalPatients: { $sum: 1 }
              }
            },
            {
              $sort: { _id: 1 }
            }
          ]);
          console.log(details)
          const transformedResult = details.reduce((acc, current) => {
            acc[current._id] = { totalPatients: current.totalPatients };
            return acc;
          }, {});

          res.status(200).json(transformedResult)
        }catch(error){
            console.log(error)
            res.status(500).json({status:500}) 
        }
}

module.exports = {
    getApprovalRequestList,
    approveDoctor,
    getDoctorDetails,
    getAllInventory,
    updateInventory,
    bulkInsertInventory,
    getTotalPatientByDoctor,
    getTotalPAtientByDate
}