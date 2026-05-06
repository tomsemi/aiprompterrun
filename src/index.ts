import { DurableObject } from "cloudflare:workers";

interface Env {
  ASSETS: Fetcher;
  ROOM_DO: DurableObjectNamespace;
}

export class RoomDurableObject extends DurableObject {
  hostDeviceId: string | null = null;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.hostDeviceId = null;
  }

  async fetch(request: Request) {
    // 检查 websocket 升级
    const upgradeHeader = request.headers.get("Upgrade");
    if (!upgradeHeader || upgradeHeader !== "websocket") {
      return new Response("Expected websocket", { status: 400 });
    }

    const url = new URL(request.url);
    const deviceId = url.searchParams.get("deviceId");

    if (deviceId) {
      if (this.hostDeviceId === null) {
        this.hostDeviceId = deviceId;
      } else if (this.hostDeviceId !== deviceId) {
        // Room taken by another device. Reject by accepting then closing immediately with policy violation.
        const { 0: client, 1: server } = new WebSocketPair();
        this.ctx.acceptWebSocket(server);
        server.close(1008, "Collision");
        return new Response(null, { status: 101, webSocket: client });
      }
    }

    const { 0: client, 1: server } = new WebSocketPair();

    // 接受 WebSocket (Hibernation API 允许更低的资源占用)
    this.ctx.acceptWebSocket(server);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    // 收到消息时，向此房间里的所有其他端广播
    const websockets = this.ctx.getWebSockets();
    for (const session of websockets) {
      if (session !== ws) {
        try {
          session.send(message);
        } catch (err) {
          // ignore error
        }
      }
    }
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean) {
    ws.close(code, reason);
  }

  async webSocketError(ws: WebSocket, error: unknown) {
    ws.close();
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const redirect = redirectWwwHost(url);

    if (redirect) {
      return Response.redirect(redirect, 301);
    }

    const remoteHost = isRemoteHost(url);

    if (!remoteHost) {
      return env.ASSETS.fetch(request);
    }

    // REST 或 WebSocket 的分发路由
    if (url.pathname === "/ws-room") {
      const roomId = url.searchParams.get("room") || url.searchParams.get("id");
      if (!roomId) {
        return new Response("Missing room id", { status: 400, headers: corsHeaders() });
      }

      const id = env.ROOM_DO.idFromName(roomId);
      const stub = env.ROOM_DO.get(id);

      return stub.fetch(request);
    }

    if (url.pathname === "/") {
      return new Response(generateControlPageHTML(), {
        headers: { "Content-Type": "text/html;charset=UTF-8", ...corsHeaders() },
      });
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    return new Response("Not found", { status: 404, headers: corsHeaders() });
  },
};

function isRemoteHost(url: URL) {
  return url.hostname === "remote.aiprompter.run" || url.hostname.startsWith("remote.");
}

