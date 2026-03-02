import React from 'react';
import { FadeLoader } from 'react-spinners';

const Loader = ({ color = "#454DE6" }) => {
  return (
    <div className="flex justify-center items-center h-screen">
      <FadeLoader color={color} />
    </div>
  );
};

export default Loader;
