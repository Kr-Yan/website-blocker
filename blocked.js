// blocked.js
document.addEventListener("DOMContentLoaded", function () {
  // Try to get settings via message
  chrome.runtime.sendMessage({ action: "getSettings" }, function (response) {
    if (response && response.blockStartTime && response.blockEndTime) {
      document.getElementById(
        "blockTime"
      ).textContent = `${response.blockStartTime} - ${response.blockEndTime}`;
    } else {
      // Fallback: try to get from URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const startTime = urlParams.get("start");
      const endTime = urlParams.get("end");

      if (startTime && endTime) {
        document.getElementById(
          "blockTime"
        ).textContent = `${startTime} - ${endTime}`;
      } else {
        document.getElementById("blockTime").textContent =
          "Check extension settings";
      }
    }
  });
});
