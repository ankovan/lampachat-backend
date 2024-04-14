import express from 'express';
import { Server } from 'socket.io';
import moment from 'moment';

const app = express();
const server = app.listen(6001);

const io = new Server(server, { path: "/", cors: { origin: '*' } });
const roomIds = ["Chatting"];
const users = {};

//get users from current room
const getRoomUsers = (room) => {
    return [...io.sockets.adapter.rooms.get(room)].map(userid => {
        return {...users[userid], id: userid}
    })
}

io.on("connection", (socket) => {
    socket.emit('connected', {message: "a new client connected"})
    console.log("CONNECTED!");
    //user sends message to all users
    socket.on("chat", (event) => {
        var now = moment().format('HH:mm');
        io.emit('chat', {
            id: socket.id,
            message: event,
            date: now,
            activeRoom: "Chatting",
        })
        console.log("MESSAGE:", event, socket.id);
        console.log(socket.rooms)
    });

    socket.on("joinRoom", (event) => {
        socket.join(event.roomId); // add user to room
        users[socket.id] = event // add store username
        // send user info to every one
        io.emit('getUserInfo', {
            id: socket.id,
            username: event.username,
            color: event.color,
            roomId: event.roomId
        })
        
        // send to user info about users in active room 
        socket.emit('getRoomUsers', {
            roomId: event.roomId,
            users: getRoomUsers(event.roomId),
        })
    });
    // send all existing rooms
    socket.on("getRoomIds", () => {
        socket.emit('roomIds', {
            roomIds,
        })
    })
    socket.on("disconnect", (reason) => {
        console.log(reason);
        io.emit("userDisconnected", {
            id: socket.id,
            username: users[socket.id].username,
            roomId: users[socket.id].roomId,
        }) 
      });
}); 

