import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

document.documentElement.dataset.appVersion = __APP_VERSION__;

createRoot(document.getElementById('root')!).render(<App />);
