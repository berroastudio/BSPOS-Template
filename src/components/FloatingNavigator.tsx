import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ShoppingBag, BookOpen, User, ChevronLeft, ChevronRight } from "lucide-react";

export function FloatingNavigator() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScroll, setLastScroll] = useState(0);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeys = (e: KeyboardEvent) => {
      if (e.altKey && e.code === 'KeyH') {
        e.preventDefault();
        navigate(-1);
      }
      if (e.altKey && e.code === 'KeyL') {
        e.preventDefault();
        navigate(1);
      }
    };
    window.addEventListener('keydown', handleKeys);
    return () => window.removeEventListener('keydown', handleKeys);
  }, [navigate]);

  // Hide on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      if (currentScroll > lastScroll && currentScroll > 200) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScroll(currentScroll);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScroll]);

  const navItems = [
    { id: "store", label: "Tienda", icon: ShoppingBag, path: "/", shortcut: "H" },
    { id: "instructions", label: "Bibliotecas", icon: BookOpen, path: "/instructions", shortcut: "L" },
    { id: "account", label: "Mi Cuenta", icon: User, path: "/my-account", shortcut: "A" }
  ];

  // Helper for actual subdomain or path navigation
  const handleNav = (item: any) => {
    if (item.path === "/instructions") {
       // Check if we should use subdomain
       if (window.location.hostname.includes('instructions.')) {
         navigate('/');
       } else {
         window.location.href = "https://instructions.berroastudio.com";
       }
    } else {
      navigate(item.path);
    }
  };

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className={`floating-pill-nav ${isVisible ? 'visible' : ''}`}>
      <div className="pill-container">
        <div className="pill-segment arrow-segment" onClick={() => navigate(-1)}>
          <ChevronLeft size={14} />
          <span className="shortcut-hint">⌥H</span>
        </div>
        
        <div className="pill-divider" />
        
        {navItems.map(item => (
          <div 
            key={item.id} 
            className={`pill-segment ${isActive(item.path) ? 'active' : ''}`}
            onClick={() => handleNav(item)}
          >
            <item.icon size={14} />
            <span className="pill-label">{item.label}</span>
          </div>
        ))}

        <div className="pill-divider" />

        <div className="pill-segment arrow-segment" onClick={() => navigate(1)}>
          <span className="shortcut-hint">⌥L</span>
          <ChevronRight size={14} />
        </div>
      </div>

      <style>{`
        .floating-pill-nav {
          position: fixed;
          bottom: 30px;
          left: 50%;
          transform: translateX(-50%) translateY(100px);
          z-index: 1000;
          transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
          opacity: 0;
        }

        .floating-pill-nav.visible {
          transform: translateX(-50%) translateY(0);
          opacity: 1;
        }

        .pill-container {
          background: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(12px) saturate(180%);
          -webkit-backdrop-filter: blur(12px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 20px;
          padding: 6px;
          display: flex;
          align-items: center;
          gap: 4px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
        }

        [data-theme='dark'] .pill-container {
          background: rgba(26, 26, 26, 0.75);
          border-color: rgba(255, 255, 255, 0.1);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        }

        .pill-segment {
          padding: 6px 14px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.78rem;
          font-weight: 600;
          color: #444;
          white-space: nowrap;
          user-select: none;
        }

        [data-theme='dark'] .pill-segment {
          color: #bbb;
        }

        .pill-segment:hover {
          background: rgba(0, 0, 0, 0.05);
          color: #000;
        }

        [data-theme='dark'] .pill-segment:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
        }

        .pill-segment.active {
          background: #111;
          color: #fff;
        }

        [data-theme='dark'] .pill-segment.active {
          background: #fff;
          color: #000;
        }

        .pill-divider {
          width: 1px;
          height: 20px;
          background: rgba(0, 0, 0, 0.1);
          margin: 0 4px;
        }

        [data-theme='dark'] .pill-divider {
          background: rgba(255, 255, 255, 0.1);
        }

        .arrow-segment {
          padding: 6px 10px;
          color: #999;
          gap: 6px;
        }

        .shortcut-hint {
          font-family: inherit;
          font-size: 0.65rem;
          opacity: 0.4;
          font-weight: 700;
        }

        .pill-label {
          display: inline-block;
        }

        @media (max-width: 600px) {
          .pill-label { display: none; }
          .pill-segment { padding: 10px; }
          .shortcut-hint { display: none; }
        }
      `}</style>
    </div>
  );
}
