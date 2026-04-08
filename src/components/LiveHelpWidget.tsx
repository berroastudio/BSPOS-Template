import { MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

declare global {
  interface Window {
    Tawk_API: any;
  }
}

export function LiveHelpWidget() {
  const handleSupportClick = () => {
    // Open Tawk.to widget chat
    if (window.Tawk_API) {
      if (typeof window.Tawk_API.maximize === 'function') {
        window.Tawk_API.maximize();
      } else if (typeof window.Tawk_API.toggle === 'function') {
        window.Tawk_API.toggle();
      } else if (typeof window.Tawk_API.openChatBox === 'function') {
        window.Tawk_API.openChatBox();
      }
    } else {
      console.log("Tawk.to is not yet loaded or initialized.");
      // Fallback: If direct link is needed, but usually Tawk_API exists after load
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
