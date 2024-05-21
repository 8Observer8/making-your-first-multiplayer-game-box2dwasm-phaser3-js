import express from 'express';
import http from 'http';
import shortId from 'shortid';
import { WebSocketServer } from 'ws';
import path from 'path';
import { box2d, initBox2D } from './init-box2d.js';
import { serverEvents, makeMessage } from '../share/events.js';
import DebugDrawer from './debug-drawer.js';

const app = express();
let world;
let debugMode = false;
const clientsInDebugMode = {};

const platformInfo = [];
platformInfo[0] = { x: 400, y: 568, w: 400, h: 32, scale: 2 };
platformInfo[1] = { x: 600, y: 400, w: 400, h: 32, scale: 1 };
platformInfo[2] = { x: 50, y: 250, w: 400, h: 32, scale: 1 };
platformInfo[3] = { x: 750, y: 220, w: 400, h: 32, scale: 1 };

const wallInfo = [];
wallInfo[0] = { x: 0, y: 300, w: 10, h: 600, xOffset: -5, yOffset: 0 };
wallInfo[1] = { x: 800, y: 300, w: 10, h: 600, xOffset: 5, yOffset: 0 };
wallInfo[2] = { x: 400, y: 0, w: 800, h: 10, xOffset: 0, yOffset: -5 };

app.use(express.static(path.join(process.cwd(), 'public')));

const httpServer = http.createServer(app);
const port = process.env.PORT || 3000;
httpServer.listen(port, () => {
    console.log(`Listening at port: ${port}`);
    init();
});

const webSocketServer = new WebSocketServer({ server: httpServer });

webSocketServer.on('connection', client => {
    const clientId = shortId.generate();
    console.log(`Client with id=${clientId} was connected`);

    client.send(makeMessage(serverEvents.outgoing.PLATFORM_INFO,
        JSON.stringify(platformInfo)));

    client.onmessage = event => {
        const action = JSON.parse(event.data).action;
        const data = JSON.parse(event.data).data;
        switch (action) {
            case serverEvents.incoming.TOGGLE_DEBUG_MODE: {
                debugMode = JSON.parse(data).debugMode;
                if (debugMode) {
                    clientsInDebugMode[clientId] = client;
                } else {
                    delete clientsInDebugMode[clientId];
                }
                break;
            }
        }
    };

    client.onclose = () => {
        console.log(`Client with id=${clientId} was disconnected`);
        if (clientsInDebugMode[clientId]) {
            delete clientsInDebugMode[clientId];
        }
        if (Object.keys(clientsInDebugMode).length === 0) {
            debugMode = false;
        }
    };
});

async function init() {
    await initBox2D();

    const {
        b2_dynamicBody,
        b2_staticBody,
        b2BodyDef,
        b2CircleShape,
        b2PolygonShape,
        b2Vec2,
        b2World
    } = box2d;

    const gravity = new b2Vec2(0, 10);
    world = new b2World(gravity);
    const pixelsPerMeter = 50;

    // Platforms
    for (let i = 0; i < platformInfo.length; i++) {
        const shape = new b2PolygonShape();
        const halfWidth = platformInfo[i].w * platformInfo[i].scale / 2 / pixelsPerMeter;
        const halfHeight = platformInfo[i].h * platformInfo[i].scale / 2 / pixelsPerMeter;
        shape.SetAsBox(halfWidth, halfHeight);
        const bodyDef = new b2BodyDef();
        bodyDef.type = b2_staticBody;
        const x = platformInfo[i].x / pixelsPerMeter;
        const y = platformInfo[i].y / pixelsPerMeter;
        bodyDef.set_position(new b2Vec2(x, y));
        const body = world.CreateBody(bodyDef);
        const fixture = body.CreateFixture(shape, 0);
        fixture.SetFriction(3);
    }

    // Walls
    for (let i = 0; i < wallInfo.length; i++) {
        const shape = new b2PolygonShape();
        const halfWidth = wallInfo[i].w / 2 / pixelsPerMeter;
        const halfHeight = wallInfo[i].h / 2 / pixelsPerMeter;
        shape.SetAsBox(halfWidth, halfHeight);
        const bodyDef = new b2BodyDef();
        bodyDef.type = b2_staticBody;
        const x = (wallInfo[i].x + wallInfo[i].xOffset) / pixelsPerMeter;
        const y = (wallInfo[i].y + wallInfo[i].yOffset) / pixelsPerMeter;
        bodyDef.set_position(new b2Vec2(x, y));
        const body = world.CreateBody(bodyDef);
        const fixture = body.CreateFixture(shape, 0);
        fixture.SetFriction(0);
    }

    const debugDrawer = new DebugDrawer(pixelsPerMeter, clientsInDebugMode);
    world.SetDebugDraw(debugDrawer.instance);
    setInterval(() => physicsLoop(), 16);
}

function physicsLoop() {
    world.Step(0.016, 3, 2);
    if (debugMode) {
        world.DebugDraw();
        // Clear colliders
        for (const key in clientsInDebugMode) {
            clientsInDebugMode[key].send(makeMessage(serverEvents.outgoing.CLEAR_COLLIDER_INFO, null));
        }
    }
}
