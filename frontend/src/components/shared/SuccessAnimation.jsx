import React from 'react';
import Lottie from 'lottie-react';
import completeAnimation from '../../animations/complete.json';
import { Dialog, DialogContent } from '../ui/dialog';

const SuccessAnimation = ({ isOpen, onComplete, title, message }) => {
  const handleAnimationComplete = () => {
    setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, 1000); // Small delay after animation completes
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-md border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
        <div className="text-center py-6">
          <Lottie
            animationData={completeAnimation}
            loop={false}
            autoplay={true}
            onComplete={handleAnimationComplete}
            style={{ width: 300, height: 300, margin: '0 auto' }}
          />
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-green-600 mb-2">
              {title || 'Success!'}
            </h3>
            <p className="text-gray-600">
              {message || 'Operation completed successfully'}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SuccessAnimation;