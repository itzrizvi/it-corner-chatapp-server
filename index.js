const http = require("http");
const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const ObjectId = require('mongodb').ObjectId;
const bodyParser = require('body-parser')
const socketIO = require("socket.io");


const app = express();
const port = 5000 || process.env.PORT;
const server = http.createServer(app);

const users = [{}];
app.use(cors());
app.use(express.json());
app.use(bodyParser.json({
    limit: '50mb'
  }));
  
  app.use(bodyParser.urlencoded({
    limit: '50mb',
    parameterLimit: 100000,
    extended: true 
  }));

const uri = "mongodb+srv://itCornerChat:01766922253@cluster1.fprcc.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run(){
    try{
        await client.connect();
        const database = client.db("it_cornerChat");
        const usersCollection = database.collection("users_data");
        const messegeCollection = database.collection("messege_History");
        console.log("DB CONNECTED");

        // Adding user by register
        app.post('/users', async (req,res)=>{
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.json(result);
        });

        // GET all users
        app.get('/users', async (req,res)=>{
            const cursor = usersCollection.find({});
            const allUsers = await cursor.toArray();
            res.send(allUsers);
        });

        // Find Single User
        app.get('/users/:email', async (req, res)=>{
            const email= req.params.email;
            const query = {email: email}
            const findEmail = await usersCollection.findOne(query);
            res.json(findEmail);
        });

        // Adding messege history
        app.post('/msghistory', async (req,res)=>{
            const messegeReq = req.body;
            const result = await messegeCollection.insertOne(messegeReq);
            res.json(result);
        });

        app.get('/msghistory/:name', async(req, res)=>{
            const name = req.params.name;
            // const query ={user:name};
            const findUser = messegeCollection.find({user:name});
            console.log(findUser)
            res.json(findUser);
        });

         // GET all MSG
         app.get('/msghistory', async (req,res)=>{
            const cursor = messegeCollection.find({});
            const allMsg = await cursor.toArray();
            res.send(allMsg);
        });



    }
    finally{
        // await client.close();
    }
}
run().catch(console.dir);



const io = socketIO(server);

io.on("connection", (socket) => {
    // console.log("New Connection");

    socket.on('logedIn', ({ user }) => {
        users[socket.id] = user;
        // console.log(`${user} is logged in!!!`);
        // socket.broadcast.emit('joinedUser', { user: 'Admin', message: `${users[socket.id]} Has Joined` });
        // socket.emit('welcome', { user: 'Admin', message: `Hi ${users[socket.id]} Welcome to the IT-Corner Messenger - the #1 business messenger for connecting you to your customers. Want to find out more about IT-Corner?` });
        
    });

    socket.on("message", ({ message, mediaFiles, id }) => {
        io.emit('messageSent', { user: users[id], message, mediaFiles, id });
    });

    // socket.on('typing', (user) => {
    //     socket.broadcast.emit('typing', user);
    // })
    socket.on('typingProcess', (typingKeys) => {
        socket.broadcast.emit('typingProcess', typingKeys);
    });

    socket.on('user', (user)=>{
        socket.broadcast.emit('user', user);
    });

    // socket.on('disconnectUser', () => {
    //     socket.broadcast.emit('leave', { user: 'Admin', message: `${users[socket.id]} Has Left` })
    //     // console.log('User Left');
    // })




});

app.get("/", (req, res) => {
    res.send('Hello IT-Corner ChatApp');
});

server.listen(port, () => {
    console.log(`Listening to Server: ${port}`);
});