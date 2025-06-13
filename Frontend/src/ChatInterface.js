import React, { useState, useEffect, useRef } from 'react';
import { FaCopy, FaLightbulb, FaTools, FaPaperPlane, FaTrash, FaMoon, FaSun, FaHistory } from 'react-icons/fa';
import { QRCodeSVG } from 'qrcode.react';
import ThinkTankLogo from './thinktank-logo.png';
import './ChatInterface.css';

function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  });
  const [chatHistory, setChatHistory] = useState(() => {
    const savedHistory = localStorage.getItem('chatHistory');
    return savedHistory ? JSON.parse(savedHistory) : [];
  });
  const [showHistory, setShowHistory] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });
  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  });
  const [loginError, setLoginError] = useState('');
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
  }, [chatHistory]);

  useEffect(() => {
    localStorage.setItem('isLoggedIn', isLoggedIn);
  }, [isLoggedIn]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginData.username === 'Group8@uwc.ac.za' && loginData.password === 'Thinktank123') {
      setIsLoggedIn(true);
      setLoginError('');
    } else {
      setLoginError('Invalid username or password');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setLoginData({ username: '', password: '' });
  };

  const formatBotResponse = (text) => {
    const noHashtags = text.replace(/^#+.*$/gm, '');
    const withSteps = noHashtags.replace(
      /(\d+\.\d+\.)\s+(.*?)(\n|$)/g, 
      '<div class="step-header"><span class="step-number">$1</span><span class="step-title">$2</span></div>'
    );

    const withLinks = withSteps.replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    return withLinks
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/-\s+(.*?)(\n|$)/g, '<li>$1</li>')
      .replace(/\n\n/g, '</div><div class="response-block">')
      .replace(/^\s*[\r\n]/gm, '');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  const saveToHistory = (userInput, botResponse) => {
    const newEntry = {
      timestamp: new Date().toISOString(),
      userInput,
      messages: [...messages, { text: userInput, sender: 'user' }, botResponse]
    };
    setChatHistory(prev => [newEntry, ...prev].slice(0, 20));
  };

  const loadChatFromHistory = (index) => {
    setMessages(chatHistory[index].messages);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = { text: inputValue, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5000/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: inputValue }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      const botMessage = { 
        text: data.answer, 
        sender: 'bot',
        type: data.answer.includes('How to') ? 'guide' : 
              data.answer.includes('Possible Causes') ? 'analysis' : 'solution'
      };
      setMessages(prev => [...prev, botMessage]);
      saveToHistory(inputValue, botMessage);
    } catch (err) {
      setError(err.message || 'Failed to get response from server');
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text.replace(/<[^>]*>?/gm, ''));
  };

  const clearChat = () => {
    setMessages([]);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  if (!isLoggedIn) {
    return (
      <div className={`login-container ${darkMode ? 'dark-mode' : ''}`}>
        <div className="login-box">
          <img src={ThinkTankLogo} alt="ThinkTank Logo" className="login-logo" />
          <h2 className="login-title">ThinkTank IT Support Login</h2>
          
          <form className="login-form" onSubmit={handleLogin}>
            <input
              type="text"
              className="login-input"
              placeholder="Username"
              value={loginData.username}
              onChange={(e) => setLoginData({...loginData, username: e.target.value})}
              required
            />
            <input
              type="password"
              className="login-input"
              placeholder="Password"
              value={loginData.password}
              onChange={(e) => setLoginData({...loginData, password: e.target.value})}
              required
            />
            {loginError && <div className="login-error">{loginError}</div>}
            <button type="submit" className="login-button">Login</button>
          </form>

          <div className="qr-section">
            <h3 className="qr-title">Mobile Login</h3>
            <div className="qr-code">
              <QRCodeSVG 
                value={`${window.location.origin}${window.location.pathname}`}
                size={128}
                level="H"
                includeMargin={true}
              />
            </div>
            <p className="qr-instruction">Scan this QR code with your phone to be able to login on your device.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`chat-app-container ${darkMode ? 'dark-mode' : ''}`}>
      <div className="chat-app">
        <header className="chat-header">
          <img src={ThinkTankLogo} alt="ThinkTank Logo" className="main-logo" />
          <h1>IT Support Assistant</h1>
          <div className="header-controls">
            <button className="theme-toggle-btn" onClick={toggleDarkMode}>
              {darkMode ? <FaSun /> : <FaMoon />}
            </button>
            <button className="clear-chat-btn" onClick={clearChat}>
              <FaTrash /> Clear Chat
            </button>
            <button className="chat-history-toggle" onClick={() => setShowHistory(!showHistory)}>
              <FaHistory className="history-icon" />
            </button>
            <button className="clear-chat-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
          {showHistory && (
            <div className={`chat-history ${showHistory ? 'show' : ''}`}>
              <div className="chat-history-header">
                Chat History
                <div>
                  <button onClick={() => setChatHistory([])} title="Clear all history">🗑️</button>
                  <button onClick={() => setShowHistory(false)}>×</button>
                </div>
              </div>
              {chatHistory.length > 0 ? (
                <>
                  {chatHistory.slice(0, 5).map((chat, index) => (
                    <div 
                      key={index} 
                      className="chat-history-item"
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <div 
                          style={{ flex: 1 }} 
                          onClick={() => {
                            loadChatFromHistory(index);
                            setShowHistory(false);
                          }}
                        >
                          <div className="chat-history-item-title">
                            {chat.userInput}
                          </div>
                          <div className="chat-history-item-time">
                            {new Date(chat.timestamp).toLocaleString('en-GB', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                        <button 
                          className="delete-history-item"
                          onClick={(e) => {
                            e.stopPropagation();
                            setChatHistory(prev => prev.filter((_, i) => i !== index));
                          }}
                          title="Delete this conversation"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                  {chatHistory.length > 5 && (
                    <div className="chat-history-dropdown" onClick={(e) => {
                      e.stopPropagation();
                      document.querySelector('.chat-history-dropdown-content').classList.toggle('show');
                    }}>
                      Show older conversations ({chatHistory.length - 5})
                      <div className="chat-history-dropdown-content">
                        {chatHistory.slice(5).map((chat, index) => (
                          <div 
                            key={index + 5} 
                            className="chat-history-item"
                            onClick={(e) => {
                              e.stopPropagation();
                              loadChatFromHistory(index + 5);
                              setShowHistory(false);
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                              <div style={{ flex: 1 }}>
                                <div className="chat-history-item-title">
                                  {chat.userInput}
                                </div>
                                <div className="chat-history-item-time">
                                  {new Date(chat.timestamp).toLocaleString('en-GB', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                              </div>
                              <button 
                                className="delete-history-item"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setChatHistory(prev => prev.filter((_, i) => i !== index + 5));
                                }}
                                title="Delete this conversation"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="chat-history-item">No history yet</div>
              )}
            </div>
          )}
        </header>

        <div className="messages-container" ref={messagesContainerRef}>
          {messages.length === 0 ? (
            <div className="welcome-screen">
              <img src={ThinkTankLogo} alt="ThinkTank Logo" className="welcome-logo" />
              <div className="welcome-text">
                <h2>ThinkTank IT Support Assistant</h2>
                <p>How can I help you today?</p>
              </div>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className={`message ${msg.sender} ${msg.type || ''}`}>
                {msg.sender === 'bot' && (
                  <div className="message-icon">
                    {msg.type === 'analysis' ? <FaLightbulb /> : 
                     msg.type === 'guide' ? <FaTools /> : <FaTools />}
                  </div>
                )}
                <div 
                  className="message-content"
                  dangerouslySetInnerHTML={{ __html: formatBotResponse(msg.text) }}
                />
                {msg.sender === 'bot' && (
                  <button 
                    className="copy-btn"
                    onClick={() => handleCopy(msg.text)}
                    title="Copy to clipboard"
                  >
                    <FaCopy />
                  </button>
                )}
              </div>
            ))
          )}

          {isLoading && (
            <div className="message bot">
              <div className="message-content typing">
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
              </div>
            </div>
          )}

          {error && (
            <div className="error-message">
              Error: {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="input-footer-container">
          <form onSubmit={handleSubmit} className="input-area">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your IT question here..."
              disabled={isLoading}
              rows={3}
            />
            <button type="submit" disabled={isLoading || !inputValue.trim()}>
              {isLoading ? (
                <div className="loading-spinner" />
              ) : (
                <FaPaperPlane className="send-icon" />
              )}
            </button>
          </form>

          <footer className="chat-footer">
            <div className="powered-by">
              <span>Powered by</span>
              <img src={ThinkTankLogo} alt="ThinkTank" className="powered-logo" />
            </div>
            <div className="footer-text">
              <span>© {new Date().getFullYear()} ThinkTank. All rights reserved.</span>
              <span>IT Support Portal v1.0</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default ChatInterface;
