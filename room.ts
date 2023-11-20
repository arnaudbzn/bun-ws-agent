const server = Bun.serve<{ username: string }>({
  async fetch(req, server) {
    const url = new URL(req.url);
    if (url.pathname === "/ws") {
      // TODO: send http header from the frontend
      const username = req.headers.get("x-username") ?? "anonymous";
      console.log("upgrade!", { username });
      const success = server.upgrade(req, { data: { username } });
      return success
        ? undefined
        : new Response("WebSocket upgrade error", { status: 400 });
    }

    return new Response(Bun.file("./index.html"));
  },
  websocket: {
    open(ws) {
      console.log("open", { username: ws.data.username });
      ws.subscribe("room");
      // When auth is implemented, we can send a message to the room
      // const msg = `${ws.data.username} has entered the chat`;
      // server.publish("room", JSON.stringify({ from: "system", content: msg }));
    },
    message(ws, message) {
      console.log("message", { username: ws.data.username, message });
      // this is a group chat
      // so the server re-broadcasts incoming message to everyone
      server.publish("room", message);
    },
    close(ws) {
      console.log("close", { username: ws.data.username });
      ws.unsubscribe("room");
      // When auth is implemented, we can send a message to the room
      // const msg = `${ws.data.username} has left the chat`;
      // server.publish("room", JSON.stringify({ from: "system", content: msg }));
    },
  },
  port: 8000,
});

console.log(`Listening on http://${server.hostname}:${server.port}`);
