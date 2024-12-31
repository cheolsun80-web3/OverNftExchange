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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {nfts.map((nft) => (
        <Link
          key={nft.address}
          to={`/nft/${nft.address}`}
          className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
        >
          <img
            src={nft.image}
            alt={nft.name}
            className="w-full h-48 object-cover"
          />
          <div className="p-4">
            <h2 className="text-xl font-semibold text-gray-800">{nft.name}</h2>
            <p className="text-sm text-gray-500 mt-1">{nft.address}</p>
          </div>
        </Link>
      ))}
    </div>
  );
};
