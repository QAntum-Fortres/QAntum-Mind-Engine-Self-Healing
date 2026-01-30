import { SovereignHUD } from './components/SovereignHUD';
import "./App.css";

function App() {
  return (
    <div className="w-screen h-screen bg-black overflow-hidden selection:bg-cyan-500/30">
      <SovereignHUD />
    </div>
  );
}

export default App;
