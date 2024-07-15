# WebSocket-based Robot Control System

## Project Overview

This project implements a WebSocket-based robot control system with a React frontend. Key features include:

- WebSocket server for real-time communication
- React frontend for user interface
- Gamepad support for intuitive control
- Gradual stop functionality for safety

## Setup Instructions

1. Clone the repository:
   ```
   git clone https://github.com/jhacksman/trashley.git
   ```
2. Navigate to the project directory:
   ```
   cd trashley
   ```
3. Install dependencies:
   ```
   npm install
   ```

## Running the Application

1. Start the WebSocket server:
   ```
   cd server && node index.js
   ```
2. Start the frontend development server:
   ```
   cd frontend && npm start
   ```

## Usage

- Use the sliders in the user interface to control the robot's movement
- Connect a gamepad for more intuitive control
- Keyboard controls are also available for basic movement
- The gradual stop feature ensures safe deceleration when stopping the robot

## Deployment

- The frontend is deployed on Netlify: http://sprightly-zabaione-bdd92a.netlify.app
- To deploy the WebSocket server:
  1. Set up a server with Node.js installed
  2. Copy the server files to the deployment environment
  3. Install dependencies and start the server using `node index.js`

## Development

- The project is hosted on GitHub: https://github.com/jhacksman/trashley
- To contribute, fork the repository and create a pull request
- The main branch contains stable code, while feature branches are used for development

For more detailed information about the project structure and implementation, please refer to the source code and comments within the repository.