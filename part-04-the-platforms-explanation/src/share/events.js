export const clientEvents = {
    outgoing: {
        TOGGLE_DEBUG_MODE: 'csToggleDebugMode'
    },
    incoming: {
        PLATFORM_INFO: 'scPlatformInfo',
        COLLIDER_INFO: 'scColliderInfo',
        CLEAR_COLLIDER_INFO: 'scClearColliderInfo'
    }
};

export const serverEvents = {
    incoming: {
        TOGGLE_DEBUG_MODE: 'csToggleDebugMode'
    },
    outgoing: {
        PLATFORM_INFO: 'scPlatformInfo',
        COLLIDER_INFO: 'scColliderInfo',
        CLEAR_COLLIDER_INFO: 'scClearColliderInfo'
    }
};

export function makeMessage(action, data) {
    const resp = {
        action: action,
        data: data
    };

    return JSON.stringify(resp);
}
