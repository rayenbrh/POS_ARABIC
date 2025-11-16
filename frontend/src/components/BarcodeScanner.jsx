import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import toast from 'react-hot-toast';

const BarcodeScanner = ({ onScan, onClose }) => {
  const [scanMode, setScanMode] = useState('manual'); // 'manual', 'usb', 'camera'
  const [manualBarcode, setManualBarcode] = useState('');
  const [usbBuffer, setUsbBuffer] = useState('');
  const scannerRef = useRef(null);
  const timeoutRef = useRef(null);

  // USB Scanner Mode - listens for keyboard input
  useEffect(() => {
    if (scanMode === 'usb') {
      const handleKeyPress = (e) => {
        // Prevent default browser actions
        e.preventDefault();

        // Enter key means the barcode is complete
        if (e.key === 'Enter') {
          if (usbBuffer.trim()) {
            onScan(usbBuffer.trim());
            setUsbBuffer('');
          }
        } else if (e.key.length === 1) {
          // Add character to buffer
          setUsbBuffer(prev => prev + e.key);
          
          // Clear timeout if exists
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          
          // Auto-submit after 100ms of no input (in case scanner doesn't send Enter)
          timeoutRef.current = setTimeout(() => {
            if (usbBuffer.trim()) {
              onScan(usbBuffer.trim());
              setUsbBuffer('');
            }
          }, 100);
        }
      };

      window.addEventListener('keypress', handleKeyPress);
      
      return () => {
        window.removeEventListener('keypress', handleKeyPress);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }
  }, [scanMode, usbBuffer, onScan]);

  // Camera Scanner Mode
  useEffect(() => {
    if (scanMode === 'camera') {
      const scanner = new Html5QrcodeScanner(
        'barcode-reader',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          formatsToSupport: [
            'EAN_13',
            'EAN_8',
            'UPC_A',
            'UPC_E',
            'CODE_128',
            'CODE_39',
            'QR_CODE'
          ]
        },
        false
      );

      scanner.render(
        (decodedText) => {
          onScan(decodedText);
          scanner.clear();
        },
        (error) => {
          // Silent error handling - scanning errors are normal
          console.log(error);
        }
      );

      scannerRef.current = scanner;

      return () => {
        if (scannerRef.current) {
          scannerRef.current.clear().catch(err => console.log(err));
        }
      };
    }
  }, [scanMode, onScan]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualBarcode.trim()) {
      onScan(manualBarcode.trim());
      setManualBarcode('');
    } else {
      toast.error('يرجى إدخال الباركود');
    }
  };

  return (
    <div className="space-y-4">
      {/* Scanner Mode Selector */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setScanMode('manual')}
          className={`flex-1 px-4 py-2 rounded-lg font-bold transition-all ${
            scanMode === 'manual'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          ⌨️ يدوي
        </button>
        <button
          onClick={() => setScanMode('usb')}
          className={`flex-1 px-4 py-2 rounded-lg font-bold transition-all ${
            scanMode === 'usb'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          🔌 USB
        </button>
        <button
          onClick={() => setScanMode('camera')}
          className={`flex-1 px-4 py-2 rounded-lg font-bold transition-all ${
            scanMode === 'camera'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          📷 كاميرا
        </button>
      </div>

      {/* Manual Mode */}
      {scanMode === 'manual' && (
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div>
            <label className="block font-semibold mb-2">أدخل الباركود</label>
            <input
              type="text"
              value={manualBarcode}
              onChange={(e) => setManualBarcode(e.target.value)}
              className="w-full px-4 py-3 border-2 rounded-lg text-lg"
              placeholder="اكتب أو الصق الباركود هنا"
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-all"
          >
            🔍 بحث
          </button>
        </form>
      )}

      {/* USB Mode */}
      {scanMode === 'usb' && (
        <div className="text-center py-8">
          <div className="mb-4">
            <div className="inline-block p-4 bg-blue-100 rounded-full mb-4">
              <svg className="w-16 h-16 text-blue-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </div>
          <h3 className="text-xl font-bold mb-2">جاهز للمسح</h3>
          <p className="text-gray-600 mb-4">
            امسح الباركود باستخدام الماسح الضوئي USB
          </p>
          {usbBuffer && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-blue-600 font-mono">{usbBuffer}</p>
            </div>
          )}
        </div>
      )}

      {/* Camera Mode */}
      {scanMode === 'camera' && (
        <div>
          <div className="mb-4 bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
            <p>📷 وجّه الكاميرا نحو الباركود</p>
          </div>
          <div id="barcode-reader" className="rounded-lg overflow-hidden"></div>
        </div>
      )}

      <button
        onClick={onClose}
        className="w-full bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-bold hover:bg-gray-300 transition-all"
      >
        إلغاء
      </button>
    </div>
  );
};

export default BarcodeScanner;