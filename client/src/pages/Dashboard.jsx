import { useState } from "react";

function Dashboard() {
  const [rooms] = useState(["General", "Tech", "Random"]);
  const [selectedRoom, setSelectedRoom] = useState(null);

  return (
    <div className="flex h-screen">

      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white p-4">
        <h2 className="text-xl font-bold mb-4">SyncSpace</h2>

        <div>
          <h3 className="text-sm text-gray-400 mb-2">Rooms</h3>

          {rooms.map((room, index) => (
            <div
              key={index}
              onClick={() => setSelectedRoom(room)}
              className={`p-2 rounded cursor-pointer mb-2 ${
                selectedRoom === room
                  ? "bg-gray-700"
                  : "hover:bg-gray-800"
              }`}
            >
              {room}
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">

        {/* Header */}
        <div className="bg-gray-100 p-4 border-b">
          <h2 className="text-lg font-semibold">
            {selectedRoom ? selectedRoom : "Select a room"}
          </h2>
        </div>

        {/* Messages */}
        <div className="flex-1 p-6 overflow-y-auto">
          {selectedRoom ? (
            <p className="text-gray-500">
              Chat area for {selectedRoom}
            </p>
          ) : (
            <p className="text-gray-400">
              Choose a room to start chatting
            </p>
          )}
        </div>

        {/* Message Input */}
        {selectedRoom && (
          <div className="p-4 border-t flex gap-2">
            <input
              type="text"
              placeholder="Type a message..."
              className="flex-1 border p-2 rounded"
            />
            <button className="bg-blue-600 text-white px-4 rounded">
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;