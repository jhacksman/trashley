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
    if (readyState === ReadyState.OPEN) {
      // Only send message if values are not both zero (assuming zero is the default)
      if (leftPower !== 0 || rightPower !== 0) {
        console.log(`Current state values - leftPower: ${leftPower}, rightPower: ${rightPower}`);
        const message = JSON.stringify({ type: 'control', leftPower, rightPower });
        console.log('Sending WebSocket message:', message);
        sendMessage(message);
      } else {
        console.log('Skipping send for default values');
      }
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
    console.log(`Slider changed: ${side} = ${value}`);
    if (side === 'left') {
      setLeftPower(prevPower => {
        console.log(`New left power value: ${value}`);
        return value;
      });
    } else {
      setRightPower(prevPower => {
        console.log(`New right power value: ${value}`);
        return value;
      });
    }
    setControlMethod('sliders');
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
    const timeoutId = setTimeout(() => {
      sendControlMessage();
    }, 50); // 50ms delay
    return () => clearTimeout(timeoutId);
  }, [leftPower, rightPower, sendControlMessage]);

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

  return (
    <ChakraProvider>
      <Box minHeight="100vh" display="flex" flexDirection="column" alignItems="center" justifyContent="center">
        <VStack spacing={8}>
          <HStack spacing={8}>
            <VStack>
              <Text>Left Wheel</Text>
              <Slider
                aria-label="left-wheel"
                value={leftPower}
                onChange={(v) => handleSliderChange(v, 'left')}
                min={-1}
                max={1}
                step={0.1}
                orientation="vertical"
                minH="200px"
              >
                <SliderTrack />
                <SliderThumb />
              </Slider>
            </VStack>
            <VStack>
              <Text>Right Wheel</Text>
              <Slider
                aria-label="right-wheel"
                value={rightPower}
                onChange={(v) => handleSliderChange(v, 'right')}
                min={-1}
                max={1}
                step={0.1}
                orientation="vertical"
                minH="200px"
              >
                <SliderTrack />
                <SliderThumb />
              </Slider>
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