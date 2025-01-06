// src/components/Layout.jsx
import { Header } from "./Header";
import { Footer } from "./Footer";

export const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8 flex-grow">{children}</main>
      <Footer />
    </div>
  );
};
