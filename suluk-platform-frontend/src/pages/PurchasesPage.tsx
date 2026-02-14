import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";

interface Purchase {
    id: number;
    client_name: string;
    total_amount: number;
    created_at: string;
}

interface Client {
    id: number;
    name: string;
}

interface Item {
    id: number;
    name: string;
    price: number;
}

interface PurchaseItemEntry {
    item_id: number;
    quantity: number;
    unit_price: number; // Snapshot price
}

export default function PurchasesPage() {
    const { api } = useAuth();
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [items, setItems] = useState<Item[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Form State
    const [selectedClientId, setSelectedClientId] = useState<number | "">("");
    const [cart, setCart] = useState<PurchaseItemEntry[]>([]);
    const [selectedItemId, setSelectedItemId] = useState<number | "">("");
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        fetchPurchases();
        fetchClients();
        fetchItems();
    }, []);

    const fetchPurchases = async () => {
        try {
            const response = await api.get("/purchases/");
            setPurchases(response.data);
        } catch (error) {
            console.error("Failed to fetch purchases", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchClients = async () => {
        try {
            const response = await api.get("/clients/");
            setClients(response.data);
        } catch (error) { console.error(error); }
    };

    const fetchItems = async () => {
        try {
            const response = await api.get("/items/");
            setItems(response.data);
        } catch (error) { console.error(error); }
    };

    const handleAddItemToCart = () => {
        if (!selectedItemId) return;
        const item = items.find(i => i.id === Number(selectedItemId));
        if (!item) return;

        setCart([...cart, {
            item_id: item.id,
            quantity: quantity,
            unit_price: item.price
        }]);
        setSelectedItemId("");
        setQuantity(1);
    };

    const handleRemoveItemFromCart = (index: number) => {
        const newCart = [...cart];
        newCart.splice(index, 1);
        setCart(newCart);
    };

    const handleCreatePurchase = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClientId || cart.length === 0) return;

        try {
            await api.post("/purchases/", {
                client_id: Number(selectedClientId),
                items: cart
            });
            setIsDialogOpen(false);
            setCart([]);
            setSelectedClientId("");
            fetchPurchases();
        } catch (error) {
            console.error("Failed to create purchase", error);
        }
    };

    const calculateTotal = () => {
        return cart.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Purchases History</h1>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> New Purchase
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Record New Purchase</DialogTitle>
                            <DialogDescription>
                                Select a client and add items to the order.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreatePurchase} className="space-y-6">
                            {/* Client Selection */}
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="client" className="text-right">
                                    Client
                                </Label>
                                <select
                                    id="client"
                                    className="col-span-3 flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={selectedClientId}
                                    onChange={(e) => setSelectedClientId(Number(e.target.value))}
                                    required
                                >
                                    <option value="">Select a client...</option>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>

                            {/* Add Item Section */}
                            <div className="border p-4 rounded-md bg-muted/20 space-y-4">
                                <h3 className="text-sm font-medium">Add Items</h3>
                                <div className="flex gap-2 items-end">
                                    <div className="flex-1">
                                        <Label className="mb-2 block">Item/Service</Label>
                                        <select
                                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            value={selectedItemId}
                                            onChange={(e) => setSelectedItemId(Number(e.target.value))}
                                        >
                                            <option value="">Select Item...</option>
                                            {items.map(i => <option key={i.id} value={i.id}>{i.name} (${i.price})</option>)}
                                        </select>
                                    </div>
                                    <div className="w-20">
                                        <Label className="mb-2 block">Qty</Label>
                                        <Input type="number" min="1" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
                                    </div>
                                    <Button type="button" onClick={handleAddItemToCart} disabled={!selectedItemId}>Add</Button>
                                </div>

                                {/* Cart Items List */}
                                <div className="space-y-2 mt-4">
                                    {cart.map((cartItem, index) => {
                                        const itemDef = items.find(i => i.id === cartItem.item_id);
                                        return (
                                            <div key={index} className="flex justify-between items-center bg-background p-2 rounded border">
                                                <span>{itemDef?.name} (x{cartItem.quantity})</span>
                                                <div className="flex items-center gap-4">
                                                    <span>${(cartItem.quantity * cartItem.unit_price).toFixed(2)}</span>
                                                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleRemoveItemFromCart(index)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                    {cart.length > 0 && (
                                        <div className="flex justify-end font-bold pt-2 border-t mt-2">
                                            Total: ${calculateTotal().toFixed(2)}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <DialogFooter>
                                <Button type="submit" disabled={!selectedClientId || cart.length === 0}>Complete Purchase</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Client</TableHead>
                            <TableHead className="text-right">Total Amount</TableHead>
                            <TableHead className="text-right">Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center h-24">Loading...</TableCell>
                            </TableRow>
                        ) : purchases.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center h-24">No purchases found.</TableCell>
                            </TableRow>
                        ) : (
                            purchases.map((purchase) => (
                                <TableRow key={purchase.id}>
                                    <TableCell className="font-medium">{purchase.client_name}</TableCell>
                                    <TableCell className="text-right">${purchase.total_amount.toFixed(2)}</TableCell>
                                    <TableCell className="text-right">{new Date(purchase.created_at).toLocaleDateString()}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
