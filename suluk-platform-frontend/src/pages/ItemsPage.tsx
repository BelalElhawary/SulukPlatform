import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil } from "lucide-react";
// Select component from shadcn would be nice, but using native select for speed
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select" 

interface Item {
    id: number;
    name: string;
    type: string;
    price: number;
    created_at: string;
}

export default function ItemsPage() {
    const { api } = useAuth();
    const [items, setItems] = useState<Item[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newItem, setNewItem] = useState({ name: "", type: "Product", price: "" });

    // Edit State
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Item | null>(null);
    const [editItemForm, setEditItemForm] = useState({ name: "", type: "Product", price: "" });

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            const response = await api.get("/items/");
            setItems(response.data);
        } catch (error) {
            console.error("Failed to fetch items", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post("/items/", { ...newItem, price: parseFloat(newItem.price) });
            setNewItem({ name: "", type: "Product", price: "" });
            setIsDialogOpen(false);
            fetchItems();
        } catch (error) {
            console.error("Failed to create item", error);
        }
    };

    const handleEditClick = (item: Item) => {
        setEditingItem(item);
        setEditItemForm({ name: item.name, type: item.type, price: item.price.toString() });
        setIsEditDialogOpen(true);
    };

    const handleUpdateItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem) return;
        try {
            await api.put(`/items/${editingItem.id}`, { ...editItemForm, price: parseFloat(editItemForm.price) });
            setIsEditDialogOpen(false);
            setEditingItem(null);
            fetchItems();
        } catch (error) {
            console.error("Failed to update item", error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-3xl font-bold tracking-tight">Items & Services</h1>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="w-full sm:w-auto">
                            <Plus className="me-2 h-4 w-4" /> Add Item
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Item/Service</DialogTitle>
                            <DialogDescription>
                                Enter the item details below.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddItem}>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="name" className="text-end">
                                        Name
                                    </Label>
                                    <Input
                                        id="name"
                                        value={newItem.name}
                                        onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                        className="col-span-3"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="type" className="text-end">
                                        Type
                                    </Label>
                                    <div className="col-span-3">
                                        <select
                                            id="type"
                                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            value={newItem.type}
                                            onChange={(e) => setNewItem({ ...newItem, type: e.target.value })}
                                        >
                                            <option value="Product">Product</option>
                                            <option value="Service">Service</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="price" className="text-end">
                                        Price
                                    </Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        step="0.01"
                                        value={newItem.price}
                                        onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                                        className="col-span-3"
                                        required
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit">Save Item</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="border rounded-md overflow-x-auto">
                <Table className="min-w-[600px]">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead className="text-end">Created</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24">Loading...</TableCell>
                            </TableRow>
                        ) : items.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24">No items found.</TableCell>
                            </TableRow>
                        ) : (
                            items.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${item.type === 'Service' ? 'bg-secondary text-secondary-foreground' : 'bg-primary/10 text-primary'}`}>
                                            {item.type}
                                        </span>
                                    </TableCell>
                                    <TableCell>${item.price.toFixed(2)}</TableCell>
                                    <TableCell className="text-end">{new Date(item.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(item)}>
                                            <Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Item/Service</DialogTitle>
                        <DialogDescription>
                            Update the item details below.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdateItem}>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-name" className="text-end">
                                    Name
                                </Label>
                                <Input
                                    id="edit-name"
                                    value={editItemForm.name}
                                    onChange={(e) => setEditItemForm({ ...editItemForm, name: e.target.value })}
                                    className="col-span-3"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-type" className="text-end">
                                    Type
                                </Label>
                                <div className="col-span-3">
                                    <select
                                        id="edit-type"
                                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={editItemForm.type}
                                        onChange={(e) => setEditItemForm({ ...editItemForm, type: e.target.value })}
                                    >
                                        <option value="Product">Product</option>
                                        <option value="Service">Service</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-price" className="text-end">
                                    Price
                                </Label>
                                <Input
                                    id="edit-price"
                                    type="number"
                                    step="0.01"
                                    value={editItemForm.price}
                                    onChange={(e) => setEditItemForm({ ...editItemForm, price: e.target.value })}
                                    className="col-span-3"
                                    required
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                            <Button type="submit">Update Item</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
