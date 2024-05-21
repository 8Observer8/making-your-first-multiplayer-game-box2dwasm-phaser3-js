import { WEBGL, Scale, Game } from 'phaser3';

let host;

if (window.location.host === 'localhost:3000') {
    host = 'ws://localhost:3000';
} else {
    host = 'wss://my-game.onrender.com';
}
const ws = new WebSocket(host);

const config = {
    type: WEBGL,

    canvas: document.getElementById('renderCanvas'),
    width: 800,
    height: 600,
    scaleMode: Scale.ScaleModes.FIT,
    autoCenter: Scale.Center.CENTER_BOTH,

    autoFocus: true,
    scene: { preload, create, update },
    backgroundColor: '#555'
};

new Game(config);

function preload() {
    console.log('preload');
}

function create() {
    console.log('create');
}

function update() {}

ws.onopen = () => {
    console.log('Connected to server');
};
//# sourceMappingURL=index.js.map
