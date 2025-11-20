import apiConfig from './apiConfig.js';

class FileSessionManager {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.tempFiles = new Set();
  }

  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(apiConfig.getApiUrl('/upload'), {
      method: 'POST',
      headers: {
        'X-Session-Id': this.sessionId
      },
      body: formData
    });

    if (response.ok) {
      const data = await response.json();
      this.tempFiles.add(data.fileName);
      return data;
    } else {
      throw new Error('Erro no upload: ' + response.statusText);
    }
  }

  async confirmFile(fileName) {
    try {
      await fetch(apiConfig.getApiUrl('/confirm-file'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fileName })
      });
      this.tempFiles.delete(fileName);
    } catch (error) {
      console.error('Erro ao confirmar arquivo:', error);
    }
  }

  async cleanupSession() {
    try {
      await fetch(apiConfig.getApiUrl('/cleanup-session'), {
        method: 'DELETE',
        headers: {
          'X-Session-Id': this.sessionId
        }
      });
      this.tempFiles.clear();
    } catch (error) {
      console.error('Erro ao limpar sessão:', error);
    }
  }

  async deleteFile(fileName) {
    try {
      await fetch(apiConfig.getApiUrl('/delete-file'), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fileName })
      });
      this.tempFiles.delete(fileName);
    } catch (error) {
      console.error('Erro ao deletar arquivo:', error);
    }
  }

  resetSession() {
    this.sessionId = this.generateSessionId();
    this.tempFiles.clear();
  }
}

export default FileSessionManager;