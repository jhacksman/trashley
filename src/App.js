import React, { useState, useEffect, useCallback } from 'react';
import { ChakraProvider, Box, VStack, HStack, Slider, SliderTrack, SliderThumb, Text, Button } from '@chakra-ui/react';
import useWebSocket, { ReadyState } from 'react-use-websocket';

const DEAD_ZONE = 0.1;

function App() {
  const [leftPower, setLeftPower] = useState(0);
  const [rightPower, setRightPower] = useState(0);
  const [isGamepadConnected, setIsGamepadConnected] = useState(false);
  const [controlMethod, setControlMethod] = useState('sliders');
  const [isConnected, setIsConnected] = useState(false);

  const { sendMessage, lastMessage, readyState } = useWebSocket('ws://localhost:3001', {
    onOpen: () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    },
    onClose: () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    },
    reconnectAttempts: 10,
    reconnectInterval: (attemptNumber) => Math.min(1000 * 2 ** attemptNumber, 30000),
    shouldReconnect: (closeEvent) => true,
  });

  useEffect(() => {
    console.log('WebSocket connection status:', readyState);
  }, [readyState]);

  const sendControlMessage = useCallback(() => {
    console.log('sendControlMessage function called');
    console.log(`Current power values - leftPower: ${leftPower}, rightPower: ${rightPower}`);
    if (readyState === ReadyState.OPEN) {
      console.log(`Current state values - leftPower: ${leftPower}, rightPower: ${rightPower}`);
      const message = JSON.stringify({ type: 'control', leftPower, rightPower });
      console.log('Sending WebSocket message:', message);
      sendMessage(message);
    } else {
      console.log('WebSocket not ready, current state:', readyState);
      // Implement logic to queue message or attempt reconnection
      if (readyState === ReadyState.CLOSED) {
        console.log('WebSocket closed, attempting to reconnect...');
        // The useWebSocket hook will automatically attempt to reconnect
      }
    }
  }, [readyState, sendMessage, leftPower, rightPower]);

  const handleSliderChange = (value, side) => {
    console.log(`Slider changed: ${side} = ${value}, type: ${typeof value}`);
    if (side === 'left') {
      setLeftPower(prevPower => {
        console.log(`Updating left power from ${prevPower} to ${value}`);
        return value;
      });
    } else {
      setRightPower(prevPower => {
        console.log(`Updating right power from ${prevPower} to ${value}`);
        return value;
      });
    }
    setControlMethod('sliders');
    console.log(`Control method set to sliders, leftPower: ${leftPower}, rightPower: ${rightPower}`);
  };

  const handleGamepadConnect = (event) => {
    setIsGamepadConnected(true);
    setControlMethod('gamepad');
    console.log('Gamepad connected:', event.gamepad);
  };

  const handleGamepadDisconnect = (event) => {
    setIsGamepadConnected(false);
    setLeftPower(0);
    setRightPower(0);
    setControlMethod('sliders');
    sendControlMessage();
    console.log('Gamepad disconnected:', event.gamepad);
  };

  const applyDeadZone = (value) => {
    return Math.abs(value) < DEAD_ZONE ? 0 : value;
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      console.log('Key pressed:', event.key);
      let newLeftPower = leftPower;
      let newRightPower = rightPower;
      switch(event.key.toLowerCase()) {
        case 'f':
          newLeftPower = Math.min(leftPower + 0.1, 1);
          console.log('Increasing left power');
          break;
        case 'v':
          newLeftPower = Math.max(leftPower - 0.1, -1);
          console.log('Decreasing left power');
          break;
        case 'j':
          newRightPower = Math.min(rightPower + 0.1, 1);
          console.log('Increasing right power');
          break;
        case 'n':
          newRightPower = Math.max(rightPower - 0.1, -1);
          console.log('Decreasing right power');
          break;
        default:
          return;
      }
      console.log('New power values:', { left: newLeftPower, right: newRightPower });
      setLeftPower(newLeftPower);
      setRightPower(newRightPower);
      setControlMethod('keyboard');
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('gamepadconnected', handleGamepadConnect);
    window.addEventListener('gamepaddisconnected', handleGamepadDisconnect);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('gamepadconnected', handleGamepadConnect);
      window.removeEventListener('gamepaddisconnected', handleGamepadDisconnect);
    };
  }, [leftPower, rightPower]);

  useEffect(() => {
    console.log('Power values changed, triggering sendControlMessage');
    sendControlMessage();
  }, [leftPower, rightPower, sendControlMessage]);

  useEffect(() => {
    console.log(`Power values updated - leftPower: ${leftPower}, rightPower: ${rightPower}`);
  }, [leftPower, rightPower]);

  // Temporarily disabled gamepad-related useEffect hook for debugging
  /*
  useEffect(() => {
    let animationFrameId;

    const handleGamepad = () => {
      if (isGamepadConnected) {
        const gamepads = navigator.getGamepads();
        if (gamepads[0]) {
          const gamepad = gamepads[0];
          const newLeftPower = applyDeadZone(-gamepad.axes[1]);
          const newRightPower = applyDeadZone(-gamepad.axes[3]);

          if (newLeftPower !== leftPower || newRightPower !== rightPower) {
            setLeftPower(newLeftPower);
            setRightPower(newRightPower);
            setControlMethod('gamepad');
            // Remove direct call to sendControlMessage here
          }
        }
      }
      animationFrameId = requestAnimationFrame(handleGamepad);
    };

    handleGamepad();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isGamepadConnected, leftPower, rightPower, applyDeadZone]);
  */

  return (
    <ChakraProvider>
      {console.log(`Render - leftPower: ${leftPower}, rightPower: ${rightPower}`)}
      <Box minHeight="100vh" display="flex" flexDirection="column" alignItems="center" justifyContent="center">
        <VStack spacing={8}>
          <HStack spacing={8}>
            <VStack>
              <Text>Left Wheel</Text>
              <div>
                <label htmlFor="left-wheel">Left Wheel</label>
                <input
                  type="range"
                  id="left-wheel"
                  min="-1"
                  max="1"
                  step="0.1"
                  value={leftPower}
                  onChange={(e) => handleSliderChange(parseFloat(e.target.value), 'left')}
                  style={{ width: '200px', transform: 'rotate(270deg)' }}
                />
              </div>
            </VStack>
            <VStack>
              <Text>Right Wheel</Text>
              <div>
                <label htmlFor="right-wheel">Right Wheel</label>
                <input
                  type="range"
                  id="right-wheel"
                  min="-1"
                  max="1"
                  step="0.1"
                  value={rightPower}
                  onChange={(e) => handleSliderChange(parseFloat(e.target.value), 'right')}
                  style={{ width: '200px', transform: 'rotate(270deg)' }}
                />
              </div>
            </VStack>
          </HStack>
          <Text mt={4}>Current Control: {controlMethod}</Text>
          <Text mt={2}>WebSocket Status: {isConnected ? 'Connected' : 'Disconnected'}</Text>
          <HStack spacing={4}>
            <Button onClick={handleGamepadConnect} isDisabled={isGamepadConnected}>Connect Gamepad</Button>
            <Button onClick={handleGamepadDisconnect}>Disconnect</Button>
          </HStack>
        </VStack>
      </Box>
    </ChakraProvider>
  );
}

export default App;