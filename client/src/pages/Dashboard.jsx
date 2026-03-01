import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

function Dashboard() {
  const [rooms, setRooms] = useState([]);
  const [joinedRooms, setJoinedRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);

  const [search, setSearch] = useState("");
  const [roomName, setRoomName] = useState("");
  const [roomType, setRoomType] = useState("public");
  const [roomPassword, setRoomPassword] = useState("");

  // ================= FETCH ROOMS =================
  useEffect(() => {
    fetch("http://localhost:5000/api/rooms")
      .then((res) => res.json())
      .then((data) => setRooms(data))
      .catch((err) => console.error(err));
  }, []);

  // ================= CREATE ROOM =================
  const createRoom = async () => {
    if (!roomName.trim()) return;

    const res = await fetch("http://localhost:5000/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: roomName,
        type: roomType,
        password: roomType === "private" ? roomPassword : undefined,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      setRooms((prev) => [data, ...prev]);
      setRoomName("");
      setRoomPassword("");
    } else {
      alert(data.message);
    }
  };

  // ================= JOIN ROOM =================
  const joinRoom = async (room) => {
    if (room.type === "private") {
      const password = prompt("Enter room password:");
      if (!password) return;

      const res = await fetch("http://localhost:5000/api/rooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: room._id, password }),
      });

      const data = await res.json();
      if (!res.ok) return alert(data.message);
    }

    socket.emit("joinRoom", room._id);

    if (!joinedRooms.some((r) => r._id === room._id)) {
      setJoinedRooms((prev) => [...prev, room]);
    }

    setActiveRoom(room._id);
  };

  // ================= LEAVE ROOM =================
  const leaveRoom = (roomId) => {
    socket.emit("leaveRoom", roomId);

    setJoinedRooms((prev) =>
      prev.filter((room) => room._id !== roomId)
    );

    if (activeRoom === roomId) {
      setActiveRoom(null);
    }
  };

  // ================= FILTER LOGIC =================
  const filteredRooms = rooms.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  const availableRooms = filteredRooms.filter(
    (r) => !joinedRooms.some((jr) => jr._id === r._id)
  );

  return (
    <div className="flex h-screen p-6 gap-6">

      {/* LEFT PANEL */}
      <div className="w-1/3 border-r pr-6 space-y-6">

        <h1 className="text-2xl font-bold">Rooms</h1>

        {/* SEARCH */}
        <input
          className="border p-2 w-full rounded"
          placeholder="Search rooms..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* CREATE ROOM */}
        <div className="space-y-2">

          <h1 className="text-2xl font-bold">Create Rooms</h1>
          <input
            className="border p-2 w-full rounded"
            placeholder="Room name"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
          />

          <select
            className="border p-2 w-full rounded"
            value={roomType}
            onChange={(e) => setRoomType(e.target.value)}
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>

          {roomType === "private" && (
            <input
              className="border p-2 w-full rounded"
              type="password"
              placeholder="Room password"
              value={roomPassword}
              onChange={(e) => setRoomPassword(e.target.value)}
            />
          )}

          <button
            onClick={createRoom}
            className="bg-blue-600 text-white w-full py-2 rounded hover:bg-blue-700"
          >
            Create Room
          </button>
        </div>

        {/* MY ROOMS */}
        <div>
          <h2 className="font-semibold mb-2">My Rooms</h2>

          {joinedRooms.length === 0 && (
            <p className="text-sm text-gray-500">No joined rooms</p>
          )}

          {joinedRooms.map((room) => (
            <div
              key={room._id}
              className={`p-3 border rounded mb-2 flex justify-between items-center cursor-pointer ${activeRoom === room._id ? "bg-blue-100" : ""
                }`}
            >
              <div onClick={() => setActiveRoom(room._id)}>
                <div className="font-medium">{room.name}</div>
                <div className="text-xs text-gray-500">
                  {room.type === "public" ? "🔓 Public" : "🔒 Private"}
                </div>
              </div>

              <button
                onClick={() => leaveRoom(room._id)}
                className="bg-red-500 text-white px-2 py-1 rounded text-sm"
              >
                Leave
              </button>
            </div>
          ))}
        </div>

        {/* AVAILABLE ROOMS (Public + Private) */}
        <div>
          <h2 className="font-semibold mb-2">Available Rooms</h2>

          {availableRooms.length === 0 && (
            <p className="text-sm text-gray-500">No rooms available</p>
          )}

          {availableRooms.map((room) => (
            <div
              key={room._id}
              className="p-3 border rounded mb-2 flex justify-between items-center"
            >
              <div>
                <div className="font-medium">{room.name}</div>
                <div className="text-xs text-gray-500">
                  {room.type === "public" ? "Public" : "Private"}
                </div>
              </div>

              <button
                onClick={() => joinRoom(room)}
                className="bg-green-600 text-white px-3 py-1 rounded"
              >
                Join
              </button>
            </div>
          ))}
        </div>

      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1">
        {activeRoom ? (
          <h2 className="text-xl font-semibold">
            Active Room:{" "}
            {joinedRooms.find((r) => r._id === activeRoom)?.name}
          </h2>
        ) : (
          <h2 className="text-gray-500">Select a room</h2>
        )}
      </div>

    </div>
  );
}

export default Dashboard;