function redirectWwwHost(url: URL) {
  if (url.hostname !== "www.aiprompter.run") {
    return null;
  }

  const target = new URL(url);
  target.hostname = "aiprompter.run";
  return target.toString();
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function generateControlPageHTML() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Teleprompter Cloud Remote</title>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
    <style>
        * {
            box-sizing: border-box;
        }

        html,
        body {
            margin: 0;
            min-height: 100vh;
            width: 100%;
            overflow: hidden;
            background-color: rgb(40, 54, 92);
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            touch-action: manipulation;
            overscroll-behavior: none;
            -webkit-text-size-adjust: 100%;
            -webkit-tap-highlight-color: transparent;
        }

        [hidden] {
            display: none !important;
        }

        button,
        input {
            font: inherit;
        }

        button {
            border: 0;
            outline: 0;
            cursor: pointer;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
        }

        #setup,
        #controls {
            min-height: 100vh;
            width: 100%;
        }

        #setup {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: max(24px, env(safe-area-inset-top)) max(24px, env(safe-area-inset-right)) max(24px, env(safe-area-inset-bottom)) max(24px, env(safe-area-inset-left));
        }

        .setup-inner {
            width: min(340px, 100%);
            text-align: center;
        }

        .setup-title {
            margin: 0 0 20px;
            font-size: 22px;
            font-weight: 700;
        }

        .setup-hint {
            margin: 0 0 16px;
            color: rgba(255, 255, 255, 0.72);
            font-size: 14px;
            line-height: 1.4;
        }

        #roomCode {
            width: 100%;
            height: 56px;
            margin: 0 0 14px;
            border: 1px solid rgba(255, 255, 255, 0.22);
            border-radius: 16px;
            background: rgba(0, 0, 0, 0.18);
            color: white;
            font-size: 24px;
            font-weight: 700;
            letter-spacing: 5px;
            text-align: center;
            text-transform: uppercase;
            outline: none;
        }

        #roomCode:focus {
            border-color: rgb(91, 145, 245);
        }

        #connectButton {
            width: 100%;
            height: 54px;
            border-radius: 16px;
            background-color: rgb(91, 145, 245);
            color: white;
            font-size: 17px;
            font-weight: 700;
        }

        #connectButton:active {
            background-color: rgb(75, 115, 199);
        }

        #setupStatus {
            min-height: 20px;
            margin-top: 12px;
            color: rgba(255, 255, 255, 0.68);
            font-size: 13px;
        }

        #controls {
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: max(82px, calc(env(safe-area-inset-top) + 64px)) 12px max(24px, env(safe-area-inset-bottom));
        }

        .room-header {
            position: fixed;
            top: max(14px, env(safe-area-inset-top));
            left: max(16px, env(safe-area-inset-left));
            right: max(16px, env(safe-area-inset-right));
            text-align: center;
            pointer-events: none;
        }

        #roomLabel {
            font-size: 15px;
            font-weight: 700;
            letter-spacing: 0.5px;
        }

        #statusText {
            margin-top: 4px;
            color: rgba(255, 255, 255, 0.66);
            font-size: 12px;
            font-weight: 600;
        }

        .button-row {
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .btn {
            width: 80px;
            height: 80px;
            margin: 10px;
            padding: 0;
            border-radius: 20px;
            background-color: rgb(91, 145, 245);
            color: white;
            box-shadow: none;
            transition: background-color 0.16s ease, transform 0.16s ease;
        }

        .btn:active {
            background-color: rgb(75, 115, 199);
            transform: scale(0.98);
        }

        .btn .glyph {
            display: block;
            font-size: 31px;
            font-weight: 700;
            line-height: 1;
        }

        .btn .glyph-small {
            font-size: 27px;
        }

        #floatButton {
            position: fixed;
            right: max(18px, env(safe-area-inset-right));
            bottom: max(18px, env(safe-area-inset-bottom));
            width: 96px;
            height: 58px;
            margin: 0;
            border-radius: 29px;
            box-shadow: 0 10px 24px rgba(0, 0, 0, 0.22);
            font-size: 15px;
            font-weight: 700;
        }

        #floatPanelToggle {
            position: fixed;
            right: max(124px, calc(env(safe-area-inset-right) + 124px));
            bottom: max(18px, env(safe-area-inset-bottom));
            width: 46px;
            height: 58px;
            margin: 0;
            border-radius: 23px;
            box-shadow: 0 10px 24px rgba(0, 0, 0, 0.18);
        }

        #floatPanel {
            position: fixed;
            right: max(18px, env(safe-area-inset-right));
            bottom: calc(max(18px, env(safe-area-inset-bottom)) + 72px);
            width: min(280px, calc(100vw - 36px));
            border-radius: 18px;
            overflow: hidden;
            background-color: rgba(255, 255, 255, 0.96);
            box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
            color: rgb(40, 54, 92);
            display: none;
        }

        #floatPanel.visible {
            display: block;
        }

        .float-panel-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 12px;
            font-size: 13px;
            font-weight: 700;
            border-bottom: 1px solid rgba(40, 54, 92, 0.12);
        }

        #refreshNotesButton {
            width: 34px;
            height: 34px;
            border-radius: 17px;
            background-color: rgba(91, 145, 245, 0.12);
            color: rgb(91, 145, 245);
            font-size: 20px;
            line-height: 1;
        }

        .note-item {
            width: 100%;
            padding: 11px 12px;
            border-bottom: 1px solid rgba(40, 54, 92, 0.08);
            background: transparent;
            color: rgb(40, 54, 92);
            text-align: left;
        }

        .note-item:active {
            background-color: rgba(91, 145, 245, 0.12);
        }

        .note-item:last-child {
            border-bottom: 0;
        }

        .note-title-row {
            display: flex;
            align-items: center;
            gap: 6px;
            min-width: 0;
        }

        .note-title {
            flex: 1;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-size: 14px;
            font-weight: 700;
        }

        .note-pin {
            flex: 0 0 auto;
            color: rgb(255, 159, 67);
            font-size: 12px;
        }

        .note-summary {
            margin-top: 4px;
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 2;
            overflow: hidden;
            color: rgba(40, 54, 92, 0.68);
            font-size: 12px;
            line-height: 1.35;
        }

        .note-empty {
            padding: 14px 12px;
            color: rgba(40, 54, 92, 0.62);
            font-size: 13px;
        }
    </style>
