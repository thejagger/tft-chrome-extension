/**
 * OpenCV Availability Checker
 * Simple script to verify OpenCV.js loading
 */

// Check OpenCV availability immediately
(function() {
  const startTime = Date.now();
  
  function checkOpenCV() {
    const elapsed = Date.now() - startTime;
    
    if (typeof cv !== 'undefined') {
      console.log(`[OpenCV] Object available after ${elapsed}ms`, {
        hasMat: !!cv.Mat,
        hasImread: !!cv.imread,
        version: cv.getBuildInformation ? 'Available' : 'Not available'
      });
      
      if (cv.Mat) {
        console.log(`[OpenCV] Fully loaded after ${elapsed}ms`);
        return true;
      }
    }
    
    if (elapsed > 5000 && elapsed % 5000 === 0) {
      console.log(`[OpenCV] Still loading... ${elapsed}ms elapsed`);
    }
    
    return false;
  }
  
  // Initial check
  if (!checkOpenCV()) {
    // Keep checking periodically
    const interval = setInterval(() => {
      if (checkOpenCV() || Date.now() - startTime > 60000) {
        clearInterval(interval);
        if (Date.now() - startTime > 60000) {
          console.error(`[OpenCV] Failed to load after 60 seconds`);
        }
      }
    }, 1000);
  }
})(); 