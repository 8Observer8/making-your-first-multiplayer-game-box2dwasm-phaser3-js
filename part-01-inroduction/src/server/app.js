import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import { box2d, initBox2D } from "./init-box2d.js";

const app = express();
app.use(express.static(path.join(process.cwd(), 'public')));

const httpServer = http.createServer(app);
const port = process.env.PORT || 3000;
httpServer.listen(port, () => {
    console.log(`Listening at port: ${port}`);
});

const webSocketServer = new WebSocketServer({ server: httpServer });

webSocketServer.on('connection', client => {
    console.log(`Client was connected`);
});

async function init() {
    await initBox2D();

    const {
        b2Vec2,
        b2World
    } = box2d;

    const gravity = new b2Vec2(0, 10);
    const world = new b2World(gravity);
    const g = world.GetGravity();
    console.log(`gravity = (${g.x}, ${g.y})`);
}

init();
