import { useState, useEffect } from "react";

const FullscreenChecker = ({ children }) => {
  const [isFullscreen, setIsFullscreen] = useState(true);

  const checkFullscreen = () => {
    const w = document.documentElement.clientWidth;
    const h = document.documentElement.clientHeight;
    const sw = screen.width;
    const sh = screen.availHeight;

    setIsFullscreen(w >= sw && h >= sh);
  };

  useEffect(() => {
    checkFullscreen();

    window.addEventListener("resize", checkFullscreen);
  }, []);

  return isFullscreen ? (
    children
  ) : (
    <div style={{ textAlign: "center", padding: "20px", fontSize: "20px" }}>
      Работа сервиса приостановлена. Чтобы продолжить работу, разверните браузер на весь экран.
    </div>
  );
};

export default FullscreenChecker;