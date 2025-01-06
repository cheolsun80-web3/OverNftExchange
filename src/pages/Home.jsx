// src/pages/Home.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { env } from "../env";

export const Home = () => {
  const [nfts, setNfts] = useState([]);

  useEffect(() => {
    // 임시 데이터
    const mockNFTs = env.NFTs;
    setNfts(mockNFTs);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {nfts.map((nft) => (
          <Link
            key={nft.address}
            to={`/nft/${nft.address}`}
            className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100"
          >
            <div className="aspect-w-16 aspect-h-9 overflow-hidden rounded-t-lg">
              <img
                src={nft.image}
                alt={nft.name}
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-200"
              />
            </div>
            <div className="p-6">
              <h2 className="text-xl font-medium text-gray-900 group-hover:text-gray-700">
                {nft.name}
              </h2>
              <p className="mt-2 text-sm text-gray-500 font-mono">
                {nft.address}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
