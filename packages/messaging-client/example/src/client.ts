import { MessagingClient, PresenceMessage, Lobby, ChallengeMessage } from "../../src/index";
import { Table } from "../../src/table";
import { getUID } from "../../src/utils/uid";

const params = new URLSearchParams(globalThis.location.search);
const userId = params.get('id') || getUID();
const userName = params.get('name') || 'User';

// Initialize the client on port 80 (default for hostname)
const client = new MessagingClient({
    baseUrl: globalThis.location.hostname
});

let lobby: Lobby | null = null;
let currentTable: Table | null = null;
let activeChallenge: ChallengeMessage | null = null;

async function initLobby(lobbyInstance: Lobby) {
    lobbyInstance.onUsersChange((users: PresenceMessage[]) => {
        const list = document.getElementById('user-list');
        const countEl = document.getElementById('count');
        
        if (countEl) countEl.innerText = `Online Users: ${users.length}`;
        if (list) {
            list.innerHTML = users.map(u => {
                const isMe = u.userId === userId;
                const inGame = !!u.tableId;
                const isSeeking = !!u.seek;
                
                let actionBtn = '';
                if (!isMe && !inGame) {
                    if (isSeeking) {
                        actionBtn = `<button class="btn-join" onclick="joinSeek('${u.userId}', '${u.seek?.tableId}')">Join Game</button>`;
                    } else {
                        actionBtn = `<button class="btn-challenge" onclick="challengeUser('${u.userId}')">Challenge</button>`;
                    }
                }

                return `
                    <li class="user-item ${isMe ? 'me' : ''}">
                        <div>
                            <span>${u.userName}</span>
                            <div class="status">
                                ${u.userId} 
                                ${inGame ? '(In Game: ' + u.tableId + ')' : ''}
                                ${isSeeking ? '(Seeking Game...)' : ''}
                            </div>
                        </div>
                        ${actionBtn}
                    </li>
                `;
            }).join('');
        }
    });

    lobbyInstance.onChallenge((challenge: ChallengeMessage) => {
        if (challenge.type === 'offer') {
            activeChallenge = challenge;
            showChallenge(challenge);
        } else if (challenge.type === 'accept') {
            joinGame(challenge.tableId!, challenge.challengerId);
        } else if (challenge.type === 'decline' || challenge.type === 'cancel') {
            if (activeChallenge?.challengerId === challenge.challengerId) {
                hideChallenge();
            }
            // Alert removed: console used for debug instead
            console.log(`Challenge ${challenge.type}ed by ${challenge.challengerName}`);
        }
    });
}

(globalThis as any).connect = async () => {
    try {
        await client.start();
        lobby = await client.joinLobby({
            messageType: "presence",
            type: "join",
            userId,
            userName
        });

        await initLobby(lobby);

        const myNameEl = document.getElementById('my-name');
        if (myNameEl) myNameEl.innerText = `Hello, ${userName} (${userId})`;

        updateConnectionUI(true);
    } catch (e) {
        console.error("Connection failed", e);
    }
};

(globalThis as any).disconnect = async () => {
    await client.stop();
    lobby = null;
    currentTable = null;
    updateConnectionUI(false);
    
    // Clear lists
    const list = document.getElementById('user-list');
    if (list) list.innerHTML = '';
    const myNameEl = document.getElementById('my-name');
    if (myNameEl) myNameEl.innerText = 'Disconnected';
};

function updateConnectionUI(online: boolean) {
    const statusEl = document.getElementById('conn-status');
    const btnConnect = document.getElementById('btn-connect');
    const btnDisconnect = document.getElementById('btn-disconnect');
    const btnFindGame = document.getElementById('btn-find-game') as HTMLButtonElement;

    if (statusEl) {
        statusEl.innerText = online ? 'ONLINE' : 'OFFLINE';
        statusEl.className = `connection-status ${online ? 'online' : 'offline'}`;
    }
    if (btnConnect) btnConnect.style.display = online ? 'none' : 'block';
    if (btnDisconnect) btnDisconnect.style.display = online ? 'block' : 'none';
    if (btnFindGame) btnFindGame.disabled = !online;
}

