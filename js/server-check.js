// Simple script to check API server status and diagnose connection issues

/**
 * Checks API server status with different methods and provides diagnostic information
 */
class ServerChecker {
  constructor(apiUrl) {
    this.apiUrl = apiUrl || 'http://localhost:3000/api/stadiums';
    this.statusElement = null;
    this.resultElement = null;
  }

  init(statusElementId, resultElementId) {
    this.statusElement = document.getElementById(statusElementId);
    this.resultElement = document.getElementById(resultElementId);
    
    // Add auto-refresh option
    const refreshBtn = document.getElementById('auto-refresh');
    if (refreshBtn) {
      refreshBtn.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.autoRefreshInterval = setInterval(() => this.checkServer(), 5000);
        } else {
          clearInterval(this.autoRefreshInterval);
        }
      });
    }
    
    // Initial check
    this.checkServer();
  }

  updateStatus(isOnline, message) {
    if (this.statusElement) {
      this.statusElement.className = isOnline ? 'online' : 'offline';
      this.statusElement.innerHTML = message;
    }
  }

  updateResult(html) {
    if (this.resultElement) {
      this.resultElement.innerHTML = html;
    }
  }

  async checkServer() {
    this.updateStatus(false, 'Checking server...');
    
    try {
      // Try with regular fetch
      const startTime = performance.now();
      const response = await fetch(this.apiUrl, { 
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        mode: 'cors',
        cache: 'no-cache'
      });
      const endTime = performance.now();
      const responseTime = (endTime - startTime).toFixed(2);
      
      if (response.ok) {
        try {
          const data = await response.json();
          this.updateStatus(true, `Server Online (${responseTime}ms)`);
          this.showDiagnostics({ 
            method: 'fetch',
            status: response.status,
            responseTime,
            dataLength: Array.isArray(data) ? data.length : 'not an array',
            cors: 'Successful',
            contentType: response.headers.get('content-type'),
            response: data
          });
        } catch (jsonError) {
          this.updateStatus(false, 'Invalid JSON Response');
          this.showDiagnostics({ 
            method: 'fetch',
            status: response.status,
            responseTime,
            cors: 'Successful but invalid JSON',
            error: jsonError.message
          });
        }
      } else {
        this.updateStatus(false, `Server Error: ${response.status}`);
        this.showDiagnostics({ 
          method: 'fetch',
          status: response.status,
          responseTime,
          statusText: response.statusText,
          error: 'Server returned an error status code'
        });
      }
    } catch (error) {
      this.updateStatus(false, 'Connection Failed');
      this.diagnoseConnectionIssue(error);
    }
  }

  diagnoseConnectionIssue(error) {
    let diagnosticInfo = {
      method: 'fetch',
      error: error.message,
      possibleCauses: []
    };
    
    // Check error type and suggest possible causes
    if (error.message.includes('Failed to fetch')) {
      diagnosticInfo.possibleCauses.push('Server is not running');
      diagnosticInfo.possibleCauses.push('CORS policy is blocking the request');
      diagnosticInfo.possibleCauses.push('Network connection issue');
      
      // Try XMLHttpRequest as an alternative
      this.tryXHR();
    } else if (error.message.includes('Network Error')) {
      diagnosticInfo.possibleCauses.push('No internet connection');
      diagnosticInfo.possibleCauses.push('Server is down');
    } else if (error.message.includes('CORS')) {
      diagnosticInfo.possibleCauses.push('CORS headers are missing on the server');
      diagnosticInfo.suggestedFix = 'Add appropriate CORS headers to your server';
    }
    
    this.showDiagnostics(diagnosticInfo);
  }
  
  tryXHR() {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', this.apiUrl, true);
    
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        this.updateStatus(true, 'XHR Success');
        try {
          const data = JSON.parse(xhr.responseText);
          this.updateResult(`
            <div class="diagnostic">
              <h3>XHR Request Succeeded</h3>
              <p>This means the server is running but Fetch API is failing, likely due to CORS issues.</p>
              <pre>${JSON.stringify(data, null, 2)}</pre>
            </div>
          `);
        } catch (e) {
          this.updateResult(`
            <div class="diagnostic">
              <h3>XHR Response Not Valid JSON</h3>
              <p>Response received but couldn't parse as JSON</p>
              <pre>${xhr.responseText}</pre>
            </div>
          `);
        }
      } else {
        // XHR also failed
        this.updateResult(`
          <div class="diagnostic">
            <h3>XHR Also Failed (Status: ${xhr.status})</h3>
            <p>Server is likely down or not responding correctly</p>
          </div>
        `);
      }
    };
    
    xhr.onerror = () => {
      this.updateResult(`
        <div class="diagnostic">
          <h3>XHR Network Error</h3>
          <p>Both Fetch and XHR failed to connect - server is most likely not running</p>
          <p>Make sure your server is running at ${this.apiUrl}</p>
        </div>
      `);
    };
    
    xhr.send();
  }

  showDiagnostics(info) {
    let html = `<div class="diagnostic">
      <h3>Diagnostic Information</h3>
      <ul>`;
      
    // Add all diagnostic info
    Object.entries(info).forEach(([key, value]) => {
      if (key === 'response') {
        html += `<li><strong>${key}:</strong> <pre>${JSON.stringify(value, null, 2)}</pre></li>`;
      } else if (key === 'possibleCauses' && Array.isArray(value)) {
        html += `<li><strong>Possible causes:</strong>
          <ul>
            ${value.map(cause => `<li>${cause}</li>`).join('')}
          </ul>
        </li>`;
      } else {
        html += `<li><strong>${key}:</strong> ${value}</li>`;
      }
    });
    
    // Add suggested solutions based on the error
    html += `</ul>
      <h3>Suggested Solutions:</h3>
      <ol>`;
    
    if (info.error && info.error.includes('Failed to fetch')) {
      html += `
        <li>Make sure your API server is running at <code>${this.apiUrl}</code></li>
        <li>Check the server's CORS configuration by adding these headers:
          <pre>
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type
          </pre>
        </li>
        <li>Try opening your API endpoint directly in the browser: <a href="${this.apiUrl}" target="_blank">${this.apiUrl}</a></li>
        <li>Check if your API server is listening on the correct port (3000)</li>
      `;
    } else if (info.status && info.status >= 400) {
      html += `
        <li>Fix the server error (HTTP ${info.status})</li>
        <li>Check server logs for more information</li>
        <li>Verify your API endpoint is correct: ${this.apiUrl}</li>
      `;
    } else if (info.error && info.error.includes('JSON')) {
      html += `
        <li>Make sure your API is returning valid JSON</li>
        <li>Check the Content-Type header is set to application/json</li>
      `;
    }
    
    html += `
        <li>Verify network connectivity between client and server</li>
      </ol>
    </div>`;
    
    this.updateResult(html);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const checker = new ServerChecker();
  checker.init('server-status', 'server-result');
  
  // Add click handler for manual check
  const checkBtn = document.getElementById('check-server');
  if (checkBtn) {
    checkBtn.addEventListener('click', () => checker.checkServer());
  }
});
