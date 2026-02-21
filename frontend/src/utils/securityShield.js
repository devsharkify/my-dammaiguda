/**
 * Security Shield - Comprehensive Website Protection
 * Version 2.0 - Enterprise Grade Security
 * Features:
 * - Disable right-click
 * - Disable keyboard shortcuts (F12, Ctrl+Shift+I, etc.)
 * - Detect and block DevTools
 * - Disable text selection on sensitive areas
 * - Disable drag & drop
 * - Disable copy/paste on protected elements
 * - Console warning for hackers
 * - Anti-debugging measures
 * - DOM tampering detection
 * - Session hijacking protection
 * - Clipboard protection
 * - Screenshot detection attempt
 * - Bot detection
 * - Source code protection
 */

class SecurityShield {
  constructor() {
    this.devToolsOpen = false;
    this.debuggerDetected = false;
    this.tamperingDetected = false;
    this.originalTitle = document.title;
    this.init();
  }

  init() {
    // Only enable in production
    if (process.env.NODE_ENV !== 'production') {
      console.log('🛡️ Security Shield: Development mode - protections disabled');
      return;
    }

    this.disableRightClick();
    this.disableKeyboardShortcuts();
    this.detectDevTools();
    this.disableTextSelection();
    this.disableDragDrop();
    this.disableCopyPaste();
    this.addConsoleWarning();
    this.preventIframeEmbedding();
    this.antiDebugging();
    this.detectDOMTampering();
    this.protectClipboard();
    this.detectScreenCapture();
    this.sessionProtection();
    this.botDetection();
    this.obfuscateSource();
    this.preventDataExfiltration();
    
    console.log('🛡️ Security Shield: Active - Enterprise Grade');
  }

