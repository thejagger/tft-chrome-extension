/**
 * TFT Chrome Extension - Popup Script
 * Handles popup UI interactions and status updates
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Get DOM elements
  const elements = {
    extensionStatus: document.getElementById('extension-status'),
    videoStatus: document.getElementById('video-status'),
    tftStatus: document.getElementById('tft-status'),
    cvStatus: document.getElementById('cv-status'),
    testOverlayBtn: document.getElementById('test-overlay'),
    refreshBtn: document.getElementById('refresh-detection'),
    testCvBtn: document.getElementById('test-cv'),
    videoResolution: document.getElementById('video-resolution'),
    pageUrl: document.getElementById('page-url'),
    detectedElements: document.getElementById('detected-elements'),
    lastDetection: document.getElementById('last-detection'),
    reportIssue: document.getElementById('report-issue'),
    viewLogs: document.getElementById('view-logs')
  };

  // Initialize popup
  await initializePopup();

  // Set up event listeners
  setupEventListeners();

  /**
   * Initialize popup with current status
   */
  async function initializePopup() {
    try {
      // Get active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab) {
        updateStatus('extension', 'inactive', 'No active tab');
        return;
      }

      // Update page URL
      elements.pageUrl.textContent = tab.url || 'Unknown';

      // Check if on Twitch
      if (!tab.url.includes('twitch.tv')) {
        updateStatus('extension', 'inactive', 'Not on Twitch');
        updateStatus('video', 'inactive', 'N/A');
        updateStatus('tft', 'inactive', 'N/A');
        return;
      }

      // Get extension status from content script
      await getExtensionStatus(tab.id);
      
    } catch (error) {
      console.error('Error initializing popup:', error);
      updateStatus('extension', 'inactive', 'Error');
    }
  }

  /**
   * Get status from content script
   */
  async function getExtensionStatus(tabId) {
    try {
      const response = await chrome.tabs.sendMessage(tabId, { 
        action: 'getStatus' 
      });
      
      if (response) {
        updateStatus('extension', response.isActive ? 'active' : 'inactive', 
                    response.isActive ? 'Running' : 'Inactive');
        updateStatus('video', response.hasVideo ? 'active' : 'inactive',
                    response.hasVideo ? 'Detected' : 'Not found');
        updateStatus('tft', response.isTftStream ? 'active' : 'warning',
                    response.isTftStream ? 'TFT Stream' : 'Non-TFT');
        updateStatus('cv', response.cvReady ? 'active' : 'warning',
                    response.cvReady ? 'Ready' : 'Loading');
        
        // Update video resolution if available
        if (response.videoInfo) {
          elements.videoResolution.textContent = 
            `${response.videoInfo.width}x${response.videoInfo.height}`;
        }
        
        // Update CV information
        elements.detectedElements.textContent = response.detectedElements || '0';
        elements.lastDetection.textContent = response.lastDetection || 'None';
      }
    } catch (error) {
      console.error('Error getting status:', error);
      updateStatus('extension', 'inactive', 'Not loaded');
    }
  }

  /**
   * Update status indicator
   */
  function updateStatus(type, status, text) {
    const statusElement = elements[`${type}Status`];
    if (!statusElement) return;

    const dot = statusElement.querySelector('.status-dot');
    const textElement = statusElement.querySelector('.status-text');

    // Update dot appearance
    dot.className = `status-dot ${status}`;
    
    // Update text
    textElement.textContent = text;
  }

  /**
   * Set up event listeners
   */
  function setupEventListeners() {
    // Test overlay button
    elements.testOverlayBtn.addEventListener('click', async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        await chrome.tabs.sendMessage(tab.id, { action: 'testOverlay' });
      } catch (error) {
        console.error('Error testing overlay:', error);
      }
    });

    // Refresh detection button
    elements.refreshBtn.addEventListener('click', async () => {
      await initializePopup();
    });

    // Test CV processing button
    elements.testCvBtn.addEventListener('click', async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'testCvProcessing' });
        
        if (response.success) {
          // Refresh status after a moment to show detection results
          setTimeout(async () => {
            await initializePopup();
          }, 2000);
        }
      } catch (error) {
        console.error('Error testing CV processing:', error);
      }
    });

    // Report issue link
    elements.reportIssue.addEventListener('click', (e) => {
      e.preventDefault();
      chrome.tabs.create({
        url: 'https://github.com/thejagger/tft-chrome-extension/issues'
      });
    });

    // View logs link (opens developer console)
    elements.viewLogs.addEventListener('click', (e) => {
      e.preventDefault();
      chrome.tabs.create({
        url: 'chrome://extensions/?id=' + chrome.runtime.id
      });
    });
  }
}); 