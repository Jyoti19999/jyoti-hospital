import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Lottie from "lottie-react";
import notFoundAnimation from "../animations/not_found.json";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
  }, [location.pathname]);

  const handleReturnHome = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="text-center">
        {/* Lottie Animation */}
        <div className="mb-6 flex justify-center">
          <Lottie
            animationData={notFoundAnimation}
            loop={true}
            autoplay={true}
            style={{ width: 800, height: 500 }}
          />
        </div>
        
        {/* Error Text */}
        <div className="mb-6">
          <p className="text-gray-600 text-base mb-4">
           <span className="text-3xl font-bold"> Oops! Page not found </span>
           <br />
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Return to Home Button */}
        <button
          onClick={handleReturnHome}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors duration-200"
        >
          Return to Home
        </button>
      </div>
    </div>
  );
};

export default NotFound;
