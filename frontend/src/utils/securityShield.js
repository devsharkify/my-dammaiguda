/**
 * Security Shield - Comprehensive Website Protection
 * Features:
 * - Disable right-click
 * - Disable keyboard shortcuts (F12, Ctrl+Shift+I, etc.)
 * - Detect and block DevTools
 * - Disable text selection on sensitive areas
 * - Disable drag & drop
 * - Disable copy/paste on protected elements
 * - Console warning for hackers
 */

class SecurityShield {
  constructor() {
    this.devToolsOpen = false;
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
    
    console.log('🛡️ Security Shield: Active');
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
    setInterval(checkDevTools, 1000);
    
    // Also check on resize
    window.addEventListener('resize', checkDevTools);

    // Debugger detection
    const detectDebugger = () => {
      const start = performance.now();
      debugger;
      const end = performance.now();
      if (end - start > 100) {
        this.onDevToolsOpen();
      }
    };
    
    // Run debugger detection occasionally (not too frequently)
    setInterval(detectDebugger, 5000);
  }

  onDevToolsOpen() {
    // Clear console and show warning
    console.clear();
    console.log('%c⚠️ SECURITY WARNING', 'color: red; font-size: 40px; font-weight: bold;');
    console.log('%cThis browser feature is intended for developers only.', 'font-size: 16px;');
    console.log('%cIf someone told you to copy-paste something here, it is a scam.', 'font-size: 16px; color: red;');
    console.log('%cPasting anything here could give attackers access to your account.', 'font-size: 14px;');
    
    // Optionally blur the page or redirect
    // document.body.style.filter = 'blur(10px)';
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
      background: #ef4444;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 99999;
      animation: fadeIn 0.3s ease;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    toast.textContent = `🛡️ ${message}`;
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
