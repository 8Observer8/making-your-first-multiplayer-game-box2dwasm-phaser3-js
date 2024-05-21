export const clientEvents = {
    outgoing: {
        TOGGLE_DEBUG_MODE: 'csToggleDebugMode'
    },
    incoming: {

    }
};

export const serverEvents = {
    incoming: {
        TOGGLE_DEBUG_MODE: 'csToggleDebugMode'
    },
    outgoing: {

    }
};

export function makeMessage(action, data) {
    const resp = {
        action: action,
        data: data
    };

    return JSON.stringify(resp);
}
