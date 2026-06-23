import React, { useState, useEffect } from 'react';

function App() {
  const [messageFromMain, setMessageFromMain] = useState('Waiting for message from main process...');
  const [invokeResponse, setInvokeResponse] = useState('Click the button to send a message.');

  // Effect to listen for messages from the main process
  useEffect(() => {
    const removeListener = window.electronAPI.on('from-main', (message) => {
      console.log('Renderer received:', message);
      setMessageFromMain(message);
    });

    // Cleanup function to remove the listener
    return () => {
      removeListener();
    };
  }, []); // Empty dependency array means this effect runs once on mount

  // Handler for the button click
  const handleButtonClick = async () => {
    const messageToSend = 'Hello from the Renderer process!';
    setInvokeResponse('Sending...');
    const response = await window.electronAPI.invoke('ipc-example', messageToSend);
    setInvokeResponse(response);
  };

  return (
    <div>
      <h1>Electron + React IPC Example</h1>
      <p>
        <strong>Message from Main:</strong><br />
        {messageFromMain}
      </p>
      <button onClick={handleButtonClick}>Send Message to Main</button>
      <p>
        <strong>Response from Main:</strong><br />
        {invokeResponse}
      </p>
    </div>
  );
}

export default App;
