const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const { v4: uuidV4 } = require('uuid');
const url = 'mongodb://localhost:27017';
const db_name = 'video-chat';
let db = null;
let messages = null;

MongoClient.connect(
    url,
    null,
    (err, client) => {
        if (err) return console.log(err)
        
        // Storing a reference to the database so you can use it later
        db = client.db(db_name)
        messages = db.collection('messages');
        console.log(`Connected MongoDB: ${url}`);
        console.log(`Database: ${db_name}`);
        // console.log('messages: ', messages);
    }
);
// app.set('view engine', 'html')
app.use(express.static(`${__dirname}/public`));

// app.set('views', 'public');

app.get('/', (req, res) => {
    res.redirect(`/${uuidV4()}`)
});

app.get('/:room', (req, res) => {
    res.sendFile(`${__dirname}/public/room.html`);
});

io.on('connection', socket => {
    socket.on('join-room:video-chat', (roomId, userId) => {
        socket.join(roomId);
        socket.on('ready', () => {
            socket.to(roomId).emit('user-connected', userId);
        });
    });
    socket.on('join-room:messages-chat', roomId => {
        messages.find({ room_id: roomId }).sort({ date: 1}).toArray((err, msgs) => {
            socket.join(roomId);
            io.to(roomId).emit('list-room-messages', JSON.stringify(msgs), socket.user_name);
        });
    });
    socket.on('user-logged', ({ user_name }) => {
        socket.user_name = user_name;
    });
    socket.on('message-send', data => {
        console.log('message-send: ', data);
        const data_to_send = JSON.parse(data);
        messages.insertOne(data_to_send, (error, result) => {
            // console.log(error, result);
        });
        io.emit('message-received', JSON.stringify({ ...data_to_send, user_name: socket.user_name }));
    });
    socket.on('user-typing-start', () => {
        io.emit('user-typing-start', socket.user_name);
    });
    socket.on('user-typing-end', () => {
        io.emit('user-typing-end');
    })
});

server.listen(3000)