function showChallenge(challenge: ChallengeMessage) {
    const container = document.getElementById('challenge-container');
    const text = document.getElementById('challenge-text');
    if (container && text) {
        text.innerText = `${challenge.challengerName} has challenged you to a game!`;
        container.style.display = 'block';
    }
}

function hideChallenge() {
    const container = document.getElementById('challenge-container');
    if (container) container.style.display = 'none';
    activeChallenge = null;
}

async function joinGame(tableId: string, opponentId: string) {
    if (currentTable) {
        await currentTable.leave();
    }
    
    currentTable = await client.joinTable(tableId, userId);
    
    // Update lobby presence to show we are in a game
    if (lobby) {
        await lobby.updatePresence({ tableId, seek: undefined });
    }

    const container = document.getElementById('game-container');
    const text = document.getElementById('game-text');
    if (container && text) {
        text.innerText = `Playing on table: ${tableId} against ${opponentId}`;
        container.style.display = 'block';
    }

    currentTable.onMessage((msg) => {
        console.log('Game Message:', msg);
    });
}

(globalThis as any).findGame = async () => {
    if (!lobby) return;
    const tableId = getUID();
    await lobby.updatePresence({ seek: { tableId, ruleType: 'standard' } });
    const seekContainer = document.getElementById('seek-container');
    if (seekContainer) seekContainer.style.display = 'block';
};

(globalThis as any).cancelSeek = async () => {
    if (!lobby) return;
    await lobby.updatePresence({ seek: undefined });
    const seekContainer = document.getElementById('seek-container');
    if (seekContainer) seekContainer.style.display = 'none';
};

(globalThis as any).joinSeek = async (targetUserId: string, tableId: string) => {
    console.log('Joining seek from:', targetUserId, 'at table:', tableId);
    await joinGame(tableId, targetUserId);
};

(globalThis as any).challengeUser = async (targetUserId: string) => {
    if (!lobby) return;
    console.log('Challenging user:', targetUserId);
    await lobby.challenge(targetUserId, 'standard');
    // Alert removed
};

(globalThis as any).leaveGame = async () => {
    if (currentTable) {
        await currentTable.leave();
        currentTable = null;
        if (lobby) {
            await lobby.updatePresence({ tableId: undefined });
        }
        const container = document.getElementById('game-container');
        if (container) container.style.display = 'none';
    }
};

document.getElementById('btn-accept')?.addEventListener('click', async () => {
    if (activeChallenge && lobby) {
        // acceptChallenge now handles presence update internally
        const table = await lobby.acceptChallenge(
            activeChallenge.challengerId,
            activeChallenge.ruleType,
            activeChallenge.tableId!
        );
        currentTable = table;
        hideChallenge();
        
        const container = document.getElementById('game-container');
        const text = document.getElementById('game-text');
        if (container && text) {
            text.innerText = `Playing on table: ${activeChallenge.tableId} against ${activeChallenge.challengerName}`;
            container.style.display = 'block';
        }
    }
});

document.getElementById('btn-decline')?.addEventListener('click', async () => {
    if (activeChallenge && lobby) {
        await lobby.declineChallenge(activeChallenge.challengerId, activeChallenge.ruleType);
        hideChallenge();
    }
});

// Attach the update function to globalThis so the HTML button can find it
(globalThis as any).updateName = async () => {
    const input = document.getElementById('name-input') as HTMLInputElement;
    const newName = input?.value;
    if (newName && lobby) {
        await lobby.updatePresence({ userName: newName });
        const myNameEl = document.getElementById('my-name');
        if (myNameEl) myNameEl.innerText = `Hello, ${newName} (${userId})`;
    }
};

// Initial state
updateConnectionUI(false);
// Auto-connect for convenience in the workbench
(globalThis as any).connect();