</head>
<body>
    <form id="setup" autocomplete="off">
        <div class="setup-inner">
            <h1 class="setup-title">Teleprompter Remote</h1>
            <p class="setup-hint">Enter the room code shown on the prompter.</p>
            <input type="text" id="roomCode" maxlength="6" autocapitalize="characters" autocomplete="off" placeholder="A8X9P2">
            <button id="connectButton" type="submit">Connect</button>
            <div id="setupStatus"></div>
        </div>
    </form>

    <main id="controls" hidden>
        <div class="room-header">
            <div id="roomLabel"></div>
            <div id="statusText">Connected</div>
        </div>

        <div class="button-row">
            <button class="btn" id="resetButton" type="button" aria-label="Reset">
                <span class="glyph">&#8635;</span>
            </button>
            <button class="btn" id="scaleButton" type="button" aria-label="Scale">
                <span class="glyph">&#9974;</span>
            </button>
        </div>

        <div class="button-row">
            <button class="btn" id="backButton" type="button" aria-label="Back">
                <span class="glyph glyph-small">&#9664;&#9664;</span>
            </button>
            <button class="btn" id="pauseButton" type="button" aria-label="Play or pause">
                <span class="glyph">&#9654;</span>
            </button>
            <button class="btn" id="forwardButton" type="button" aria-label="Forward">
                <span class="glyph glyph-small">&#9654;&#9654;</span>
            </button>
        </div>

        <button class="btn" id="floatButton" type="button">
            <span>Float</span>
        </button>

        <button class="btn" id="floatPanelToggle" type="button" aria-label="Scripts">
            <span class="glyph glyph-small">&#9776;</span>
        </button>

        <div id="floatPanel">
            <div class="float-panel-header">
                <span>Scripts</span>
                <button id="refreshNotesButton" type="button" aria-label="Refresh scripts">&#8635;</button>
            </div>
            <div id="noteList">
                <div class="note-empty">Loading...</div>
            </div>
        </div>
    </main>
    
    <script>
        let ws;
        let currentRoomCode = '';
        let reconnectAttempt = 0;
        let isIntentionallyClosed = false;
        let remoteNotes = [];
        let notesRequestToken = 0;
        
        window.onload = () => {
            const urlParams = new URLSearchParams(window.location.search);
            const roomUrl = urlParams.get('room');
            if (roomUrl && roomUrl.length === 6) {
                document.getElementById('roomCode').value = roomUrl;
                connect();
            }

            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') {
                    if (currentRoomCode && (!ws || ws.readyState !== WebSocket.OPEN)) {
                        connect();
                    }
                }
            });

            document.addEventListener('dblclick', event => {
                event.preventDefault();
            }, { passive: false });

            ['gesturestart', 'gesturechange', 'gestureend'].forEach(eventName => {
                document.addEventListener(eventName, event => {
                    event.preventDefault();
                }, { passive: false });
            });

            document.getElementById('setup').addEventListener('submit', event => {
                event.preventDefault();
                connect();
            });

            bindButton('forwardButton', () => sendCommand('forward'));
            bindButton('backButton', () => sendCommand('back'));
            bindButton('pauseButton', () => sendCommand('playpause'));
            bindButton('resetButton', () => sendCommand('reset'));
            bindButton('scaleButton', () => sendCommand('scale'));
            bindButton('floatButton', () => floatNote(remoteNotes[0]));
            bindButton('refreshNotesButton', requestNotes);
            bindButton('floatPanelToggle', () => {
                const panel = document.getElementById('floatPanel');
                panel.classList.toggle('visible');
                if (panel.classList.contains('visible')) {
                    requestNotes();
                }
            });
        };

        function bindButton(id, handler) {
            const el = document.getElementById(id);
            if (el) el.addEventListener('click', handler);
        }

        function setSetupStatus(text) {
            document.getElementById('setupStatus').innerText = text || '';
        }

        function setControlStatus(text) {
            document.getElementById('statusText').innerText = text || '';
        }

        function connect() {
            const codeInput = document.getElementById('roomCode');
            const code = codeInput.value.trim().toUpperCase();
            if (code.length < 1) {
                setSetupStatus('Enter a valid room code.');
                return;
            }
            
            currentRoomCode = code;
            isIntentionallyClosed = false;
            document.getElementById('roomLabel').innerText = 'Room ' + code;
            setSetupStatus('Connecting...');
            setControlStatus('Connecting...');
            
            const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = wsProtocol + '//' + window.location.host + '/ws-room?room=' + code;
            
            if (ws) {
                ws.onclose = null;
                ws.close();
            }
            
            ws = new WebSocket(wsUrl);
            
            ws.onopen = () => {
                reconnectAttempt = 0;
                document.getElementById('setup').hidden = true;
                document.getElementById('controls').hidden = false;
                setSetupStatus('');
                setControlStatus('Connected');
                requestNotes();
            };
            
            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    if (msg.type === 'notesResponse') {
                        remoteNotes = Array.isArray(msg.notes) ? msg.notes : [];
                        renderNotes(remoteNotes);
                        return;
                    }

                    if (msg.type === 'status' && msg.data) {
                        setControlStatus(msg.data.isConnected === false ? 'Disconnected' : 'Connected');
                    }
                } catch(e) {}
            };
            
            ws.onclose = (e) => {
                if (isIntentionallyClosed) return;
                
                setSetupStatus('Disconnected. Reconnecting...');
                setControlStatus('Disconnected. Reconnecting...');
                
                let delay = Math.min(Math.pow(1.5, reconnectAttempt) * 1000, 10000);
                reconnectAttempt++;
                
                setTimeout(() => {
                    if (!isIntentionallyClosed && (!ws || ws.readyState !== WebSocket.OPEN)) {
                        connect();
                    }
                }, delay);
            };

            ws.onerror = (err) => {
                console.error('WebSocket Error:', err);
            };
        }

        function sendPayload(payload) {
            if (!ws || ws.readyState !== WebSocket.OPEN) {
                setControlStatus('Reconnecting...');
                if (currentRoomCode) connect();
                return false;
            }
            
            ws.send(JSON.stringify(payload));
            return true;
        }

        function sendCommand(action, params) {
            const payload = { type: 'command', action: action };
            if (params) {
                Object.keys(params).forEach(key => {
                    payload[key] = params[key];
                });
            }
            sendPayload(payload);
        }

        function requestNotes() {
            const token = ++notesRequestToken;
            renderNotes(null);
            if (!sendPayload({ type: 'notesRequest' })) return;

            setTimeout(() => {
                if (token === notesRequestToken) {
                    renderNotes(remoteNotes);
                }
            }, 4000);
        }

        function floatNote(note) {
            if (note && note.id !== undefined && note.id !== null) {
                sendCommand('floatNote', { noteID: note.id });
                return;
            }
            sendCommand('floatDefault');
        }

        function escapeText(value) {
            return String(value || '').replace(/[&<>"']/g, character => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            })[character]);
        }

        function renderNotes(notes) {
            const list = document.getElementById('noteList');
            if (!list) return;

            if (notes === null) {
                list.innerHTML = '<div class="note-empty">Loading...</div>';
                return;
            }

            if (!notes || notes.length === 0) {
                list.innerHTML = '<div class="note-empty">No scripts</div>';
                return;
            }

            list.innerHTML = notes.map(note => {
                const pin = note.pinned ? '<span class="note-pin">&#9679;</span>' : '';
                const title = escapeText(note.title || 'Untitled');
                const summary = escapeText(note.summary || '');
                return '<button class="note-item" type="button" data-id="' + escapeText(note.id) + '">' +
                    '<div class="note-title-row">' + pin + '<span class="note-title">' + title + '</span></div>' +
                    '<div class="note-summary">' + summary + '</div>' +
                    '</button>';
            }).join('');

            Array.prototype.forEach.call(list.querySelectorAll('.note-item'), item => {
                item.addEventListener('click', function () {
                    const noteID = this.getAttribute('data-id');
                    const note = remoteNotes.find(candidate => String(candidate.id) === String(noteID));
                    floatNote(note);
                });
            });
        }
    </script>
</body>
</html>
  `;
}
