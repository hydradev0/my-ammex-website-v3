import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";

function Layout({ children }) {
  const location = useLocation();

  useEffect(() => {
    const segments = location.pathname.split("/").filter(Boolean);

    // If no path ("/"), default to "Login"
    let lastSegment = segments.length === 0 ? "Login" : segments[segments.length - 1];

    // Capitalize each word separated by dash
    lastSegment = lastSegment
      .split("-")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    document.title = `Ammex | ${lastSegment}`;
  }, [location]);

  return <>{children}</>;
}

export default Layout;
