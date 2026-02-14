import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Loader2, BrainCircuit } from "lucide-react";

interface Client {
    id: number;
    name: string;
}

interface AnalysisData {
    client_name: string;
    total_spent: number;
    purchase_count: number;
    ai_analysis: string;
    chart_data: { date: string; amount: number }[];
    top_items: { name: string; value: number }[];
}

export default function AnalyzePage() {
    const { api } = useAuth();
    const { t, i18n } = useTranslation();
    const [clients, setClients] = useState<Client[]>([]);
    const [models, setModels] = useState<string[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<string>("");
    const [selectedModel, setSelectedModel] = useState<string>("");
    const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchClients();
        fetchModels();
    }, []);

    const fetchClients = async () => {
        try {
            const response = await api.get("/clients/");
            setClients(response.data);
        } catch (error) {
            console.error("Failed to fetch clients", error);
        }
    };

    const fetchModels = async () => {
        try {
            const response = await api.get("/analysis/models");
            if (response.data.models && response.data.models.length > 0) {
                setModels(response.data.models);
                setSelectedModel(response.data.models[0]);
            }
        } catch (error) {
            console.error("Failed to fetch models", error);
        }
    };

    const handleAnalyze = async () => {
        if (!selectedClientId) return;
        setLoading(true);
        setAnalysis(null);
        try {
            // 1. Fetch structured data
            const response = await api.get(`/analysis/${selectedClientId}?lang=${i18n.language}`);
            setAnalysis(response.data);

            // 2. Start Streaming AI Response
            const streamResponse = await fetch(`${api.defaults.baseURL}/analysis/${selectedClientId}/stream?lang=${i18n.language}&model=${selectedModel}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!streamResponse.body) return;

            const reader = streamResponse.body.getReader();
            const decoder = new TextDecoder();
            let aiText = "";

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                aiText += chunk;

                // Update state with new text chunk
                setAnalysis(prev => prev ? { ...prev, ai_analysis: aiText } : null);
            }

        } catch (error) {
            console.error("Failed to fetch analysis", error);
            // If main fetch fails, we might not have analysis object, so handle gracefully
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('analyze.title')}</h1>
                    <p className="text-muted-foreground">{t('analyze.subtitle')}</p>
                </div>

                <div className="flex items-center gap-2">
                    {/* Model Selector */}
                    <select
                        className="flex h-10 w-[180px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        disabled={loading}
                    >
                        {models.map(model => (
                            <option key={model} value={model}>{model}</option>
                        ))}
                    </select>

                    <select
                        className="flex h-10 w-[200px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={selectedClientId}
                        onChange={(e) => setSelectedClientId(e.target.value)}
                    >
                        <option value="">{t('common.select_client')}</option>
                        {clients.map(client => (
                            <option key={client.id} value={client.id}>{client.name}</option>
                        ))}
                    </select>
                    <Button onClick={handleAnalyze} disabled={!selectedClientId || loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
                        {t('analyze.analyze_button')}
                    </Button>
                </div>
            </div>

            {analysis && (
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Overview Cards */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">{t('analyze.total_spent')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">${analysis.total_spent.toFixed(2)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">{t('analyze.total_purchases')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{analysis.purchase_count}</div>
                        </CardContent>
                    </Card>

                    {/* AI Insights - Full Width */}
                    <Card className="md:col-span-2 border-l-4 border-l-primary shadow-md bg-gradient-to-br from-card to-secondary/5">
                        <CardHeader className="pb-2 border-b bg-muted/20">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-full">
                                    <BrainCircuit className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl text-primary">
                                        {t('analyze.ai_insights')}
                                    </CardTitle>
                                    <CardDescription className="flex items-center gap-2">
                                        {t('analyze.generated_by')} ({selectedModel})
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    h1: ({ node, ...props }) => <h1 className="text-2xl font-bold text-primary mb-4" {...props} />,
                                    h2: ({ node, ...props }) => <h2 className="text-xl font-semibold text-primary/80 mt-6 mb-3 border-b pb-1" {...props} />,
                                    h3: ({ node, ...props }) => <h3 className="text-lg font-medium text-foreground mt-4 mb-2" {...props} />,
                                    p: ({ node, ...props }) => <p className="text-muted-foreground leading-7 mb-4" {...props} />,
                                    ul: ({ node, ...props }) => <ul className="list-disc list-inside space-y-1 mb-4 text-muted-foreground" {...props} />,
                                    ol: ({ node, ...props }) => <ol className="list-decimal list-inside space-y-1 mb-4 text-muted-foreground" {...props} />,
                                    li: ({ node, ...props }) => <li className="" {...props} />,
                                    strong: ({ node, ...props }) => <span className="font-semibold text-foreground bg-primary/10 px-1 rounded-sm" {...props} />,
                                    blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-primary/30 pl-4 italic text-muted-foreground my-4" {...props} />,
                                    code: ({ node, ...props }) => <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground" {...props} />,
                                    table: ({ node, ...props }) => <div className="my-4 w-full overflow-y-auto"><table className="w-full text-sm border-collapse" {...props} /></div>,
                                    thead: ({ node, ...props }) => <thead className="bg-muted text-muted-foreground" {...props} />,
                                    tbody: ({ node, ...props }) => <tbody className="[&_tr:last-child]:border-0" {...props} />,
                                    tr: ({ node, ...props }) => <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted" {...props} />,
                                    th: ({ node, ...props }) => <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0" {...props} />,
                                    td: ({ node, ...props }) => <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0" {...props} />,
                                }}
                            >
                                {analysis.ai_analysis}
                            </ReactMarkdown>
                        </CardContent>
                    </Card>

                    {/* Charts */}
                    <Card className="md:col-span-1">
                        <CardHeader>
                            <CardTitle>{t('analyze.spending_history')}</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={analysis.chart_data}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="amount" stroke="#237ADD" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card className="md:col-span-1">
                        <CardHeader>
                            <CardTitle>{t('analyze.top_items')}</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={analysis.top_items} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" />
                                    <YAxis dataKey="name" type="category" width={100} />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#659BD6" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
