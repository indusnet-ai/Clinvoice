import { useEffect, useState } from 'react';
 
export const useWindowType = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 1200);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth < 1400);
  const [isSmallLaptop, setIsSmallLaptop] = useState(window.innerWidth >= 1280 && window.innerWidth < 1600);
 
  useEffect(() => {
    const handleResize = () => {
      // console.log(window.innerWidth, 'window.innerWidth');
 
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1200);
      setIsDesktop(window.innerWidth < 1400);
      setIsSmallLaptop(window.innerWidth >= 1280 && window.innerWidth < 1600);
    };
 
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
 
  return { isMobile, isDesktop, isTablet, isSmallLaptop };
};