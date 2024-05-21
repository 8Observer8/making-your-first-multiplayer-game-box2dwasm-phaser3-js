import { box2d } from './init-box2d.js';
import { entityCategory } from './entity-category.js';
import { serverEvents, makeMessage } from '../share/events.js';

export default class ContactListener {

    constructor(metaData, clientIds, players, starInfo) {
        this.metaData = metaData;
        this.clientIds = clientIds;
        this.players = players;
        this.starInfo = starInfo;

        const {
            b2_staticBody,
            b2Contact,
            b2Filter,
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

                    setTimeout(() => {
                        starFixture.SetSensor(true);
                        starBody.SetType(b2_staticBody);
                        starBody.SetTransform(new b2Vec2(starUserData.initialPosY,
                            starUserData.initialPosY), 0);
                        const filter = new b2Filter();
                        filter.categoryBits = entityCategory.INACTIVE_STARS;
                        starFixture.SetFilterData(filter);
                        self.players[clientId].score += 10;
                        for (const key in self.players) {
                            self.players[key].socket.send(makeMessage(serverEvents.outgoing.SCORE,
                                JSON.stringify({ id: clientId, score: self.players[clientId].score })));
                        }
                    }, 0);
                }
            },
            EndContact(contact) {},
            PreSolve(contact) {},
            PostSolve(contact) {}
        });
    }
}
