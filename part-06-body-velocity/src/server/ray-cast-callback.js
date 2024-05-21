import { box2d } from './init-box2d.js';

export default class RayCastCallback {
    constructor(metaData) {
        this.metaData = metaData;

        const {
            b2Fixture,
            getPointer,
            JSRayCastCallback,
            wrapPointer
        } = box2d;

        const self = this;
        this.instance = Object.assign(new JSRayCastCallback(), {
            ReportFixture(fixture_p, point_p, normal_p, fraction) {
                const fixture = wrapPointer(fixture_p, b2Fixture);
                if (self.metaData[getPointer(fixture)]) {
                    const name = self.metaData[getPointer(fixture)].name;
                    // console.log(name);
                }
            }
        });
    }
}
