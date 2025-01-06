// src/pages/NFTCollection.jsx
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  usePublicClient,
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther, formatEther } from "viem";
import { env } from "../env";
import { abi } from "../utils/abi";
import { lang } from "../utils/lang";
export const NFTCollection = () => {
  const { address } = useParams();
  const { address: wallet, isConnected } = useAccount();
  const [balance, setBalance] = useState(0);
  const [balanceWOVER, setBalanceWOVER] = useState(0);
  const [asks, setAsks] = useState([]);
  const [bids, setBids] = useState([]);
  const [bidPrice, setBidPrice] = useState(0);
  const [topBid, setTopBid] = useState({ bidder: "", price: 0 });
  const [history, setHistory] = useState([]);
  const [myNfts, setMyNfts] = useState([]);
  const [selectedTab, setSelectedTab] = useState("sell");
  const [showMyNftsModal, setShowMyNftsModal] = useState(false); // 모달 상태
  const [sellType, setSellType] = useState("ASK");
  const [showBidModal, setShowBidModal] = useState(false); // 모달 상태
  const [update, setUpdate] = useState(0);
  const [updateBalance, setUpdateBalance] = useState(0);
  const navigate = useNavigate();
  const publicClient = usePublicClient();
  const { writeContractAsync, isPending } = useWriteContract();
  const [isWaiting, setIsWaiting] = useState(false);

  const [langCode, setLangCode] = useState("en");
  const [hash, setHash] = useState(null);
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });
  const [sortType, setSortType] = useState("priceAsc");
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (isPending || isWaiting) {
      console.log("isPending or isWaiting");
      console.log("hash:", hash);
    } else {
      console.log("isConfirmed");
      console.log("isConfirmed:", isConfirmed);
      console.log("hash:", hash);
    }
  }, [isPending, isWaiting, isConfirmed]);

  // get lang from browser
  useEffect(() => {
    const lang = navigator.language.split("-")[0];
    if (["en", "ko"].includes(lang)) {
      setLangCode(lang);
    }
  }, []);

  // 페이지 로드 시 잘못된 NFT 주소면 홈으로 이동
  useEffect(() => {
    const NFTs = env.NFTs.map((nft) => nft.address);
    if (!NFTs.includes(address)) {
      navigate("/");
    }
  }, [address, navigate]);

  // 지갑이 연결된 경우, 사용자가 보유 중인 NFT 목록 불러오기
  useEffect(() => {
    if (!isConnected) return;
    (async () => {
      try {
        const nfts = await fetch(`https://scan.over.network/api/v2/tokens/${address}/instances?holder_address_hash=${wallet}`).then((r) => r.json());

        const items = [];
        for (const item of nfts.items || []) {
          items.push({
            tokenId: item.id,
            imageUrl: item.image_url,
          });
        }
        setMyNfts(items);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [address, wallet, isConnected, update]);

  // 실제 컨트랙트에서 getActiveAsks 불러오기 (예시)
  useEffect(() => {
    (async () => {
      try {
        const data = await publicClient.readContract({
          address: env.contracts.NFTExchange,
          abi: abi.NFTExchange,
          functionName: "getActiveAsks",
          args: [address],
        });
        console.log("Active Asks:", data);
        const items = [];
        for (const item of data || []) {
          items.push({
            tokenId: Number(item.idx),
            price: formatEther(item.price),
            seller: item.seller,
            expiration: Number(item.expiration),
          });
        }

        if (items.length == 0) {
          setAsks([]);
          return;
        }

        for (let i = 0; i < items.length; i++) {
          let item = items[i];
          items[i].imageUrl = env.NFTs[0].imageUrl(item.tokenId);
        }

        const sortedItems = [...items].sort((a, b) => {
          switch (sortType) {
            case "priceAsc":
              return Number(a.price) - Number(b.price);
            case "priceDesc":
              return Number(b.price) - Number(a.price);
            case "timeAsc":
              return Number(a.expiration) - Number(b.expiration);
            case "timeDesc":
              return Number(b.expiration) - Number(a.expiration);
            default:
              return Number(a.price) - Number(b.price);
          }
        });

        setAsks(sortedItems);
        console.log("Asks:", sortedItems);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [address, publicClient, update, sortType]);
  useEffect(() => {
    (async () => {
      try {
        // function getBids(IERC721 nft) public view returns (BidLib.Bid[] memory) {
        // struct Bidder { address bidder; uint256 nonce; } struct Bid { Bidder bidder; uint256 price; }
        const getTopBid = await publicClient.readContract({
          address: env.contracts.NFTExchange,
          abi: abi.NFTExchange,
          functionName: "getTopBid",
          args: [address],
        });

        setTopBid({
          bidder: getTopBid.bidder.bidder,
          price: formatEther(getTopBid.price),
        });
        console.log("getTopBid:", topBid);
        console.log("getTopBid:", getTopBid);
        const data = await publicClient.readContract({
          address: env.contracts.NFTExchange,
          abi: abi.NFTExchange,
          functionName: "getBids",
          args: [address],
        });

        const items = [];
        for (const item of data || []) {
          items.push({
            bidder: item.bidder.bidder,
            nonce: item.bidder.nonce,
            price: formatEther(item.price),
          });
        }

        // sort by price
        items.sort((a, b) => {
          return b.price - a.price;
        });
        setBids(items);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [address, publicClient, update]);
  useEffect(() => {
    (async () => {
      try {
        const data = await publicClient.readContract({
          address: env.contracts.NFTExchange,
          abi: abi.NFTExchange,
          functionName: "getTradeHistoryLast",
          args: [address, 100],
        });
        console.log("Trade History:", data);
        /*
                struct TradeInfo {
                    uint256 tokenId;
                    address seller;
                    address buyer;
                    uint256 price;
                    uint256 bn;
                }
            */
        const items = [];
        for (const item of data || []) {
          items.push({
            tokenId: Number(item.tokenId),
            seller: item.seller,
            buyer: item.buyer,
            price: formatEther(item.price),
            bn: Number(item.bn),
          });
        }
        setHistory(items);
        console.log("History:", items);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [address, publicClient, update]);

  useEffect(() => {
    (async () => {
      try {
        const balance = await publicClient.getBalance({ address: wallet });
        let balanceOver = formatEther(balance);
        // float point 4
        balanceOver = parseFloat(balanceOver).toFixed(4);
        setBalance(balanceOver);

        const balanceWOVER = await publicClient.readContract({
          address: env.contracts.WETH,
          abi: abi.WETH,
          functionName: "balanceOf",
          args: [wallet],
        });
        let balanceWOVEROver = formatEther(balanceWOVER);
        balanceWOVEROver = parseFloat(balanceWOVEROver).toFixed(4);
        console.log("balanceWOVEROver:", balanceWOVEROver);
        setBalanceWOVER(balanceWOVEROver);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [address, publicClient, update, updateBalance]);

  // setInterval update balance over
  useEffect(() => {
    const interval = setInterval(() => {
      setUpdateBalance(updateBalance + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [updateBalance]);

  const tryWriteContractAsync = async (...args) => {
    try {
      return await writeContractAsync(...args);
    } catch (err) {
      alert(err.message);
      return false;
    }
  }

  const checkApprovalInner = async (tokenId) => {
    const getApproved = await publicClient.readContract({
      address: address,
      abi: abi.ERC721,
      functionName: "getApproved",
      args: [tokenId],
    });
    console.log("getApproved:", getApproved);

    if (getApproved != env.contracts.NFTExchange) {
      alert(lang[langCode].errors.approve);
      var txhash = await tryWriteContractAsync({
        address: address,
        abi: abi.ERC721,
        functionName: "approve",
        args: [env.contracts.NFTExchange, tokenId],
      });
      console.log("approve:", txhash);
      setHash(txhash);
      return false;
    }
    return true;
  };
  const checkApproval = async (tokenId) => {
    if (await checkApprovalInner(tokenId)) return;
    // wait for isConfirming
    while (isPending || isConfirming) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("waiting for isConfirming", isConfirming);
    }
    await new Promise((resolve) => setTimeout(resolve, 6000));
    // check again
    await checkApproval(tokenId);
  };
  // NFT를 선택했을 때 (예: 판매 트랜잭션 실행 등)
  const handleSelectNft = async (tokenId) => {
    setIsWaiting(true);
    await checkApproval(tokenId);
    var txhash;

    if (sellType === "ASK") {
      const price = prompt(lang[langCode].prompts.askPrice, "1");
      if (isNaN(price) || Number(price) < 1 || Number(price) > 999999999) {
        setIsWaiting(false);
        return alert(lang[langCode].errors.number);
      }
      const confirmed = confirm(
        lang[langCode].prompts.askConfirm.replace("%s", tokenId).replace("%s", price)
      );
      if (!confirmed) {
        setIsWaiting(false);
        return;
      }

      // function addAsk(IERC721 nft, uint256 tokenId, uint256 price)
      txhash = await tryWriteContractAsync({
        address: env.contracts.NFTExchange,
        abi: abi.NFTExchange,
        functionName: "addAsk",
        args: [address, tokenId, parseEther(price)],
      });
      setHash(txhash);
      console.log("addAsk:", txhash);
    } else if (sellType === "BID") {
      const confirmed = confirm(
        lang[langCode].prompts.bidConfirm.replace("%s", tokenId).replace("%s", topBid.price)
      );
      if (!confirmed) {
        setIsWaiting(false);
        return;
      }
      // function acceptBid(IERC721 nft, uint256 tokenId, uint256 minPrice)
      txhash = await tryWriteContractAsync({
        address: env.contracts.NFTExchange,
        abi: abi.NFTExchange,
        functionName: "acceptBid",
        args: [address, tokenId, parseEther(topBid.price)],
      });
      setHash(txhash);
      console.log("acceptBid:", txhash);
    }
    while (isPending || isConfirming) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("waiting for isConfirming", isConfirming);
    }
    await new Promise((resolve) => setTimeout(resolve, 6000));
    setIsWaiting(false);
    setUpdate(update + 1);
    setShowMyNftsModal(false);
  };
  const handleBid = async (price) => {
    if (isNaN(price) || Number(price) < 1 || Number(price) > 999999999)
      return alert(lang[langCode].errors.number);
    if (price <= topBid.price)
      return alert(lang[langCode].prompts.topBid);
    setIsWaiting(true);
    const confirmed = confirm(lang[langCode].prompts.bidConfirmBuy.replace("%s", price));
    if (!confirmed) {
      setIsWaiting(false);
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 6000));
    // function addBid(IERC721 nft, uint256 price) public payable {
    var txhash = await tryWriteContractAsync({
      address: env.contracts.NFTExchange,
      abi: abi.NFTExchange,
      functionName: "addBid",
      args: [address, parseEther(price)],
      value: parseEther(price),
    });
    setHash(txhash);
    console.log("addBid:", txhash);
    while (isPending || isConfirming) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("waiting for isConfirming", isConfirming);
    }
    await new Promise((resolve) => setTimeout(resolve, 6000));
    setIsWaiting(false);
    setUpdate(update + 1);
    setShowBidModal(false);
  };

  const handleBuy = async (item) => {
    const confirmed = confirm(
      lang[langCode].prompts.bidConfirm.replace("%s", item.tokenId).replace("%s", item.price)
    );
    if (!confirmed) return;

    // function acceptAsk(IERC721 nft, uint256 tokenId, uint256 price) public payable {
    var txhash = await tryWriteContractAsync({
      address: env.contracts.NFTExchange,
      abi: abi.NFTExchange,
      functionName: "acceptAsk",
      args: [address, item.tokenId, parseEther(item.price)],
      value: parseEther(item.price),
    });
    setHash(txhash);
    console.log("buy:", txhash);
    while (isPending || isConfirming) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("waiting for isConfirming", isConfirming);
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setUpdate(update + 1);
  };

  const handleCancel = async (item) => {
    const confirmed = confirm(
      lang[langCode].prompts.askCancel.replace("%s", item.tokenId)
    );
    if (!confirmed) return;

    // function removeAsk(IERC721 nft, uint256 tokenId)
    var txhash = await tryWriteContractAsync({
      address: env.contracts.NFTExchange,
      abi: abi.NFTExchange,
      functionName: "removeAsk",
      args: [address, item.tokenId],
    });
    setHash(txhash);
    console.log("cancel:", txhash);
    while (isPending || isConfirming) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("waiting for isConfirming", isConfirming);
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setUpdate(update + 1);
  };

  const handleWithdrawWOVER = async () => {
    const confirmed = confirm(lang[langCode].prompts.withdrawWOVER);
    if (!confirmed) return;

    var txhash = await tryWriteContractAsync({
      address: env.contracts.WETH,
      abi: abi.WETH,
      functionName: "withdraw",
      args: [parseEther(balanceWOVER)],
    });
    setHash(txhash);
    console.log("withdrawWOVER:", txhash);
    while (isPending || isConfirming) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("waiting for isConfirming", isConfirming);
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setUpdate(update + 1);
  }

  const handleCancelBid = async (item) => {
    const confirmed = confirm(
      lang[langCode].prompts.bidCancel.replace("%s", item.price)
    );
    if (!confirmed) return;

    // function removeAsk(IERC721 nft, uint256 tokenId)
    var txhash = await tryWriteContractAsync({
      address: env.contracts.NFTExchange,
      abi: abi.NFTExchange,
      functionName: "removeBid",
      args: [address, item.nonce],
    });
    setHash(txhash);
    console.log("cancel:", txhash);
    while (isPending || isConfirming) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("waiting for isConfirming", isConfirming);
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setUpdate(update + 1);
  };

  // Add notification when hash is set
  useEffect(() => {
    if (hash) {
      const newNotification = {
        id: Date.now(),
        hash,
        timestamp: new Date(),
      };
      
      setNotifications(prev => [...prev, newNotification]);

      // Remove notification after 30 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
      }, 30000);
    }
  }, [hash]);

  return (
    <div className="space-y-8">
      {/* 상단 탭 버튼 */}
      <div className="flex gap-x-4 border-b border-gray-200 mb-4">
        <button
          className={`py-2 px-4 ${
            selectedTab === "sell"
              ? "border-b-2 border-blue-500 font-semibold"
              : "text-gray-500"
          }`}
          onClick={() => setSelectedTab("sell")}
        >
          Sell Orders
        </button>
        <button
          className={`py-2 px-4 ${
            selectedTab === "buy"
              ? "border-b-2 border-blue-500 font-semibold"
              : "text-gray-500"
          }`}
          onClick={() => setSelectedTab("buy")}
        >
          Buy Orders
        </button>
        <button
          className={`py-2 px-4 ${
            selectedTab === "history"
              ? "border-b-2 border-blue-500 font-semibold"
              : "text-gray-500"
          }`}
          onClick={() => setSelectedTab("history")}
        >
          Trade History
        </button>
      </div>
      <h3 className="text-3xl font-bold text-gray-800">
        NFT Address:{" "}
        <a
          href={`https://scan.over.network/token/${address}`}
          target="_blank"
          rel="noreferrer"
        >
          {address.slice(0, 8)}...{address.slice(-8)}
        </a>
      </h3>
      {isConnected && (
        <div>
          <h3 className="text-xl font-semibold text-gray-800">
            Connected Wallet:
            <a
              href={`https://scan.over.network/address/${wallet}`}
              target="_blank"
              rel="noreferrer"
            >
              {wallet.slice(0, 8)}...{wallet.slice(-8)}
            </a>
          </h3>
          <h3 className="text-xl font-semibold text-gray-800">
            Balance: {balance} OVER
          </h3>
          <h3 className="text-xl font-semibold text-gray-800">
            Balance (WOVER): {balanceWOVER} WOVER
            {balanceWOVER > 0.1 && (
              <button className="bg-blue-500 hover:bg-blue-600 text-white mx-3 py-2 px-4 rounded" 
                onClick={() => handleWithdrawWOVER()}
              >
                WOVER to OVER (withdraw)
              </button>
            )}
          </h3>
          {/* if balanceWOVER > 0.1 withdraw WOVER button*/}
        </div>
      )}

      {/* "Sell My Item" 버튼 */}
      {selectedTab === "sell" && (
        <div className="mb-4">
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
            onClick={() => {
              setSellType("ASK");
              setShowMyNftsModal(true);
            }}
            disabled={!isConnected}
          >
            Sell My Item
          </button>
          {!isConnected && (
            <p className="text-sm text-red-500 mt-2">{lang[langCode].errors.wallet}</p>
          )}
        </div>
      )}
      {/* "Buy Request" 버튼 */}
      {selectedTab === "buy" && (
        <div className="mb-4">
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
            onClick={() => setShowBidModal(true)}
            disabled={!isConnected}
          >
            Make Bid (BuyOrder)
          </button>
          {!isConnected && (
            <p className="text-sm text-red-500 mt-2">{lang[langCode].errors.wallet}</p>
          )}
          <button
            className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded ml-4"
            onClick={() => {
              setSellType("BID");
              setShowMyNftsModal(true);
            }}
            disabled={!isConnected}
          >
            Sell My Item to Top Bidder
          </button>
          {!isConnected && (
            <p className="text-sm text-red-500 mt-2">{lang[langCode].errors.wallet}</p>
          )}
        </div>
      )}

      {/* Sell Orders 탭: 카드(액자) 레이아웃 */}
      {selectedTab === "sell" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Sell Orders</h2>
            <select
              className="border rounded-md px-3 py-1"
              value={sortType}
              onChange={(e) => setSortType(e.target.value)}
            >
              <option value="priceAsc">priceAsc</option>
              <option value="priceDesc">priceDesc</option>
              <option value="timeAsc">timeAsc</option>
              <option value="timeDesc">timeDesc</option>
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {asks.map((ask) => (
              <div
                key={ask.tokenId}
                className="bg-white rounded-lg shadow overflow-hidden"
              >
                <img
                  src={ask.imageUrl}
                  alt={`Token ${ask.tokenId}`}
                  className="w-full h-64 object-cover"
                />
                <div className="p-4">
                  <h3 className="text-lg font-bold mb-1">
                    Token ID: {ask.tokenId}
                  </h3>
                  <p className="text-gray-700 mb-1">Price: {ask.price} OVER</p>
                  <p className="text-gray-700 mb-1">
                    Seller:{" "}
                    <a
                      href={`https://scan.over.network/address/${ask.seller}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {ask.seller.slice(0, 8)}...{ask.seller.slice(-8)}
                    </a>
                  </p>
                  <p className="text-gray-700">
                    Expiration:{" "}
                    {new Date(
                      Number(ask.expiration) * 1000
                    ).toLocaleDateString()}
                  </p>
                  {/* if ask owner */}
                  {wallet === ask.seller && (
                    <button
                      className="mt-2 bg-blue-500 hover:bg-blue-600 text-white py-1 px-4 rounded"
                      onClick={() => handleCancel(ask)}
                    >
                      Remove Ask
                    </button>
                  )}
                  {/* if not ask owner */}
                  {wallet !== ask.seller && (
                    <button
                      className="mt-2 bg-blue-500 hover:bg-blue-600 text-white py-1 px-4 rounded"
                      onClick={() => handleBuy(ask)}
                    >
                      Buy
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* isPending이 true일 때 로딩 표시 */}
      {(isPending || isConfirming || isWaiting) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-700 bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <p className="text-lg font-semibold">Processing...</p>
            <p className="text-sm text-gray-500">
              Status: {isPending ? "Pending" : "Confirming"}
            </p>
            {/* isConfirming */}
            {isConfirming && (
              <div className="mt-4">
                <p className="text-sm text-gray-500">
                  Tx Hash:{" "}
                  <a
                    href={`https://scan.over.network/tx/${hash}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {hash.slice(0, 8)}...{hash.slice(-8)}
                  </a>
                </p>
                <p className="text-sm text-gray-500">
                  Explorer:{" "}
                  <a
                    href={`https://scan.over.network/tx/${hash}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View on OverScan
                  </a>
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Buy Orders 탭: 테이블 레이아웃 */}
      {selectedTab === "buy" && (
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Buy Orders</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Bidder
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Price (OVER)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Cancel
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {bids.map((bid, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4">
                      <a
                        href={`https://scan.over.network/address/${bid.bidder}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {bid.bidder.slice(0, 8)}...{bid.bidder.slice(-8)}
                      </a>
                    </td>
                    <td className="px-6 py-4">{bid.price} OVER</td>
                    <td className="px-6 py-4">
                      {" "}
                      {bid.bidder === wallet && (
                        <button
                          className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-4 rounded"
                          onClick={() => handleCancelBid(bid)}
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Trade History  탭: 테이블 레이아웃 */}
      {selectedTab === "history" && (
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Buy Orders</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Block
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      TokenId
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Seller
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Buyer
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Price (OVER)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {history.map((trade, index) => (
                    <tr key={index}>
                      <td className="px-3 py-2">
                        <a
                          href={`https://scan.over.network/block/${trade.bn}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-2"
                        >
                          {trade.bn}
                        </a>
                      </td>
                      <td className="px-3 py-2">
                        <a
                          href={`https://scan.over.network/token/${address}/instance/${trade.tokenId}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {trade.tokenId}
                        </a>
                      </td>
                      <td className="px-3 py-2">
                        <a
                          href={`https://scan.over.network/address/${trade.seller}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {trade.seller.slice(0, 8)}...{trade.seller.slice(-8)}
                        </a>
                      </td>
                      <td className="px-3 py-2">
                        <a
                          href={`https://scan.over.network/address/${trade.buyer}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {trade.buyer.slice(0, 8)}...{trade.buyer.slice(-8)}
                        </a>
                      </td>
                      <td className="px-3 py-2">{trade.price} OVER</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MyNfts 모달 (사용자 보유 NFT 목록) */}
      {showMyNftsModal && (
        <div
          className="fixed inset-0 z-20 flex items-center justify-center bg-gray-700 bg-opacity-50"
          onClick={() => setShowMyNftsModal(false)}
        >
          <div
            // 높이를 최대 80vh로 제한하고, 넘치는 내용은 스크롤
            className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 콘텐츠 시작 */}
            {sellType === "ASK" && (
              <div>
                <h2 className="text-xl font-semibold mb-4">
                  Select NFT to Sell (ask type)
                </h2>
                <p className="text-gray-600 mb-5">
                  You can sell your NFTs by setting a price.
                </p>
              </div>
            )}
            {sellType === "BID" && (
              <div>
                <h2 className="text-xl font-semibold mb-4">
                  Select NFT to Bid (bid type)
                </h2>
                <p className="text-gray-600">
                  You can sell your NFTs to top bidder price.
                </p>
                <p className="text-gray-600">
                  Top Bidder:{" "}
                  <a
                    href={`https://scan.over.network/address/${topBid.bidder}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {topBid.bidder.slice(0, 8)}...{topBid.bidder.slice(-8)}
                  </a>
                </p>
                {/* show price text to bold */}
                <p className="text-gray-600 mb-5">
                  Top Price:{" "}
                  <span className="font-bold">{topBid.price} OVER</span>
                </p>
              </div>
            )}
            {myNfts.length === 0 ? (
              <p className="text-gray-600">No NFTs found in your wallet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {myNfts.map((nft) => (
                  <div
                    key={nft.tokenId}
                    className="bg-white border rounded-lg overflow-hidden shadow"
                  >
                    <img
                      src={nft.imageUrl}
                      alt={`Token ${nft.tokenId}`}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-3">
                      <p className="font-bold">Token ID: {nft.tokenId}</p>
                      <button
                        className="mt-2 bg-blue-500 hover:bg-blue-600 text-white py-1 px-4 rounded"
                        onClick={() => handleSelectNft(nft.tokenId)}
                      >
                        Sell This NFT
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              className="mt-4 bg-gray-300 hover:bg-gray-400 text-gray-800 py-1 px-4 rounded"
              onClick={() => setShowMyNftsModal(false)}
            >
              Close
            </button>
            {/* 모달 콘텐츠 끝 */}
          </div>
        </div>
      )}

      {/* MyNfts 모달 (사용자 보유 NFT 목록) */}
      {showBidModal && (
        <div
          className="fixed inset-0 z-20 flex items-center justify-center bg-gray-700 bg-opacity-50"
          onClick={() => setShowBidModal(false)}
        >
          <div
            // 높이를 최대 80vh로 제한하고, 넘치는 내용은 스크롤
            className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 콘텐츠 시작 */}
            {/* show top bid info */}
            <h2 className="text-xl font-semibold mb-4">Top Bid</h2>
            <div className="bg-white border rounded-lg overflow-hidden shadow mb-4">
              <div className="p-3">
                <p className="font-bold">
                  Bidder:{" "}
                  <a
                    href={`https://scan.over.network/address/${topBid.bidder}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {topBid.bidder.slice(0, 8)}...{topBid.bidder.slice(-8)}
                  </a>
                </p>
                <p className="font-bold">Price: {topBid.price} OVER</p>
              </div>
            </div>
            <h2 className="text-xl font-semibold mb-4">Make Bid (BuyOrder)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* price input & ok button */}
              <div className="bg-white border rounded-lg overflow-hidden shadow">
                <div className="p-3">
                  <input
                    type="number"
                    id="price"
                    name="price"
                    min="1"
                    max="999999999"
                    placeholder="must over than top bid price"
                    className="w-full h-10 border border-gray-300 rounded px-3"
                    onChange={(e) => setBidPrice(e.target.value)}
                  />
                  <button
                    className="mt-2 bg-blue-500 hover:bg-blue-600 text-white py-1 px-4 rounded"
                    onClick={() => {
                      handleBid(bidPrice);
                    }}
                  >
                    Bid
                  </button>
                </div>
              </div>
            </div>
            <button
              className="mt-4 bg-gray-300 hover:bg-gray-400 text-gray-800 py-1 px-4 rounded"
              onClick={() => setShowBidModal(false)}
            >
              Close
            </button>

            {/* 모달 콘텐츠 끝 */}
          </div>
        </div>
      )}

      {/* Transaction Notifications */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className="bg-white rounded-lg shadow-lg p-4 border border-gray-200 animate-fade-in"
          >
            <p className="text-sm text-gray-600">New Transaction:</p>
            <a
              href={`https://scan.over.network/tx/${notification.hash}`}
              target="_blank"
              rel="noreferrer"
              className="text-blue-500 hover:text-blue-600"
            >
              {notification.hash.slice(0, 8)}...{notification.hash.slice(-8)}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};
