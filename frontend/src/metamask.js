export async function connectWallet() {
  let provider;

  // Tìm đúng MetaMask trong danh sách providers
  if (window.ethereum?.providers) {
    provider = window.ethereum.providers.find(p => p.isMetaMask && !p.isCoinbaseWallet);
  } else if (window.ethereum?.isMetaMask) {
    provider = window.ethereum;
  }

  if (!provider) {
    alert("Bạn chưa cài MetaMask hoặc MetaMask không được tìm thấy");
    return;
  }

  try {
    const accounts = await provider.request({
      method: "eth_requestAccounts"
    });

    const account = accounts[0];
    document.getElementById("walletAddress").innerText = "Wallet: " + account;

  } catch (error) {
    console.log(error);
  }
}