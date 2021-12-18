const http = require("http");
const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const socketIO = require("socket.io");


const app = express();
const port = 5000 || process.env.PORT;
const server = http.createServer(app);

const users = [{}];
app.use(cors());
app.use(express.json());

const uri = "mongodb+srv://itCornerChat:01766922253@cluster1.fprcc.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run(){
    try{
        await client.connect();
        const database = client.db("it_cornerChat");
        const usersCollection = database.collection("users_data");
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
        })



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
        socket.broadcast.emit('joinedUser', { user: 'Admin', message: `${users[socket.id]} Has Joined` });
        socket.emit('welcome', { user: 'Admin', message: `Welcome to the chat ${users[socket.id]}` });
    });

    socket.on("message", ({ message, id }) => {
        io.emit('messageSent', { user: users[id], message, id });
    });

    // socket.on('typing', (user) => {
    //     socket.broadcast.emit('typing', user);
    // })
    socket.on('typingProcess', (typingKeys) => {
        socket.broadcast.emit('typingProcess', typingKeys);
    })

    socket.on('user', (user)=>{
        socket.broadcast.emit('user', user);
    });

    socket.on('disconnectUser', () => {
        socket.broadcast.emit('leave', { user: 'Admin', message: `${users[socket.id]} Has Left` })
        // console.log('User Left');
    })




});

app.get("/", (req, res) => {
    res.send('Hello IT-Corner ChatApp');
});

server.listen(port, () => {
    console.log(`Listening to Server: ${port}`);
});