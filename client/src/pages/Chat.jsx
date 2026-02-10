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

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/";
    } else {
      const decoded = jwtDecode(token); 
      setUsername(decoded.name);
    }

    socket.on("receiveMessage", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
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
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h2>SyncSpace Chat</h2>

      {!joinedRoom ? (
        <div>
          <input
            type="text"
            placeholder="Enter room name"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
          />
          <button onClick={joinRoom}>Join Room</button>
        </div>
      ) : (
        <div>
          <h3>Room: {joinedRoom}</h3>

          <div
            style={{
              border: "1px solid #ccc",
              height: 300,
              overflowY: "scroll",
              padding: 10,
              marginBottom: 10,
            }}
          >
            {messages.map((msg, index) => (
              <div key={index}>
                <strong>{msg.sender}:</strong> {msg.message}
              </div>
            ))}
          </div>

          <input
            type="text"
            placeholder="Type a message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      )}
    </div>
  );
}

export default App;