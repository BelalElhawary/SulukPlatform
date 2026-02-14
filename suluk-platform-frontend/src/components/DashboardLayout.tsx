import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, Package, ShoppingCart, LogOut, Menu, BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useTranslation } from "react-i18next";

export default function DashboardLayout() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const { t } = useTranslation();

    const navItems = [
        { name: t('common.dashboard'), path: "/", icon: LayoutDashboard },
        { name: t('common.clients'), path: "/clients", icon: Users },
        { name: t('common.items'), path: "/items", icon: Package },
        { name: t('common.purchases'), path: "/purchases", icon: ShoppingCart },
        { name: t('common.analyze'), path: "/analyze", icon: BrainCircuit },
    ];

    return (
        <div className="flex h-screen bg-background text-foreground">
            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transition-transform duration-300 md:relative md:translate-x-0 rtl:border-l rtl:border-r-0 rtl:left-auto rtl:right-0",
                    !isSidebarOpen && "ltr:-translate-x-full rtl:translate-x-full md:hidden"
                )}
            >
                <div className="flex items-center justify-between h-16 px-6 border-b">
                    <div className="flex items-center gap-2">
                        <img src="/logo.jpeg" alt="Suluk Logo" className="h-8 w-8 rounded-full" />
                        <span className="text-xl font-bold text-primary">Suluk Platform</span>
                    </div>
                </div>
                <nav className="p-4 space-y-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-primary text-primary-foreground"
                                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Icon className="h-5 w-5 rtl:ml-3 rtl:mr-0" />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
                <div className="absolute bottom-4 left-0 right-0 p-4">
                    <div className="flex items-center gap-3 px-4 py-3 mb-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {user?.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium truncate">{user?.username}</p>
                        </div>
                    </div>
                    <Button variant="outline" className="w-full justify-start gap-3 text-destructive hover:text-destructive" onClick={logout}>
                        <LogOut className="h-5 w-5 rtl:ml-3 rtl:mr-0" />
                        {t('common.logout')}
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header */}
                <header className="flex items-center justify-between h-16 px-4 border-b bg-card">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                            <Menu className="h-6 w-6" />
                        </Button>
                        <span className="font-bold md:hidden">Suluk Platform</span>
                    </div>
                    <div className="flex items-center gap-4 ml-auto">
                        <LanguageSwitcher />
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-auto p-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
