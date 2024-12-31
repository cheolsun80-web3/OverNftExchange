// src/components/Layout.jsx
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Link } from "react-router-dom";

export const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-gray-800">
            ONE - OverNftExchange
          </Link>
          <ConnectButton
            accountStatus="address"
            showBalance="false"
            label="Connect"
          />
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
};
