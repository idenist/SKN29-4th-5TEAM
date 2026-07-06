import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/reset.css';
import './styles/tokens.css';
import './styles/global.css';
import './styles/components.css';
import './styles/layout.css';
import './styles/home.css';
import './styles/policy.css';
import './styles/chat.css';
import './styles/auth.css';
import './styles/community.css';
import './styles/mypage.css';
import './styles/notification.css';
import './styles/media.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
