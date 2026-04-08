import { Home, PlusCircle, BarChart3, Lightbulb, Settings, Target } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const tabs = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/reports", icon: BarChart3, label: "Reports" },
  { path: "/add", icon: PlusCircle, label: "Add" },
  { path: "/insights", icon: Lightbulb, label: "Insights" },
  { path: "/goals", icon: Target, label: "Goals" },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {tabs.map((tab) => {
          const active = location.pathname === tab.path;
          const isAdd = tab.path === "/add";
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${
                isAdd ? "" : active ? "text-secondary" : "text-muted-foreground"
              }`}
            >
              {isAdd ? (
                <div className="relative -mt-5 bg-secondary rounded-full p-3 shadow-lg">
                  <tab.icon className="w-6 h-6 text-secondary-foreground" />
                </div>
              ) : (
                <>
                  <tab.icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">{tab.label}</span>
                  {active && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-secondary rounded-full"
                    />
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
