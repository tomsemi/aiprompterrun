import { DurableObject } from "cloudflare:workers";

interface Env {
  ROOM_DO: DurableObjectNamespace;
}

export class RoomDurableObject extends DurableObject {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }

  async fetch(request: Request) {
    // 检查 websocket 升级
    const upgradeHeader = request.headers.get("Upgrade");
    if (!upgradeHeader || upgradeHeader !== "websocket") {
      return new Response("Expected websocket", { status: 400 });
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
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #1a1a2e; color: white; padding: 20px; text-align: center; }
        .container { max-width: 400px; margin: 0 auto; }
        h1 { margin-bottom: 30px; font-size: 24px; }
        p { color: #a1a1aa; margin-bottom: 20px; }
        #setup { background: rgba(255,255,255,0.05); padding: 30px 20px; border-radius: 16px; margin-top: 50px; }
        input { padding: 15px; font-size: 24px; text-align: center; border-radius: 12px; border: 1px solid #3f3f46; background: #27272a; color: white; margin-bottom: 20px; width: 100%; letter-spacing: 5px; outline: none; transition: border 0.2s;}
        input:focus { border-color: #3b82f6; }
        button { padding: 15px 30px; font-size: 16px; border-radius: 12px; border: none; background: #3b82f6; color: white; cursor: pointer; width: 100%; font-weight: bold; }
        button:active { background: #2563eb; }
        .controls { display: none; margin-top: 20px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .btn { background: rgba(255,255,255,0.1); border: none; border-radius: 16px; padding: 18px 10px; color: white; font-size: 15px; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 8px;}
        .btn:active { background: rgba(255,255,255,0.2); transform: scale(0.98); }
        .btn.primary { background: #3b82f6; }
        .btn.primary:active { background: #2563eb; }
        .btn .icon { font-size: 24px; }
        .status-box { background: rgba(255,255,255,0.05); padding: 15px; border-radius: 12px; margin-bottom: 20px; }
        .statusText { color: #4ade80; font-weight: bold;}
    </style>
</head>
<body>
    <div class="container">
        <h1>📺 Teleprompter Cloud Remote</h1>
        
        <div id="setup">
            <p>Enter the 6-digit code shown on the prompter</p>
            <input type="tel" id="roomCode" maxlength="6" placeholder="e.g. 886622">
            <button onclick="connect()">Connect</button>
        </div>
        
        <div id="controls" class="controls">
            <div class="status-box">
                <div>Status: <span id="statusText" class="statusText">Connected</span></div>
                <div style="font-size: 13px; color: #a1a1aa; margin-top: 6px;" id="roomIdHint"></div>
            </div>
            
            <div class="grid">
                <button class="btn" onclick="sendCommand('scrollUp')">
                    <span class="icon">⏪</span><span>Rewind</span>
                </button>
                <button class="btn primary" onclick="sendCommand('play')" id="playBtn">
                    <span class="icon">▶️</span><span>Play</span>
                </button>
                <button class="btn" onclick="sendCommand('scrollDown')">
                    <span class="icon">⏩</span><span>Forward</span>
                </button>
                <button class="btn" onclick="sendCommand('speedDown')">
                    <span class="icon">🐢</span><span>Slower</span>
                </button>
                <button class="btn" onclick="sendCommand('speedUp')">
                    <span class="icon">🐇</span><span>Faster</span>
                </button>
                <button class="btn" onclick="sendCommand('fontDown')">
                    <span class="icon">A-</span><span>Smaller</span>
                </button>
                <button class="btn" onclick="sendCommand('fontUp')">
                    <span class="icon">A+</span><span>Larger</span>
                </button>
                <button class="btn" onclick="sendCommand('reset')" style="grid-column: span 2;">
                    <span class="icon">↩️</span><span>Reset to Beginning</span>
                </button>
            </div>
        </div>
    </div>
    
    <script>
        let ws;
        let isScrolling = false;
        
        window.onload = () => {
            const urlParams = new URLSearchParams(window.location.search);
            const roomUrl = urlParams.get('room');
            if (roomUrl && roomUrl.length === 6) {
                document.getElementById('roomCode').value = roomUrl;
                connect();
            }
        };

        function connect() {
            const code = document.getElementById('roomCode').value.trim();
            if (code.length < 1) return alert('Please enter a valid code');
            
            const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = wsProtocol + '//' + window.location.host + '/ws-room?room=' + code;
            
            ws = new WebSocket(wsUrl);
            
            ws.onopen = () => {
                document.getElementById('setup').style.display = 'none';
                document.getElementById('controls').style.display = 'block';
                document.getElementById('roomIdHint').innerText = 'Room Code: ' + code;
                document.getElementById('statusText').innerText = 'Connected';
                document.getElementById('statusText').style.color = '#4ade80';
            };
            
            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    if (msg.type === 'status' && msg.data) {
                        isScrolling = msg.data.isScrolling;
                        updatePlayButton();
                    }
                } catch(e) {}
            };
            
            ws.onclose = () => {
                document.getElementById('statusText').innerText = 'Disconnected';
                document.getElementById('statusText').style.color = '#f87171';
            };
        }
        
        function updatePlayButton() {
            const btn = document.getElementById('playBtn');
            if (isScrolling) {
                btn.innerHTML = '<span class="icon">⏸️</span><span>Pause</span>';
            } else {
                btn.innerHTML = '<span class="icon">▶️</span><span>Play</span>';
            }
        }
        
        function sendCommand(cmd) {
            if (!ws || ws.readyState !== WebSocket.OPEN) return;
            
            let action = cmd;
            if (cmd === 'play') {
                action = isScrolling ? 'pause' : 'play';
                isScrolling = !isScrolling; 
                updatePlayButton();
            }
            
            ws.send(JSON.stringify({ type: 'command', action: action }));
        }
    </script>
</body>
</html>
  `;
}
