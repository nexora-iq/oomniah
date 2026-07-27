import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import DisableDevtool from 'disable-devtool';

// 🛡️ تفعيل الحماية الشاملة لكل الموقع
DisableDevtool({
  ondevtoolopen: () => {
    // بمجرد فتح الانسبكت، يمسح الشاشة ويحوله لصفحة فارغة فوراً
    document.body.innerHTML = '';
    window.location.replace('about:blank');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)