document.addEventListener('DOMContentLoaded', () => {
  const morsePalsTab = document.getElementById('morse-pals-tab');
  if (!morsePalsTab) {
    console.error('Morse Pals tab not found');
    return;
  }

  const friendListItems = morsePalsTab.querySelectorAll('ul.space-y-2 > li');
  const chatWindow = morsePalsTab.querySelector('div.flex-grow.overflow-y-auto');

  if (!friendListItems.length) {
    console.warn('No friend list items found in Morse Pals tab.');
    // It's possible the list is dynamically populated, so we don't return error.
  }

  if (!chatWindow) {
    console.error('Chat window area not found in Morse Pals tab.');
    return;
  }

  let currentlySelectedFriend = null;

  friendListItems.forEach(item => {
    item.addEventListener('click', () => {
      // Remove 'selected-friend' class from previously selected friend
      if (currentlySelectedFriend) {
        currentlySelectedFriend.classList.remove('selected-friend');
      }

      // Add 'selected-friend' class to the clicked friend item
      item.classList.add('selected-friend');

      // Store the clicked item as the currently selected friend
      currentlySelectedFriend = item;

      // Clear the innerHTML of the chat window area
      chatWindow.innerHTML = '';

      // Create a new paragraph element for the "Chatting with" message
      const chattingWithMessage = document.createElement('p');
      const friendName = item.textContent.trim();
      chattingWithMessage.textContent = `Chatting with ${friendName}`;
      chattingWithMessage.classList.add('text-gray-400', 'text-center', 'my-4'); // Added my-4 for spacing

      // Append this paragraph to the chat window area
      chatWindow.appendChild(chattingWithMessage);

      // Add mock historical messages
      // Received message
      const receivedMessageDiv = document.createElement('div');
      receivedMessageDiv.classList.add('flex', 'justify-start', 'mb-3'); // Added mb-3 for spacing
      receivedMessageDiv.innerHTML = `
        <div class="bg-gray-600 text-white p-3 rounded-lg max-w-xs lg:max-w-md">
          <p class="text-sm">${friendName}: Hi there!</p>
          <span class="text-xs text-gray-400 block text-right mt-1">A few moments ago</span>
        </div>
      `;
      chatWindow.appendChild(receivedMessageDiv);

      // Sent message
      const sentMessageDiv = document.createElement('div');
      sentMessageDiv.classList.add('flex', 'justify-end', 'mb-3'); // Added mb-3 for spacing
      sentMessageDiv.innerHTML = `
        <div class="bg-blue-500 text-white p-3 rounded-lg max-w-xs lg:max-w-md">
          <p class="text-sm">You: Hello!</p>
          <span class="text-xs text-blue-200 block text-right mt-1">Just now</span>
        </div>
      `;
      chatWindow.appendChild(sentMessageDiv);
    });
  });

  console.log("Morse Pals script loaded and initialized.");

  let currentComposedMessage = '';

  document.addEventListener('visualTapperCharacterComplete', (event) => {
    const morsePalsTabActive = !morsePalsTab.classList.contains('hidden');

    if (morsePalsTabActive) {
      if (event.detail && event.detail.morseString) {
        const morseString = event.detail.morseString;
        // Assuming morseToText is globally available
        // and handles undefined/empty morseString gracefully if needed.
        const character = morseToText(morseString); 

        if (character) { // Ensure character is not empty or undefined
          currentComposedMessage += character;
          console.log('Current message:', currentComposedMessage);
        } else if (morseString === '/') { // Handle space explicitly if morseToText doesn't
          currentComposedMessage += ' ';
          console.log('Current message (space added):', currentComposedMessage);
        } else {
          console.warn(`morseToText returned no character for: ${morseString}`);
        }
      } else {
        console.warn('visualTapperCharacterComplete event did not contain morseString in detail.');
      }
    }
  });

  // Get reference to the "Send Message" button and chat window
  const sendMessageButton = morsePalsTab.querySelector('button.bg-green-500'); // More specific selector
  // chatWindow is already defined above: const chatWindow = morsePalsTab.querySelector('div.flex-grow.overflow-y-auto');

  if (!sendMessageButton) {
    console.error('Send Message button not found in Morse Pals tab.');
    // No return here, as other functionalities might still work.
  } else {
    sendMessageButton.addEventListener('click', () => {
      const messageToSend = currentComposedMessage.trim();

      if (messageToSend) {
        // Create outer div
        const outerDiv = document.createElement('div');
        outerDiv.classList.add('flex', 'justify-end', 'mb-3'); // Added mb-3 for spacing

        // Create main message div
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('bg-blue-500', 'text-white', 'p-3', 'rounded-lg', 'max-w-xs', 'lg:max-w-md');

        // Create message text paragraph
        const messageText = document.createElement('p');
        messageText.classList.add('text-sm');
        messageText.textContent = messageToSend;

        // Create timestamp span
        const timestampSpan = document.createElement('span');
        timestampSpan.classList.add('text-xs', 'text-blue-200', 'block', 'text-right', 'mt-1');
        timestampSpan.textContent = 'Just now';

        // Append paragraph and span to messageDiv
        messageDiv.appendChild(messageText);
        messageDiv.appendChild(timestampSpan);

        // Append messageDiv to outerDiv
        outerDiv.appendChild(messageDiv);

        // Append outerDiv to chatWindow
        if (chatWindow) {
          chatWindow.appendChild(outerDiv);

          // Scroll chat window to bottom
          chatWindow.scrollTop = chatWindow.scrollHeight;
        } else {
          console.error("Chat window not found for sending message.");
        }

        // Clear currentComposedMessage
        currentComposedMessage = '';

        // Call global resetVisualTapperState()
        if (typeof resetVisualTapperState === 'function') {
          resetVisualTapperState();
        } else {
          console.warn('resetVisualTapperState function not found.');
        }
        
        // Optionally, clear the visual tapper display area if needed
        const morseInputDisplay = document.getElementById('morse-input-display');
        if (morseInputDisplay) {
            morseInputDisplay.textContent = '';
        }
        const textOutput = document.getElementById('text-output');
        if (textOutput) {
            textOutput.textContent = '';
        }


      } else {
        console.log('No message to send.');
      }
    });
  }
});