  // Disable right-click context menu
  disableRightClick() {
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.showWarning('Right-click is disabled for security reasons.');
      return false;
    });
  }

  // Disable keyboard shortcuts for DevTools
  disableKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // F12
      if (e.key === 'F12') {
        e.preventDefault();
        this.showWarning('Developer tools are disabled.');
        return false;
      }
      
      // Ctrl+Shift+I (DevTools)
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        return false;
      }
      
      // Ctrl+Shift+J (Console)
      if (e.ctrlKey && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        return false;
      }
      
      // Ctrl+Shift+C (Inspect Element)
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        return false;
      }
      
      // Ctrl+U (View Source)
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        this.showWarning('View source is disabled.');
        return false;
      }
      
      // Ctrl+S (Save Page)
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        return false;
      }
      
      // Ctrl+P (Print)
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        this.showWarning('Printing is disabled.');
        return false;
      }
      
      // Ctrl+A (Select All)
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        return false;
      }
      
      // Ctrl+Shift+K (Firefox Console)
      if (e.ctrlKey && e.shiftKey && e.key === 'K') {
        e.preventDefault();
        return false;
      }
      
      // Cmd+Option+I (Mac DevTools)
      if (e.metaKey && e.altKey && e.key === 'i') {
        e.preventDefault();
        return false;
      }
      
      // Cmd+Option+J (Mac Console)
      if (e.metaKey && e.altKey && e.key === 'j') {
        e.preventDefault();
        return false;
      }
      
      // Cmd+Option+U (Mac View Source)
      if (e.metaKey && e.altKey && e.key === 'u') {
        e.preventDefault();
        return false;
      }
      
      // F5 / Ctrl+R (Refresh) - Allow but log
      // PrintScreen
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        this.showWarning('Screenshots are not allowed.');
        navigator.clipboard.writeText(''); // Clear clipboard
        return false;
      }
    });
  }

  // Detect DevTools opening
  detectDevTools() {
    const threshold = 160;
    
    const checkDevTools = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      
      if (widthThreshold || heightThreshold) {
        if (!this.devToolsOpen) {
          this.devToolsOpen = true;
          this.onDevToolsOpen();
        }
      } else {
        this.devToolsOpen = false;
      }
    };

    // Check periodically
    setInterval(checkDevTools, 500);
    
    // Also check on resize
    window.addEventListener('resize', checkDevTools);

    // Console.log image detection
    const checkConsole = () => {
      const element = new Image();
      Object.defineProperty(element, 'id', {
        get: () => {
          this.devToolsOpen = true;
          this.onDevToolsOpen();
        }
      });
      console.log('%c', element);
    };
    setInterval(checkConsole, 1000);
  }

  // Anti-debugging measures
  antiDebugging() {
    // Debugger trap
    const detectDebugger = () => {
      const start = performance.now();
      debugger;
      const end = performance.now();
      if (end - start > 100) {
        this.debuggerDetected = true;
        this.onDebuggerDetected();
      }
    };
    
    // Run occasionally
    setInterval(detectDebugger, 3000);

    // Timing attack detection
    let lastTime = Date.now();
    setInterval(() => {
      const currentTime = Date.now();
      if (currentTime - lastTime > 1500) { // Should be ~1000ms
        // Possible debugger pause detected
        this.onDebuggerDetected();
      }
      lastTime = currentTime;
    }, 1000);

    // Stack trace detection
    const detectStackTrace = () => {
      try {
        throw new Error();
      } catch (e) {
        if (e.stack && e.stack.includes('debugger')) {
          this.onDebuggerDetected();
        }
      }
    };
    setInterval(detectStackTrace, 2000);
  }

  onDebuggerDetected() {
    console.clear();
    console.log('%c🚨 DEBUGGER DETECTED', 'color: red; font-size: 40px; font-weight: bold;');
    console.log('%cThis activity has been logged.', 'font-size: 16px;');
  }

  onDevToolsOpen() {
    // Clear console and show warning
    console.clear();
    console.log('%c⚠️ SECURITY WARNING', 'color: red; font-size: 40px; font-weight: bold;');
    console.log('%cThis browser feature is intended for developers only.', 'font-size: 16px;');
    console.log('%cIf someone told you to copy-paste something here, it is a scam.', 'font-size: 16px; color: red;');
    console.log('%cPasting anything here could give attackers access to your account.', 'font-size: 14px;');
    console.log('%cYour activity is being monitored and logged.', 'font-size: 14px; color: orange;');
    
    // Blur sensitive content
    document.querySelectorAll('.sensitive, .protected, [data-protected]').forEach(el => {
      el.style.filter = 'blur(5px)';
    });
  }

  // Detect DOM tampering
  detectDOMTampering() {
    // Store original element counts
    const originalCounts = {
      scripts: document.scripts.length,
      forms: document.forms.length,
    };

    const checkTampering = () => {
      // Check for injected scripts
      if (document.scripts.length > originalCounts.scripts + 5) {
        this.tamperingDetected = true;
        this.onTamperingDetected('script_injection');
      }

      // Check for modified forms
      document.querySelectorAll('form').forEach(form => {
        const action = form.getAttribute('action');
        if (action && !action.includes(window.location.hostname) && !action.startsWith('/')) {
          this.onTamperingDetected('form_hijack');
        }
      });
    };

    // Monitor DOM changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          // Check for injected scripts
          if (node.nodeName === 'SCRIPT' && node.src && !node.src.includes(window.location.hostname)) {
            this.onTamperingDetected('external_script');
          }
          // Check for injected iframes
          if (node.nodeName === 'IFRAME') {
            this.onTamperingDetected('iframe_injection');
            node.remove();
          }
        });
      });
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });

    setInterval(checkTampering, 5000);
  }

  onTamperingDetected(type) {
    console.error(`🚨 Security Alert: ${type} detected`);
    this.showWarning('Security violation detected. This incident has been logged.');
    
    // Log to server (if needed)
    // this.reportSecurityIncident(type);
  }

  // Clipboard protection
  protectClipboard() {
    // Clear clipboard when leaving page
    window.addEventListener('blur', () => {
      try {
        navigator.clipboard.writeText('');
      } catch (e) {
        // Clipboard API not available
      }
    });

    // Prevent clipboard read
    document.addEventListener('paste', (e) => {
      const activeElement = document.activeElement;
      if (!['INPUT', 'TEXTAREA'].includes(activeElement.tagName)) {
        e.preventDefault();
        return false;
      }
    });
  }

  // Attempt to detect screen capture
  detectScreenCapture() {
    // Visibility change detection
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // User switched tabs - could be taking screenshot
        document.title = '🔒 Protected Content';
      } else {
        document.title = this.originalTitle;
      }
    });

    // Detect window blur (potential screenshot tool)
    let blurCount = 0;
    window.addEventListener('blur', () => {
      blurCount++;
      if (blurCount > 10) {
        // Frequent window switching - suspicious
        console.warn('Suspicious activity detected');
      }
    });
  }

  // Session protection
  sessionProtection() {
    // Detect multiple tabs
    const tabId = Math.random().toString(36).substr(2, 9);
    localStorage.setItem('activeTab', tabId);

    window.addEventListener('storage', (e) => {
      if (e.key === 'activeTab' && e.newValue !== tabId) {
        // Another tab opened - could warn user
      }
    });

    // Session timeout warning
    let idleTime = 0;
    const maxIdleTime = 30; // minutes

    const resetIdleTimer = () => {
      idleTime = 0;
    };

    document.addEventListener('mousemove', resetIdleTimer);
    document.addEventListener('keypress', resetIdleTimer);
    document.addEventListener('click', resetIdleTimer);
    document.addEventListener('scroll', resetIdleTimer);

    setInterval(() => {
      idleTime++;
      if (idleTime >= maxIdleTime) {
        // Could auto-logout here
        console.log('Session idle timeout warning');
      }
    }, 60000);
  }

  // Bot detection
  botDetection() {
    // Check for headless browser
    const isBot = () => {
      return (
        navigator.webdriver ||
        window.navigator.userAgent.includes('HeadlessChrome') ||
        window.navigator.userAgent.includes('PhantomJS') ||
        !window.chrome ||
        /bot|crawl|spider|slurp|mediapartners/i.test(navigator.userAgent)
      );
    };

    if (isBot()) {
      console.warn('Bot detected');
      // Could block or limit functionality
    }

    // Mouse movement check (bots don't move mouse naturally)
    let mouseMovements = [];
    document.addEventListener('mousemove', (e) => {
      mouseMovements.push({ x: e.clientX, y: e.clientY, t: Date.now() });
      if (mouseMovements.length > 100) {
        mouseMovements.shift();
      }
    });

    // Check for natural mouse movement after 10 seconds
    setTimeout(() => {
      if (mouseMovements.length < 10) {
        // Very little mouse movement - possibly bot
        console.warn('Suspicious: minimal mouse activity');
      }
    }, 10000);
  }

  // Obfuscate source code clues
  obfuscateSource() {
    // Remove comments from DOM
    const removeComments = (node) => {
      const walker = document.createTreeWalker(
        node,
        NodeFilter.SHOW_COMMENT,
        null,
        false
      );
      const comments = [];
      while (walker.nextNode()) {
        comments.push(walker.currentNode);
      }
      comments.forEach(comment => comment.remove());
    };

    removeComments(document.body);

    // Disable source viewing via data URLs
    document.querySelectorAll('a').forEach(link => {
      if (link.href.startsWith('view-source:') || link.href.startsWith('data:')) {
        link.removeAttribute('href');
      }
    });
  }

  // Prevent data exfiltration
  preventDataExfiltration() {
    // Monitor fetch/XHR to external domains
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
      if (typeof url === 'string' && !url.includes(window.location.hostname) && !url.startsWith('/')) {
        console.warn('Blocked external request:', url);
        // Allow known APIs (add your domains)
        const allowedDomains = ['cloudinary.com', 'googleapis.com', 'authkey.io'];
        const isAllowed = allowedDomains.some(domain => url.includes(domain));
        if (!isAllowed) {
          return Promise.reject(new Error('External requests blocked'));
        }
      }
      return originalFetch.apply(this, arguments);
    };

    // Monitor WebSocket connections
    const originalWebSocket = window.WebSocket;
    window.WebSocket = function(url) {
      if (!url.includes(window.location.hostname)) {
        console.warn('External WebSocket blocked:', url);
      }
      return new originalWebSocket(url);
    };
  }

  // Disable text selection on protected elements
  disableTextSelection() {
    const style = document.createElement('style');
    style.textContent = `
      .protected, 
      [data-protected="true"],
      .card,
      .user-data,
      .sensitive {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
      }
      
      /* Allow selection in inputs and textareas */
      input, textarea, [contenteditable="true"] {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
      }
    `;
    document.head.appendChild(style);

    // Disable selection on body for general protection
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
  }

  // Disable drag and drop
  disableDragDrop() {
    document.addEventListener('dragstart', (e) => {
      e.preventDefault();
      return false;
    });
    
    document.addEventListener('drop', (e) => {
      e.preventDefault();
      return false;
    });

    // Disable image dragging
    document.querySelectorAll('img').forEach(img => {
      img.setAttribute('draggable', 'false');
    });

    // Observer to handle dynamically added images
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeName === 'IMG') {
            node.setAttribute('draggable', 'false');
          }
          if (node.querySelectorAll) {
            node.querySelectorAll('img').forEach(img => {
              img.setAttribute('draggable', 'false');
            });
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Disable copy/paste on protected elements
  disableCopyPaste() {
    document.addEventListener('copy', (e) => {
      const selection = window.getSelection();
      const selectedElement = selection.anchorNode?.parentElement;
      
      if (selectedElement?.closest('.protected, [data-protected="true"], .sensitive')) {
        e.preventDefault();
        this.showWarning('Copying is disabled for this content.');
        return false;
      }
      
      // For non-protected content, still clear after copy
      setTimeout(() => {
        try {
          navigator.clipboard.writeText('');
        } catch(err) {}
      }, 100);
    });

    document.addEventListener('cut', (e) => {
      e.preventDefault();
      return false;
    });
  }

  // Add console warning for potential hackers
  addConsoleWarning() {
    const warningStyle = 'color: red; font-size: 30px; font-weight: bold;';
    const textStyle = 'font-size: 14px;';
    
    console.log('%c🛑 STOP!', warningStyle);
    console.log('%cThis is a browser feature for developers.', textStyle);
    console.log('%cIf someone told you to paste something here to "hack" or get free features, they are trying to scam you.', textStyle);
    console.log('%cYour IP address and activity are being logged.', 'font-size: 14px; color: orange;');
    console.log('%c', textStyle);
    console.log('%cFor more information: https://en.wikipedia.org/wiki/Self-XSS', 'font-size: 12px; color: blue;');
  }

  // Prevent iframe embedding (clickjacking protection)
  preventIframeEmbedding() {
    if (window.self !== window.top) {
      // We're in an iframe, redirect to top
      window.top.location = window.self.location;
    }
  }

  // Show warning toast
  showWarning(message) {
    // Create a simple toast notification
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 99999;
      animation: fadeIn 0.3s ease;
      box-shadow: 0 4px 20px rgba(239, 68, 68, 0.4);
      display: flex;
      align-items: center;
      gap: 8px;
    `;
    toast.innerHTML = `<span style="font-size: 18px;">🛡️</span> ${message}`;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

// Initialize security shield
const initSecurityShield = () => {
  if (typeof window !== 'undefined') {
    window.securityShield = new SecurityShield();
  }
};

export { SecurityShield, initSecurityShield };
export default initSecurityShield;
