import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { jwtDecode } from "jwt-decode";

const socket = io("http://localhost:5000");

function App() {
  const [room, setRoom] = useState("");
  const [joinedRoom, setJoinedRoom] = useState("");
  const [message, setMessage] = useState("");
  const [username, setUsername] = useState("");
  const [messages, setMessages] = useState([]);

  const [rooms, setRooms] = useState([]);
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/";
    } else {
      const decoded = jwtDecode(token);
      setUsername(decoded.name);
    }

    // ✅ ADD THIS BLOCK
    fetch("http://localhost:5000/api/rooms")
      .then((res) => res.json())
      .then((data) => setRooms(data))
      .catch((err) => console.error("Error fetching rooms:", err));

    socket.on("loadMessages", (data) => {
      setMessages(data);
    });

    socket.on("receiveMessage", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socket.off("loadMessages");
      socket.off("receiveMessage");
    };
  }, []);

  const joinRoom = () => {
    if (room !== "") {
      socket.emit("joinRoom", room);
      setJoinedRoom(room);
    }
  };

  const sendMessage = () => {
    if (message !== "" && joinedRoom !== "") {
      const messageData = {
        roomId: joinedRoom,
        message,
        sender: username,
      };

      socket.emit("sendMessage", messageData);
      setMessages((prev) => [...prev, messageData]);
      setMessage("");
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "Arial" }}>
      {/* Sidebar */}
      <div
        style={{
          width: "200px",
          background: "#1e1e2f",
          color: "white",
          padding: "20px",
        }}
      >
        <h3>Rooms</h3>
        {rooms.length === 0 && (
          <p style={{ fontSize: "14px" }}>No rooms yet. Create one!</p>
        )}
        <input
          type="text"
          placeholder="New room name"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          style={{ width: "100%", marginBottom: "10px" }}
        />

        <button
          onClick={async () => {
            if (!room) return;

            const res = await fetch("http://localhost:5000/api/rooms", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: room }),
            });

            const data = await res.json();

            if (res.ok && data._id) {
              setRooms((prev) => [...prev, data]);
              setRoom("");
            } else {
              alert(data.message || "Error creating room");
            }
          }}
        >
          Create Room
        </button>
        {rooms.map((r) => (
          <div
            key={r._id}
            onClick={() => {
              socket.emit("joinRoom", r.name);
              setJoinedRoom(r.name);
              setMessages([]);
            }}
            style={{
              padding: "10px",
              margin: "5px 0",
              cursor: "pointer",
              background: joinedRoom === r.name ? "#444" : "transparent",
            }}
          >
            <div>{r.name}</div>

            {r.createdAt && (
              <small style={{ fontSize: "11px", color: "#aaa" }}>
                Created: {new Date(r.createdAt).toLocaleString()}
              </small>
            )}
          </div>
        ))}

        <button
          onClick={() => {
            localStorage.removeItem("token");
            window.location.href = "/";
          }}
          style={{ marginTop: "20px" }}
        >
          Logout
        </button>
      </div>

      {/* Chat area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div
          style={{
            background: "#f4f4f4",
            padding: "10px",
            borderBottom: "1px solid #ccc",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <h3>Room: {joinedRoom || "Select a room"}</h3>

            {joinedRoom && (
              <button
                onClick={() => {
                  socket.emit("leaveRoom", joinedRoom);
                  setJoinedRoom("");
                  setMessages([]);
                }}
              >
                Leave Room
              </button>
            )}
          </div>
        </div>

        <div
          style={{
            flex: 1,
            padding: "20px",
            overflowY: "scroll",
            background: "#fafafa",
          }}
        >
          {messages.map((msg, index) => (
            <div
              key={msg._id || index}
              style={{
                marginBottom: "10px",
                padding: "10px",
                background: "#e0e0ff",
                borderRadius: "8px",
                maxWidth: "60%",
              }}
            >
              <strong>{msg.sender}:</strong> {msg.message}
            </div>
          ))}
        </div>

        {joinedRoom && (
          <div
            style={{
              display: "flex",
              padding: "10px",
              borderTop: "1px solid #ccc",
            }}
          >
            <input
              type="text"
              placeholder="Type a message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{ flex: 1, padding: "10px" }}
            />
            <button onClick={sendMessage} style={{ marginLeft: "10px" }}>
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;