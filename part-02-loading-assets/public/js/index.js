import { WEBGL, Scale, Game } from 'phaser3';

const clientEvents = {
    outgoing: {
        TOGGLE_DEBUG_MODE: 'csToggleDebugMode'
    },
    incoming: {

    }
};

function makeMessage(action, data) {
    const resp = {
        action: action,
        data: data
    };

    return JSON.stringify(resp);
}

let host;

if (window.location.host === 'localhost:3000') {
    host = 'ws://localhost:3000';
} else {
    host = 'wss://';
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
    backgroundColor: '#555',

    callbacks: {
        preBoot: (game) => {
            game.scale.on('resize', onResize, game);
        }
    }
};

function onResize() {
    const { right, top } = this.scale.canvasBounds;

    debugInfoPanel.style.top = `${top + 10}px`;
    debugInfoPanel.style.left = `${right - debugInfoPanel.clientWidth - 20}px`;
    debugInfoPanel.style.display = 'block';
}

const debugInfoCheckBox = document.getElementById('debugInfoCheckBox');
let showDebugInfo = debugInfoCheckBox.checked;
debugInfoCheckBox.onchange = () => {
    showDebugInfo = debugInfoCheckBox.checked;
    ws.send(makeMessage(clientEvents.outgoing.TOGGLE_DEBUG_MODE,
        JSON.stringify({ debugMode: showDebugInfo })));
};

new Game(config);

function preload() {
    this.load.image('sky', 'assets/sky.png');
    this.load.image('ground', 'assets/platform.png');
    this.load.image('star', 'assets/star.png');
    this.load.image('bomb', 'assets/bomb.png');
    this.load.spritesheet('dude', 'assets/dude.png', {
        frameWidth: 32,
        frameHeight: 48
    });
}

function create() {
    this.add.image(400, 300, 'sky');
    this.add.image(400, 300, 'star');
}

function update() {}
//# sourceMappingURL=index.js.map
