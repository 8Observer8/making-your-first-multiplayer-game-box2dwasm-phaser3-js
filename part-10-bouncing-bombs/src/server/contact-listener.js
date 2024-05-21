import shortId from 'shortid';
import { box2d } from './init-box2d.js';
import { entityCategory } from './entity-category.js';
import { serverEvents, makeMessage } from '../share/events.js';

export default class ContactListener {

    constructor(world, pixelsPerMeter, metaData, clientIds, players,
        starInfo, starFixtures, bombInfo, bombBodies) //
    {
        this.world = world;
        this.pixelsPerMeter = pixelsPerMeter;
        this.metaData = metaData;
        this.clientIds = clientIds;
        this.players = players;
        this.starInfo = starInfo;
        this.starTotal = starInfo.length;
        this.starCounter = 0;
        this.starFixtures = starFixtures;
        this.bombInfo = bombInfo;
        this.bombBodies = bombBodies;

        const {
            b2_dynamicBody,
            b2_staticBody,
            b2BodyDef,
            b2CircleShape,
            b2Contact,
            b2Filter,
            b2FixtureDef,
            b2WorldManifold,
            b2Vec2,
            getPointer,
            JSContactListener,
            wrapPointer
        } = box2d;

        const self = this;
        this.instance = Object.assign(new JSContactListener(), {
            BeginContact(contact) {
                contact = wrapPointer(contact, b2Contact);

                const fixtureA = contact.GetFixtureA();
                const fixtureB = contact.GetFixtureB();

                const userDataA = self.metaData[getPointer(fixtureA)];
                const userDataB = self.metaData[getPointer(fixtureB)];

                if (!userDataA || !userDataB) {
                    return;
                }

                const idA = userDataA.id;
                const idB = userDataB.id;
                const typeA = userDataA.type;
                const typeB = userDataB.type;

                if ((typeA == 'player' && typeB == 'star') ||
                    (typeA == 'star' && typeB == 'player')) //
                {
                    let starBody, starFixture, starUserData;
                    let clientId, starId;

                    if (typeA == 'player' && typeB == 'star') {
                        starFixture = fixtureB;
                        starBody = fixtureB.GetBody();
                        starUserData = userDataB;
                        clientId = idA;
                        starId = idB;
                    } else if (typeA == 'star' && typeB == 'player') {
                        starFixture = fixtureA;
                        starBody = fixtureA.GetBody();
                        starUserData = userDataA;
                        clientId = idB;
                        starId = idA;
                    }

                    self.starInfo.find(x => x.id === starId).visible = false;
                    self.starCounter++;

                    setTimeout(() => {
                        starFixture.SetSensor(true);
                        starBody.SetType(b2_staticBody);
                        starBody.SetTransform(new b2Vec2(starUserData.initialPosX,
                            starUserData.initialPosY), 0);
                        const filter = new b2Filter();
                        filter.categoryBits = entityCategory.INACTIVE_STARS;
                        starFixture.SetFilterData(filter);
                        self.players[clientId].score += 10;
                        for (const key in self.players) {
                            self.players[key].socket.send(makeMessage(serverEvents.outgoing.SCORE,
                                JSON.stringify({ id: clientId, score: self.players[clientId].score })));
                        }
                        if (self.starCounter === self.starTotal) {
                            self.starCounter = 0;
                            for (let i = 0; i < self.starFixtures.length; i++) {
                                self.starFixtures[i].SetSensor(false);
                                self.starFixtures[i].GetBody().SetType(b2_dynamicBody);
                                const filter = new b2Filter();
                                filter.categoryBits = entityCategory.STARS;
                                self.starFixtures[i].SetFilterData(filter);
                                self.starInfo[i].visible = true;
                            }

                            const randomFloat = (min, max) => Math.random() * (max - min) + min;

                            const x = randomFloat(0, 800);
                            const bombShape = new b2CircleShape();
                            bombShape.m_radius = 7 / self.pixelsPerMeter;
                            const bombBodyDef = new b2BodyDef();
                            bombBodyDef.type = b2_dynamicBody;
                            const bombPosX = x / self.pixelsPerMeter;
                            const bombPosY = 20 / self.pixelsPerMeter;
                            bombBodyDef.set_position(new b2Vec2(bombPosX, bombPosY));
                            const bombBody = self.world.CreateBody(bombBodyDef);
                            bombBody.SetFixedRotation(true);
                            // bombBody.SetGravityScale(0);
                            bombBody.SetLinearVelocity(new b2Vec2(randomFloat(-3, 3), 2));
                            const bombFixtureDef = new b2FixtureDef();
                            const bombFixture = bombBody.CreateFixture(bombShape, 1);
                            bombFixture.SetFriction(0);
                            bombFixture.SetRestitution(1);

                            const bombId = shortId.generate();
                            self.bombInfo.push({ id: bombId, position: { x: bombPosX, y: bombPosY } });
                            metaData[getPointer(bombFixture)] = {
                                id: bombId,
                                type: 'bomb'
                            };

                            const filter = new b2Filter();
                            filter.categoryBits = entityCategory.BOMBS;
                            filter.maskBits = entityCategory.PLATFORMS |
                                entityCategory.TOP_WALL | entityCategory.REST_WALLS |
                                entityCategory.PLAYER;
                            bombFixture.SetFilterData(filter);
                            self.bombBodies.push(bombBody);
                        }
                    }, 0);
                }

                if ((typeA == 'player' && typeB == 'bomb') ||
                    (typeA == 'bomb' && typeB == 'player')) //
                {
                    let playerBody, playerFixture, playerUserData;
                    let clientId;

                    if (typeA == 'player' && typeB == 'bomb') {
                        playerFixture = fixtureA;
                        playerBody = fixtureA.GetBody();
                        playerUserData = userDataA;
                        clientId = idA;
                    } else if (typeA == 'bomb' && typeB == 'player') {
                        playerFixture = fixtureB;
                        playerBody = fixtureB.GetBody();
                        playerUserData = userDataB;
                        clientId = idB;
                    }

                    setTimeout(() => {
                        playerBody.SetTransform(new b2Vec2(playerUserData.initialPosX,
                            playerUserData.initialPosY), 0);
                        self.players[clientId].score = 0;
                        for (const key in self.players) {
                            self.players[key].socket.send(makeMessage(serverEvents.outgoing.SCORE,
                                JSON.stringify({ id: clientId, score: self.players[clientId].score })));
                        }
                    }, 0);
                }

                if ((typeA == 'bomb' && typeB == 'platform') ||
                    (typeA == 'platform' && typeB == 'bomb') ||
                    (typeA == 'bomb' && typeB == 'wall') ||
                    (typeA == 'wall' && typeB == 'bomb')) //
                {
                    let bombBody;
                    if (typeA == 'bomb') {
                        bombBody = fixtureA.GetBody();
                    } else {
                        bombBody = fixtureB.GetBody();
                    }
                    const vel = bombBody.GetLinearVelocity();
                    const m = new b2WorldManifold();
                    contact.GetWorldManifold(m);
                    const x = Math.round(m.normal.x);
                    const y = Math.round(m.normal.y);
                    if ((x == 1 && y == 0) || x == -1 && y == 0) {
                        vel.x = -vel.x;
                        bombBody.SetLinearVelocity(vel);
                    } else if ((x == 0 && y == 1) || (x == 0 && y == -1)) {
                        vel.y = -vel.y;
                        bombBody.SetLinearVelocity(vel);
                    }
                }
            },
            EndContact(contact) {},
            PreSolve(contact) {},
            PostSolve(contact) {}
        });
    }
}
