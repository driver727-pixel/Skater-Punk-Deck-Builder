import { Component, ReactNode, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { TierProvider } from "./context/TierContext";
import { Nav } from "./components/Nav";
import { ProtectedRoute } from "./components/ProtectedRoute";

const CardForge  = lazy(() => import("./pages/CardForge").then(m => ({ default: m.CardForge })));
const Collection = lazy(() => import("./pages/Collection").then(m => ({ default: m.Collection })));
const DeckBuilder = lazy(() => import("./pages/DeckBuilder").then(m => ({ default: m.DeckBuilder })));
const EditCard   = lazy(() => import("./pages/EditCard").then(m => ({ default: m.EditCard })));
const Trades     = lazy(() => import("./pages/Trades").then(m => ({ default: m.Trades })));
const Login      = lazy(() => import("./pages/Login").then(m => ({ default: m.Login })));

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
      <AuthProvider>
        <TierProvider>
          <ErrorBoundary>
            <div className="app">
              <Nav />
              <main className="main">
                <Suspense fallback={<div className="page-loading">Loading…</div>}>
                  <Routes>
                    <Route path="/" element={<CardForge />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/collection" element={
                      <ProtectedRoute><Collection /></ProtectedRoute>
                    } />
                    <Route path="/decks" element={
                      <ProtectedRoute><DeckBuilder /></ProtectedRoute>
                    } />
                    <Route path="/edit/:cardId" element={
                      <ProtectedRoute><EditCard /></ProtectedRoute>
                    } />
                    <Route path="/trades" element={
                      <ProtectedRoute><Trades /></ProtectedRoute>
                    } />
                  </Routes>
                </Suspense>
              </main>
            </div>
          </ErrorBoundary>
        </TierProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
