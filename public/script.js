// Loading screen animation
window.addEventListener('DOMContentLoaded', () => {
  const loadingBar = document.getElementById('loading-bar');
  const loadingScreen = document.getElementById('loading-screen');
  const appContainer = document.getElementById('app-container');
  
  let width = 0;
  const interval = setInterval(() => {
    if (width >= 100) {
      clearInterval(interval);
      loadingScreen.style.opacity = '0';
      setTimeout(() => {
        loadingScreen.style.display = 'none';
        appContainer.style.display = 'flex';
      }, 500);
    } else {
      width += 10;
      loadingBar.style.width = width + '%';
    }
  }, 200);
});

// Chat functions
async function sendMessage() {
  const location = document.getElementById('location').value.trim();
  const filter = document.getElementById('filter').value;
  const chatWindow = document.getElementById('chat-window');

  if (!location) {
    showError("Please enter a location");
    return;
  }

  clearErrors();
  addUserMessage(`Looking for ${filter} places in ${location}`);
  const loadingId = addLoadingMessage(`Searching for ${filter} places in ${location}...`);

  try {
    const response = await fetch('/api/places', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ location, filter }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Unable to fetch places');
    }

    removeLoadingIndicator(loadingId);
    showPlaces(location, filter, data.places);
  } catch (error) {
    removeLoadingIndicator(loadingId);
    showError(`Error: ${error.message}`);
  }
}

// Helper functions
function addUserMessage(text) {
  const chatWindow = document.getElementById('chat-window');
  const messageElement = document.createElement('div');
  messageElement.className = 'msg user';
  messageElement.innerHTML = `
    <div class="msg-content">
      <div class="msg-text">${text}</div>
      <div class="msg-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
    </div>
  `;
  chatWindow.appendChild(messageElement);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function addLoadingMessage(text) {
  const id = 'loading-' + Date.now();
  const chatWindow = document.getElementById('chat-window');
  const loadingElement = document.createElement('div');
  loadingElement.className = 'msg bot';
  loadingElement.id = id;
  loadingElement.innerHTML = `
    <div class="msg-content">
      <div class="msg-text">${text}</div>
      <div class="loading-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  `;
  chatWindow.appendChild(loadingElement);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return id;
}

function removeLoadingIndicator(id) {
  const element = document.getElementById(id);
  if (element) element.remove();
}

function showPlaces(location, filter, places) {
  const chatWindow = document.getElementById('chat-window');
  const placesElement = document.createElement('div');
  placesElement.className = 'msg bot';
  
  let placesHTML = `
    <div class="msg-content">
      <div class="msg-text">Here are ${places.length} ${filter.toLowerCase()} places in ${location}:</div>
      <div class="places-container">
  `;

  places.forEach((place, index) => {
    placesHTML += `
      <div class="place-card">
        <div class="place-header">
          <h4>${index + 1}. ${place.name}</h4>
          ${place.rating ? `<div class="place-rating">${place.rating} ★</div>` : ''}
        </div>
        <div class="place-details">
          <div class="detail-item">
            <span class="detail-icon">📍</span>
            <a href="${place.mapLink}" target="_blank" class="map-link">View on Map</a>
          </div>
          <div class="detail-item">
            <span class="detail-icon">📏</span>
            <span>${place.distance || 'Distance not specified'}</span>
          </div>
          <div class="detail-item">
            <span class="detail-icon">${getTravelModeIcon(place.travelMode)}</span>
            <span>${place.travelMode || 'Transport not specified'}</span>
          </div>
        </div>
      </div>
    `;
  });

  placesHTML += `
      </div>
      <div class="msg-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
    </div>
  `;
  
  placesElement.innerHTML = placesHTML;
  chatWindow.appendChild(placesElement);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function showError(message) {
  const chatWindow = document.getElementById('chat-window');
  const errorElement = document.createElement('div');
  errorElement.className = 'msg bot error';
  errorElement.innerHTML = `
    <div class="msg-content">
      <div class="msg-text">⚠️ ${message}</div>
      <div class="msg-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
    </div>
  `;
  chatWindow.appendChild(errorElement);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function clearErrors() {
  const errors = document.querySelectorAll('.msg.error');
  errors.forEach(error => error.remove());
}

function getTravelModeIcon(mode) {
  if (!mode) return '🚆';
  mode = mode.toLowerCase();
  if (mode.includes('car')) return '🚗';
  if (mode.includes('walk')) return '🚶';
  if (mode.includes('metro') || mode.includes('subway')) return '🚇';
  if (mode.includes('bus')) return '🚌';
  if (mode.includes('bike')) return '🚲';
  if (mode.includes('train')) return '🚂';
  return '🚆';
}

function newChat() {
  document.getElementById('chat-window').innerHTML = `
    <div class="welcome-message">
      <h2>Welcome to ExploreBot! 🌍</h2>
      <p>Ask me about places to visit, things to do, or travel tips for any destination.</p>
      <div class="quick-suggestions">
        <button class="quick-suggestion" onclick="quickSuggestion('Paris, Family-friendly')">Paris family trips</button>
        <button class="quick-suggestion" onclick="quickSuggestion('Tokyo, Adventure')">Tokyo adventures</button>
        <button class="quick-suggestion" onclick="quickSuggestion('New York, Budget')">NYC on a budget</button>
      </div>
    </div>
  `;
  document.getElementById('location').value = '';
}

function quickSuggestion(text) {
  const parts = text.split(', ');
  document.getElementById('location').value = parts[0];
  document.getElementById('filter').value = parts[1];
  sendMessage();
}

// Handle Enter key press
document.getElementById('location').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    sendMessage();
  }
});