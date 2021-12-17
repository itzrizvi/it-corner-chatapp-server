const http = require("http");
const express = require("express");
const cors = require("cors");
const socketIO = require("socket.io");


const app = express();
const port = 5000 || process.env.PORT;
const server = http.createServer(app);

const users = [{}];
app.use(cors());

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

    socket.on('typing', (user) => {
        socket.broadcast.emit('typing', user);
        // console.log(`${user} is Typing`);
    })

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