import React, { useState, useEffect } from 'react';

interface Bid {
  id: number;
  amount: number;
  quantity: number;
  timestamp: number;
  isValid: boolean;
  rank: number | null;
}

function App() {
  const [balance, setBalance] = useState(0);
  const [depositAmount, setDepositAmount] = useState('');
  const [currentPrice, setCurrentPrice] = useState(2000);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [auctionStarted, setAuctionStarted] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [bidQuantity, setBidQuantity] = useState(1);
  const [bids, setBids] = useState<Bid[]>([]);

  useEffect(() => {
    if (auctionStarted && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timer);
            endAuction();
            return 0;
          }
          return prevTime - 1;
        });
        updateRankings();
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [auctionStarted, timeLeft]);

  const handleDeposit = () => {
    const amount = Number(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('請輸入有效的金額');
      return;
    }
    setBalance((prev) => prev + amount);
    setDepositAmount('');
    if (!auctionStarted) {
      setAuctionStarted(true);
    }
  };

  const handleBid = () => {
    const amount = Number(bidAmount);
    const quantity = Number(bidQuantity);

    if (isNaN(amount) || amount < currentPrice) {
      alert(`出價必須大於或等於當前門檻價格 NT$${currentPrice}`);
      return;
    }

    if (amount * quantity > balance) {
      alert('餘額不足');
      return;
    }

    const validBidsQuantity = bids.filter(bid => bid.isValid).reduce((sum, bid) => sum + bid.quantity, 0);
    if (validBidsQuantity + quantity > 4) {
      alert('總購買張數不能超過4張');
      return;
    }

    const newBid: Bid = {
      id: Date.now(),
      amount,
      quantity,
      timestamp: Date.now(),
      isValid: true,
      rank: null,
    };

    setBids((prevBids) => [...prevBids, newBid]);
    setBalance((prev) => prev - amount * quantity);
    setBidAmount('');
    setBidQuantity(1);
    updateRankings();
  };

  const updateRankings = () => {
    const allBids = [...bids, ...generateRandomBids()];
    const sortedBids = allBids.sort((a, b) => b.amount - a.amount || a.timestamp - b.timestamp);
    const top100 = sortedBids.slice(0, 100);
    setCurrentPrice(top100[top100.length - 1]?.amount || currentPrice);

    const updatedBids = bids.map((bid) => {
      const rank = sortedBids.findIndex((b) => b.id === bid.id) + 1;
      if (rank > 100 && bid.isValid) {
        setBalance((prev) => prev + bid.amount * bid.quantity);
        return { ...bid, isValid: false, rank: null };
      }
      return { ...bid, rank: rank <= 100 ? rank : null, isValid: rank <= 100 };
    });

    setBids(updatedBids);
  };

  const generateRandomBids = (): Bid[] => {
    return Array.from({ length: 100 }, () => ({
      id: Math.random(),
      amount: Math.floor(Math.random() * 3000) + currentPrice,
      quantity: Math.floor(Math.random() * 4) + 1,
      timestamp: Date.now(),
      isValid: true,
      rank: null,
    }));
  };

  const endAuction = () => {
    setAuctionStarted(false);
    const finalPrice = currentPrice;
    const winningBids = bids.filter((bid) => bid.isValid && bid.amount >= finalPrice);

    let totalSaved = 0;
    let totalQuantity = 0;
    let totalPaid = 0;

    winningBids.forEach((bid) => {
      const actualPaid = finalPrice * bid.quantity;
      const saved = (bid.amount - finalPrice) * bid.quantity;
      totalSaved += saved;
      totalQuantity += bid.quantity;
      totalPaid += actualPaid;
    });

    alert(`拍賣結束！
最終得標價格：NT$${finalPrice}
您得標的張數：${totalQuantity}
實際支付金額：NT$${totalPaid}
節省金額：NT$${totalSaved}`);
  };

  const getAvailableBidQuantity = () => {
    const validBidsQuantity = bids.filter(bid => bid.isValid).reduce((sum, bid) => sum + bid.quantity, 0);
    return Math.max(0, 4 - validBidsQuantity);
  };

  const getTotalBidCount = () => {
    return bids.length;
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">拍賣系統</h1>

      <div className="mb-4 p-4 border rounded">
        <h2 className="text-xl font-bold mb-2">帳戶資訊</h2>
        <p>餘額：NT${balance}</p>
        <p>總出價次數：{getTotalBidCount()}</p>
        <p>剩餘可出價張數：{getAvailableBidQuantity()}</p>
        {!auctionStarted && (
          <div className="mt-2">
            <input
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="輸入儲值金額"
              className="border p-2 mr-2"
            />
            <button onClick={handleDeposit} className="bg-green-500 text-white p-2 rounded">
              儲值
            </button>
          </div>
        )}
      </div>

      {auctionStarted && (
        <div className="mb-4 p-4 border rounded">
          <h2 className="text-xl font-bold mb-2">拍賣狀態</h2>
          <p>當前門檻價格：NT${currentPrice}</p>
          <p>剩餘時間：{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</p>
        </div>
      )}

      {auctionStarted && (
        <div className="mb-4 p-4 border rounded">
          <h2 className="text-xl font-bold mb-2">出價</h2>
          <input
            type="number"
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            placeholder="輸入出價金額"
            className="border p-2 mr-2"
          />
          <select
            value={bidQuantity}
            onChange={(e) => setBidQuantity(Number(e.target.value))}
            className="border p-2 mr-2"
          >
            {[1, 2, 3, 4].map((num) => (
              <option key={num} value={num} disabled={num > getAvailableBidQuantity()}>
                {num}張
              </option>
            ))}
          </select>
          <button onClick={handleBid} className="bg-blue-500 text-white p-2 rounded">
            出價
          </button>
        </div>
      )}

      <div className="mb-4 p-4 border rounded">
        <h2 className="text-xl font-bold mb-2">您的出價</h2>
        {bids.length === 0 ? (
          <p>您還沒有出價記錄</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left">金額</th>
                <th className="text-left">張數</th>
                <th className="text-left">排名</th>
                <th className="text-left">狀態</th>
              </tr>
            </thead>
            <tbody>
              {bids.map((bid) => (
                <tr 
                  key={bid.id} 
                  className={`${
                    !bid.isValid ? 'line-through ' : ''
                  }${
                    bid.isValid ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  <td>NT${bid.amount}</td>
                  <td>{bid.quantity}張</td>
                  <td>{bid.rank ? `第${bid.rank}名` : '未排名'}</td>
                  <td>
                    {bid.isValid ? '有效' : '無效 (已退款)'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mb-4 p-4 border rounded">
        <h2 className="text-xl font-bold mb-2">最低門檻價格</h2>
        <p>NT${currentPrice}</p>
      </div>
    </div>
  );
}

export default App;