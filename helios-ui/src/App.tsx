import { HeliosUI } from './HeliosUI';
import SovereignShell from './components/SovereignShell';
import './App.css';

function App() {
  return (
    <SovereignShell>
      {/* Existing HeliosUI Application mounted inside the new Window Shell */}
      <HeliosUI />
    </SovereignShell>
  );
}

export default App;
