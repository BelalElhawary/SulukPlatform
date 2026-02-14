import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function DashboardPage() {
    const { user, logout } = useAuth();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Welcome, {user?.username}!</CardTitle>
                    <CardDescription>You have successfully logged in.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 bg-muted rounded-md break-all">
                        <h3 className="font-semibold mb-2">User Details</h3>
                        <pre className="text-sm whitespace-pre-wrap">
                            {JSON.stringify(user, null, 2)}
                        </pre>
                    </div>
                    <Button onClick={logout} variant="destructive" className="w-full">
                        Logout
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
