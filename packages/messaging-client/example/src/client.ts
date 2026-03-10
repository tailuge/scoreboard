import { MessagingClient, PresenceMessage, Lobby, ChallengeMessage } from "../../src/index";
import { Table } from "../../src/table";
import { getUID } from "../../src/utils/uid";

const params = new URLSearchParams(window.location.search);
const userId = params.get('id') || 'user-' + Math.random().toString(36).substr(2, 5);
const userName = params.get('name') || 'User';

// Initialize the client on port 80 (default for hostname)
const client = new MessagingClient({
    baseUrl: window.location.hostname
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

(window as any).connect = async () => {
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

(window as any).disconnect = async () => {
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

(window as any).findGame = async () => {
    if (!lobby) return;
    const tableId = getUID();
    await lobby.updatePresence({ seek: { tableId, ruleType: 'standard' } });
    document.getElementById('seek-container')!.style.display = 'block';
};

(window as any).cancelSeek = async () => {
    if (!lobby) return;
    await lobby.updatePresence({ seek: undefined });
    document.getElementById('seek-container')!.style.display = 'none';
};

(window as any).joinSeek = async (targetUserId: string, tableId: string) => {
    console.log('Joining seek from:', targetUserId, 'at table:', tableId);
    await joinGame(tableId, targetUserId);
};

(window as any).challengeUser = async (targetUserId: string) => {
    if (!lobby) return;
    console.log('Challenging user:', targetUserId);
    await lobby.challenge(targetUserId, 'standard');
    // Alert removed
};

(window as any).leaveGame = async () => {
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

// Attach the update function to the window so the HTML button can find it
(window as any).updateName = async () => {
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
(window as any).connect();
