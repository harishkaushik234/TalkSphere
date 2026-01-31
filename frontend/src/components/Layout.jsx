import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { useUnreadMessages } from "../hooks/useUnreadMessages";

const Layout = ({ children, showSidebar = false }) => {
  // Initialize global unread tracking (runs the hook to connect and populate unreadCounts)
  useUnreadMessages();
  return (
    <div className="min-h-screen">
      <div className="flex">
        {showSidebar && <Sidebar />}

        <div className="flex-1 flex flex-col">
          <Navbar />

          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </div>
  );
};
export default Layout;
