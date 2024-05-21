import { box2d } from './init-box2d.js';
import RayCastCallback from './ray-cast-callback.js';

export default class Player {

    constructor(metaData) {
        this.metaData = metaData;
        this.socket = null;
        this.id = null;
        this.body = null;
        this.leftRayCastCallback = new RayCastCallback(this.leftRayCastHandler.bind(this));
        this.rightRayCastCallback = new RayCastCallback(this.rightRayCastHandler.bind(this));
        this.groundedLeftRay = false;
        this.groundedRightRay = false;
        this.score = 0;
    }

    leftRayCastHandler(fixture_p, point_p, normal_p, fraction) {
        const {
            b2Fixture,
            getPointer,
            wrapPointer
        } = box2d;

        const fixture = wrapPointer(fixture_p, b2Fixture);
        const type = this.metaData[getPointer(fixture)].type;

        if (type === 'platform') {
            this.groundedLeftRay = true;
        }
    }

    rightRayCastHandler(fixture_p, point_p, normal_p, fraction) {
        const {
            b2Fixture,
            getPointer,
            wrapPointer
        } = box2d;

        const fixture = wrapPointer(fixture_p, b2Fixture);
        const type = this.metaData[getPointer(fixture)].type;

        if (type === 'platform') {
            this.groundedRightRay = true;
        }
    }
}
