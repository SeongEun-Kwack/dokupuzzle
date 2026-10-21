import {createRoot} from 'react-dom/client';
import { CrosswordGame } from './components/CrosswordGame';
import './index.css';

createRoot(document.getElementById('root')!).render(<CrosswordGame />);
