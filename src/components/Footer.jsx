export const Footer = () => {
  return (
    <footer className="bg-white shadow-md mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="text-center">
          <p className="text-gray-600 mb-2">
            OverNftExchange by{" "}
            <a
              href="mailto:cheolsun80@gmail.com"
              className="text-sky-600 hover:text-sky-700"
            >
              cheolsun80
            </a>
          </p>
          <div className="flex justify-center gap-4">
            <a
              href="https://github.com/cheolsun80-web3"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900"
            >
              GitHub
            </a>
            <a
              href="https://discord.gg/afzfh5g7Xw"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900"
            >
              Discord
            </a>
            <a
              href="https://scan.over.network/address/0x45b737bB344766209170a024a90bFE94E214c4d9?tab=contract"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900"
            >
              ONE-Contract
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}; 