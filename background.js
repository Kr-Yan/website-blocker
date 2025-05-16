let blockedSites = [];
let blockStartTime = "09:00";
let blockEndTime = "18:00";
let isActive = true;

// Initialize extension data
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(
    ["blockedSites", "blockStartTime", "blockEndTime", "isActive"],
    (result) => {
      if (result.blockedSites) blockedSites = result.blockedSites;
      if (result.blockStartTime) blockStartTime = result.blockStartTime;
      if (result.blockEndTime) blockEndTime = result.blockEndTime;
      if (result.isActive !== undefined) isActive = result.isActive;
    }
  );
});

// Listen for navigation events
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (details.frameId !== 0) return; // Only check main frame
  checkIfShouldBlock(details.url);
});

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "loading" && tab.url) {
    checkIfShouldBlock(tab.url);
  }
});

// Check if a URL should be blocked
function checkIfShouldBlock(url) {
  if (!isActive) return;

  // Check if current time is within blocking period
  if (!isWithinBlockingHours()) return;

  // Check if URL matches any blocked site
  const hostname = new URL(url).hostname;

  for (const site of blockedSites) {
    if (hostname.includes(site)) {
      // Redirect to blocked page
      chrome.tabs.update({
        url: chrome.runtime.getURL(
          `blocked.html?start=${encodeURIComponent(
            blockStartTime
          )}&end=${encodeURIComponent(blockEndTime)}`
        ),
      });
      return;
    }
  }
}

// Check if current time is within blocking hours
function isWithinBlockingHours() {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  const [startHour, startMinute] = blockStartTime.split(":").map(Number);
  const [endHour, endMinute] = blockEndTime.split(":").map(Number);

  const currentTime = currentHour * 60 + currentMinute;
  const startTime = startHour * 60 + startMinute;
  const endTime = endHour * 60 + endMinute;

  return currentTime >= startTime && currentTime <= endTime;
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getSettings") {
    sendResponse({
      blockedSites,
      blockStartTime,
      blockEndTime,
      isActive,
    });
  } else if (request.action === "updateSettings") {
    blockedSites = request.blockedSites || blockedSites;
    blockStartTime = request.blockStartTime || blockStartTime;
    blockEndTime = request.blockEndTime || blockEndTime;
    isActive = request.isActive !== undefined ? request.isActive : isActive;

    // Save to storage
    chrome.storage.local.set({
      blockedSites,
      blockStartTime,
      blockEndTime,
      isActive,
    });

    sendResponse({ success: true });
  }
  return true;
});
