import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil } from "lucide-react";

interface Client {
    id: number;
    name: string;
    email: string;
    phone: string;
    created_at: string;
}

export default function ClientsPage() {
    const { api } = useAuth();
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newClient, setNewClient] = useState({ name: "", email: "", phone: "" });

    // Edit State
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [editClientForm, setEditClientForm] = useState({ name: "", email: "", phone: "" });

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            const response = await api.get("/clients/");
            setClients(response.data);
        } catch (error) {
            console.error("Failed to fetch clients", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddClient = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post("/clients/", newClient);
            setNewClient({ name: "", email: "", phone: "" });
            setIsDialogOpen(false);
            fetchClients();
        } catch (error) {
            console.error("Failed to create client", error);
        }
    };

    const handleEditClick = (client: Client) => {
        setEditingClient(client);
        setEditClientForm({ name: client.name, email: client.email || "", phone: client.phone || "" });
        setIsEditDialogOpen(true);
    };

    const handleUpdateClient = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingClient) return;
        try {
            await api.put(`/clients/${editingClient.id}`, editClientForm);
            setIsEditDialogOpen(false);
            setEditingClient(null);
            fetchClients();
        } catch (error) {
            console.error("Failed to update client", error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="w-full sm:w-auto">
                            <Plus className="me-2 h-4 w-4" /> Add Client
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Client</DialogTitle>
                            <DialogDescription>
                                Enter the client's details below.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddClient}>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="name" className="text-end">
                                        Name
                                    </Label>
                                    <Input
                                        id="name"
                                        value={newClient.name}
                                        onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                                        className="col-span-3"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="email" className="text-end">
                                        Email
                                    </Label>
                                    <Input
                                        id="email"
                                        value={newClient.email}
                                        onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                                        className="col-span-3"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="phone" className="text-end">
                                        Phone
                                    </Label>
                                    <Input
                                        id="phone"
                                        value={newClient.phone}
                                        onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                                        className="col-span-3"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit">Save Client</Button>
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
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead className="text-end">Joined</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24">Loading...</TableCell>
                            </TableRow>
                        ) : clients.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24">No clients found.</TableCell>
                            </TableRow>
                        ) : (
                            clients.map((client) => (
                                <TableRow key={client.id}>
                                    <TableCell className="font-medium">{client.name}</TableCell>
                                    <TableCell>{client.email}</TableCell>
                                    <TableCell>{client.phone}</TableCell>
                                    <TableCell className="text-end">{new Date(client.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(client)}>
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
                        <DialogTitle>Edit Client</DialogTitle>
                        <DialogDescription>
                            Update the client's details below.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdateClient}>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-name" className="text-end">
                                    Name
                                </Label>
                                <Input
                                    id="edit-name"
                                    value={editClientForm.name}
                                    onChange={(e) => setEditClientForm({ ...editClientForm, name: e.target.value })}
                                    className="col-span-3"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-email" className="text-end">
                                    Email
                                </Label>
                                <Input
                                    id="edit-email"
                                    value={editClientForm.email}
                                    onChange={(e) => setEditClientForm({ ...editClientForm, email: e.target.value })}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-phone" className="text-end">
                                    Phone
                                </Label>
                                <Input
                                    id="edit-phone"
                                    value={editClientForm.phone}
                                    onChange={(e) => setEditClientForm({ ...editClientForm, phone: e.target.value })}
                                    className="col-span-3"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                            <Button type="submit">Update Client</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
