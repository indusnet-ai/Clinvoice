import { useEffect, useState } from "react";

const Counter = ({ targetVal }: any) => {
  const [count, setCount] = useState(0);
  const targetValue = targetVal;
  const duration = 1500;
  const intervalTime = 10;
  const incrementValue = targetValue / (duration / intervalTime);

  useEffect(() => {
    let currentValue = 0;
    const counterInterval = setInterval(() => {
      currentValue += incrementValue;
      if (currentValue >= targetValue) {
        currentValue = targetValue;
        clearInterval(counterInterval);
      }
      setCount(Math.round(currentValue));
    }, intervalTime);

    return () => clearInterval(counterInterval);
  }, [incrementValue, targetValue, intervalTime]);

  return count;
};

export default Counter;
