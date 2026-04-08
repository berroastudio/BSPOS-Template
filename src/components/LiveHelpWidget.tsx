import { MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

declare global {
  interface Window {
    Tawk_API: any;
  }
}

export function LiveHelpWidget() {
  const CHAT_URL = "https://tawk.to/chat/69d5677fb7c31c1c330199de/1jllo0pbq";

  const handleSupportClick = () => {
    // Robust detection: If mobile/tablet or API is slow, use direct link
    const isMobile = /iPad|iPhone|iPod|android/i.test(navigator.userAgent) || window.innerWidth < 1024;

    if (window.Tawk_API && typeof window.Tawk_API.maximize === 'function') {
      try {
        window.Tawk_API.showWidget();
        window.Tawk_API.maximize();
        
        // If it's a mobile device, we ALSO open the link to be 100% sure it works "al toque"
        if (isMobile) {
          window.open(CHAT_URL, '_blank');
        }
      } catch (e) {
        window.open(CHAT_URL, '_blank');
      }
    } else {
      // Fallback: Direct link if Tawk_API is not loaded yet
      window.open(CHAT_URL, '_blank');
    }
  };

  return (
    <motion.div 
      className="bo-chat-widget"
      onClick={handleSupportClick}
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title="Abrir Live Help Chat"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '8px 16px',
        background: '#fff',
        border: '1px solid #e2e2de',
        borderRadius: '99px',
        boxShadow: '0 10px 36px rgba(0,0,0,.11)',
        cursor: 'pointer'
      }}
    >
      <div className="bo-chat-indicator" style={{
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        background: '#2e7d32',
        boxShadow: '0 0 8px #2e7d32'
      }} />
      <span style={{ fontWeight: 600, color: "#111", fontSize: "0.82rem" }}>Live Help</span>
      <MessageCircle size={18} style={{ color: "#888" }} />
    </motion.div>
  );
}
