// src/components/ScaledApp.jsx
import { useEffect, useState, useCallback } from 'react';

/**
 * ScaledApp Component
 * 
 * Provides intelligent viewport-based scaling for the entire application.
 * Designed for applications built at a specific resolution (2560×1440) that need
 * to scale proportionally on different screen sizes while maintaining pixel-perfect layout.
 * 
 * Features:
 * - Automatic scale calculation based on viewport width
 * - Smooth transitions when resizing
 * - Performance-optimized with debounced resize handlers
 * - Maintains aspect ratio and prevents text blur
 * - Works seamlessly with Tailwind CSS
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - The entire application content to be scaled
 * @param {number} props.designWidth - The width your application was designed for (default: 2560)
 * @param {number} props.designHeight - The height your application was designed for (default: 1440)
 * @param {number} props.minScale - Minimum scale factor to maintain readability (default: 0.4)
 * @param {number} props.maxScale - Maximum scale factor (default: 1.0)
 * @param {boolean} props.enableDevControls - Show dev controls for testing (default: false)
 */
const ScaledApp = ({ 
  children, 
  designWidth = 2560, 
  designHeight = 1440,
  minScale = 0.4,
  maxScale = 1.0,
  enableDevControls = false
}) => {
  const [scale, setScale] = useState(1);
  const [isReady, setIsReady] = useState(false);

  /**
   * Calculate the optimal scale factor based on current viewport dimensions
   * Uses the smaller of width/height scale to ensure entire content fits
   */
  const calculateScale = useCallback(() => {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Calculate scale factors for both dimensions
    const scaleX = windowWidth / designWidth;
    const scaleY = windowHeight / designHeight;
    
    // Use the smaller scale to ensure everything fits
    let newScale = Math.min(scaleX, scaleY);
    
    // Apply min/max constraints
    newScale = Math.max(minScale, Math.min(maxScale, newScale));
    
    setScale(newScale);
    setIsReady(true);
  }, [designWidth, designHeight, minScale, maxScale]);

  useEffect(() => {
    // Initial calculation
    calculateScale();
    
    // Debounced resize handler for better performance
    let timeoutId;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(calculateScale, 150);
    };

    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [calculateScale]);

  // Calculate scaled dimensions for the container
  const scaledWidth = designWidth * scale;
  const scaledHeight = designHeight * scale;

  return (
    <>
      {/* Main scaled container */}
      <div 
        className="fixed inset-0 overflow-auto bg-gray-50"
        style={{
          opacity: isReady ? 1 : 0,
          transition: 'opacity 0.2s ease-in-out'
        }}
      >
        {/* Wrapper to handle scrolling properly */}
        <div
          style={{
            width: `${scaledWidth}px`,
            height: `${scaledHeight}px`,
            minHeight: '100vh',
            margin: '0 auto', // Center horizontally if there's extra space
          }}
        >
          {/* The actual scaled content */}
          <div
            style={{
              width: `${designWidth}px`,
              height: `${designHeight}px`,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              // Anti-aliasing and rendering optimizations
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale',
              backfaceVisibility: 'hidden',
            }}
          >
            {children}
          </div>
        </div>
      </div>

      {/* Development controls (only in development mode) */}
      {enableDevControls && process.env.NODE_ENV === 'development' && (
        <DevScaleControls 
          currentScale={scale} 
          designWidth={designWidth}
          designHeight={designHeight}
        />
      )}
    </>
  );
};

/**
 * Development Controls Component
 * Provides quick resolution testing during development
 */
const DevScaleControls = ({ currentScale, designWidth, designHeight }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const testResolutions = [
    { name: '1366×768 (Laptop)', width: 1366, height: 768 },
    { name: '1920×1080 (Full HD)', width: 1920, height: 1080 },
    { name: '2560×1440 (2K)', width: 2560, height: 1440 },
    { name: '3840×2160 (4K)', width: 3840, height: 2160 },
  ];

  const simulateResolution = (width, height) => {
    // Calculate what the scale would be for this resolution
    const scaleX = width / designWidth;
    const scaleY = height / designHeight;
    const simulatedScale = Math.min(scaleX, scaleY);
    
    alert(`At ${width}×${height}:\n` +
          `Scale would be: ${(simulatedScale * 100).toFixed(1)}%\n` +
          `Effective size: ${(designWidth * simulatedScale).toFixed(0)}×${(designHeight * simulatedScale).toFixed(0)}`);
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      {isExpanded ? (
        <div className="bg-white rounded-lg shadow-2xl p-4 border-2 border-blue-500 w-72">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-sm">Scale Testing</h3>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <div className="mb-3 p-2 bg-blue-50 rounded text-sm">
            <div className="font-semibold">Current Scale: {(currentScale * 100).toFixed(1)}%</div>
            <div className="text-xs text-gray-600 mt-1">
              Viewport: {window.innerWidth}×{window.innerHeight}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-700 mb-2">Test Resolutions:</p>
            {testResolutions.map((res) => (
              <button
                key={res.name}
                onClick={() => simulateResolution(res.width, res.height)}
                className="block w-full text-left px-3 py-2 text-sm hover:bg-blue-50 rounded border border-gray-200 transition-colors"
              >
                {res.name}
                <div className="text-xs text-gray-500">{res.width}×{res.height}</div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-600 transition-colors font-semibold text-sm"
        >
          🔍 Scale: {(currentScale * 100).toFixed(0)}%
        </button>
      )}
    </div>
  );
};

export default ScaledApp;