import React from 'react';
import Lottie from 'lottie-react';
import animationData from '../assets/loading-animation.json';

const LottieLoading = ({ width = 150, height = 75 }) => {
  return (
    <div className="lottie-loading-container">
      <Lottie
        animationData={animationData}
        loop={true}
        autoplay={true}
        style={{ width, height }}
      />
    </div>
  );
};

export default LottieLoading;
