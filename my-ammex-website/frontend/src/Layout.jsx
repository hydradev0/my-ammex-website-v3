import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";

function Layout({ children }) {
  const location = useLocation();

  useEffect(() => {
    const segments = location.pathname.split("/").filter(Boolean);

    // If no path ("/"), default to "Home"
    let lastSegment = segments.length === 0 ? "Login" : segments[segments.length - 1];

    // Capitalize first letter
    lastSegment = lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);

    document.title = `Ammex | ${lastSegment}`;
  }, [location]);

  return <>{children}</>;
}

export default Layout;
