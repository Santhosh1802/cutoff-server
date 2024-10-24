const express=require("express");
const bodyParser=require("body-parser");
const cors=require("cors");
const nodemailer=require("nodemailer");
const dotenv=require('dotenv');
const {MongoClient, ServerApiVersion}=require('mongodb');

dotenv.config();

const app=express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended:true}));

const transporter=nodemailer.createTransport({
    host:'smtp-relay.brevo.com',
    port:587,
    auth:{
        user:process.env.GMAIL_USER,
        pass:process.env.GMAIL_PASSWORD,
    }
});

const url=`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.nhfk7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client=new MongoClient(url,{
    serverApi:{
        version:ServerApiVersion.v1,
        strict:true,
        deprecationErrors:true,
    }
});

app.post("/data",(req,res)=>{
    const name=req.body.name;
    const email=req.body.email;
    const dob=req.body.dob;
    const maths=parseInt(req.body.maths);
    const physics=parseInt(req.body.physics);
    const chemistry=parseInt(req.body.chemistry);
    const cutoff=parseFloat(maths+(physics/2)+(chemistry/2));
    console.log("Cutoff:",Math.round(cutoff).toFixed(2));
    
    const mailOptions={
        from:"santhoshklearning@gmail.com",
        to:email,
        subject:'Cutoff mark',
        html:`<h1>Cutoff mark</h1>
            <h2>${name} your cutoff mark is: ${cutoff}
            </h2><br><p>For your marks in Maths:${maths}</p>
            <p>For your marks in Physics:${physics}</p>
            <p>For your marks in Chemistry:${chemistry}</p>`
    }
    transporter.sendMail(mailOptions,function(error,info){
        if(error){
            console.error("Error:",error);
            res.status(500).send(`Error sending mail to ${email}`);
        }
        else{
            console.log(`Mail Sent to ${email}`);
            async function run() {
                try{
                    await client.connect();
                    const db=client.db("CutoffDB");
                    const collection=db.collection("cutoff");
                    const data=await collection.insertOne({
                        "name":name,
                        "email":email,
                        "dob":dob,
                        "maths_mark":maths,
                        "physics_mark":physics,
                        "chemistry_mark":chemistry,
                        "cutoff":cutoff
                    });
                    console.log("Inserted data to the Database.");
                }
                finally{
                    await client.close();
                }
            }
            run().catch(console.dir);
            res.status(200).send(`Mail Sent to ${email}`);
        }
    })  
})

const port=process.env.SERVER_PORT;
app.listen(port,()=>{
    console.log(`Server running in port ${port}`);
    console.log(`http://localhost:${port}`);
})