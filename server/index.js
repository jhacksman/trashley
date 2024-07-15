const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../frontend/build')));

let lastMessageTime = Date.now();
let isConnected = false;
let currentLeftPower = 0;
let currentRightPower = 0;
const disconnectThreshold = 1000; // 1 second

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('Client connected');
  isConnected = true;
  let gradualStopInterval;

  // Function to gradually reduce power
  function gradualStop() {
    const decayFactor = 0.8; // Adjust for desired decay rate
    currentLeftPower *= decayFactor;
    currentRightPower *= decayFactor;

    if (Math.abs(currentLeftPower) < 0.1 && Math.abs(currentRightPower) < 0.1) {
      currentLeftPower = 0;
      currentRightPower = 0;
      clearInterval(gradualStopInterval);
    }

    broadcastControlData(currentLeftPower, currentRightPower);
  }

  // Interval to check for disconnections or lag
  const connectionCheckInterval = setInterval(() => {
    if (!isConnected || Date.now() - lastMessageTime > disconnectThreshold) {
      clearInterval(connectionCheckInterval);
      gradualStopInterval = setInterval(gradualStop, 100); // 10 updates per second
    }
  }, 100);

  ws.on('message', (message) => {
    console.log('Received message:', message.toString()); // Add this line to log incoming messages
    try {
      const data = JSON.parse(message);
      if (data.type === 'control') {
        lastMessageTime = Date.now();
        currentLeftPower = data.leftPower;
        currentRightPower = data.rightPower;
        broadcastControlData(currentLeftPower, currentRightPower);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    isConnected = false;
  });
});

// Function to broadcast control data
function broadcastControlData(leftPower, rightPower) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'control',
        leftPower: leftPower,
        rightPower: rightPower
      }));
    }
  });
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});