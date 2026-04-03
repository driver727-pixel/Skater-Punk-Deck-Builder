import { Component, ReactNode } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TierProvider } from "./context/TierContext";
import { Nav } from "./components/Nav";
import { CardForge } from "./pages/CardForge";
import { Collection } from "./pages/Collection";
import { DeckBuilder } from "./pages/DeckBuilder";

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "2rem", textAlign: "center", color: "#ff4466" }}>
          <h2>Something went wrong.</h2>
          <p>Please refresh the page and try again.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <BrowserRouter>
      <TierProvider>
        <ErrorBoundary>
          <div className="app">
            <Nav />
            <main className="main">
              <Routes>
                <Route path="/" element={<CardForge />} />
                <Route path="/collection" element={<Collection />} />
                <Route path="/decks" element={<DeckBuilder />} />
              </Routes>
            </main>
          </div>
        </ErrorBoundary>
      </TierProvider>
    </BrowserRouter>
  );
}

export default App;
