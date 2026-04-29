import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Users, Package, ShoppingCart, BrainCircuit, ArrowRight } from "lucide-react";

export default function DashboardPage() {
    const { user, api } = useAuth();
    const { t } = useTranslation();
    const [stats, setStats] = useState({ clients: 0, items: 0, purchases: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [clientsRes, itemsRes, purchasesRes] = await Promise.all([
                    api.get("/clients/"),
                    api.get("/items/"),
                    api.get("/purchases/")
                ]);
                setStats({
                    clients: clientsRes.data?.length || 0,
                    items: itemsRes.data?.length || 0,
                    purchases: purchasesRes.data?.length || 0
                });
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [api]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {t('dashboard.welcome', 'Welcome back')}, <span className="text-primary">{user?.username}</span>!
                    </h1>
                    <p className="text-muted-foreground mt-1 text-lg">
                        {t('dashboard.subtitle', "Here's an overview of your platform today.")}
                    </p>
                </div>
                <Button asChild className="gap-2 shadow-sm hover:shadow-md transition-shadow">
                    <Link to="/analyze">
                        <BrainCircuit className="h-4 w-4" />
                        {t('dashboard.analyze_btn', 'Analyze Clients')}
                    </Link>
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="hover:shadow-md transition-shadow border-s-4 border-s-blue-500 bg-gradient-to-br from-card to-blue-500/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('dashboard.total_clients', 'Total Clients')}</CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{loading ? "..." : stats.clients}</div>
                        <p className="text-xs text-muted-foreground mt-1">Actively managed clients</p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow border-s-4 border-s-emerald-500 bg-gradient-to-br from-card to-emerald-500/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('dashboard.total_purchases', 'Total Purchases')}</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{loading ? "..." : stats.purchases}</div>
                        <p className="text-xs text-muted-foreground mt-1">Recorded transactions</p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow border-s-4 border-s-violet-500 bg-gradient-to-br from-card to-violet-500/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('dashboard.total_items', 'Products/Services')}</CardTitle>
                        <Package className="h-4 w-4 text-violet-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{loading ? "..." : stats.items}</div>
                        <p className="text-xs text-muted-foreground mt-1">Registered inventory items</p>
                    </CardContent>
                </Card>
            </div>

            <h2 className="text-2xl font-bold tracking-tight pt-4">{t('dashboard.quick_actions', 'Quick Actions')}</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Link to="/clients">
                    <Card className="hover:bg-muted/60 transition-colors cursor-pointer group h-full">
                        <CardHeader className="pb-3">
                            <Users className="h-8 w-8 text-primary/80 mb-2 group-hover:scale-110 group-hover:text-primary transition-all duration-300" />
                            <CardTitle className="text-lg">Manage Clients</CardTitle>
                            <CardDescription>Add, edit or view your client list.</CardDescription>
                        </CardHeader>
                    </Card>
                </Link>

                <Link to="/purchases">
                    <Card className="hover:bg-muted/60 transition-colors cursor-pointer group h-full">
                        <CardHeader className="pb-3">
                            <ShoppingCart className="h-8 w-8 text-primary/80 mb-2 group-hover:scale-110 group-hover:text-primary transition-all duration-300" />
                            <CardTitle className="text-lg">Record Purchase</CardTitle>
                            <CardDescription>Log a new transaction for a client.</CardDescription>
                        </CardHeader>
                    </Card>
                </Link>

                <Link to="/items">
                    <Card className="hover:bg-muted/60 transition-colors cursor-pointer group h-full">
                        <CardHeader className="pb-3">
                            <Package className="h-8 w-8 text-primary/80 mb-2 group-hover:scale-110 group-hover:text-primary transition-all duration-300" />
                            <CardTitle className="text-lg">Inventory Config</CardTitle>
                            <CardDescription>Configure products and pricing.</CardDescription>
                        </CardHeader>
                    </Card>
                </Link>

                <Link to="/analyze">
                    <Card className="hover:bg-primary/10 transition-colors cursor-pointer group border-primary/30 bg-primary/5 h-full">
                        <CardHeader className="pb-3">
                            <BrainCircuit className="h-8 w-8 text-primary/80 mb-2 group-hover:scale-110 group-hover:text-primary transition-all duration-300" />
                            <CardTitle className="text-lg">Client Analysis</CardTitle>
                            <CardDescription>Run AI insights on shopping behavior.</CardDescription>
                        </CardHeader>
                    </Card>
                </Link>
            </div>

            <div className="mt-8 p-6 bg-gradient-to-br from-primary/10 via-background to-secondary/10 rounded-xl border flex flex-col md:flex-row items-center gap-6 justify-between shadow-sm">
                <div className="flex items-center gap-5">
                    <div className="p-2 bg-background shadow-sm border rounded-2xl shrink-0">
                        <img src="/logo.jpeg" alt="Suluk Logo" className="h-20 w-20 rounded-xl object-cover" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold tracking-tight">Suluk Platform Overview</h3>
                        <p className="text-muted-foreground mt-1 max-w-md">Suluk Platform keeps your data perfectly aligned. Connect with your clients and increase your recurrent revenue through AI analysis.</p>
                    </div>
                </div>
                <Button variant="outline" asChild className="gap-2 shrink-0 group">
                    <Link to="/purchases">
                        View History <ArrowRight className="h-4 w-4 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                    </Link>
                </Button>
            </div>
        </div>
    );
}
