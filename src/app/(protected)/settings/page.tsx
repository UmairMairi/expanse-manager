import type { Metadata } from "next";
import { requireUser } from "@/services/auth.service";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { listCategories } from "@/services/categories.service";
import { listPaymentMethods } from "@/services/payment-methods.service";
import { CategoriesManager } from "@/features/settings/components/categories-manager.client";
import { PaymentMethodsManager } from "@/features/settings/components/payment-methods-manager.client";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUser();
  const [categories, paymentMethods] = await Promise.all([
    listCategories(user.username),
    listPaymentMethods(user.username),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Profile, custom categories, payment methods, and preferences."
      />

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="payment-methods">Payment methods</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Username</span>
                <span className="font-mono">{user.username}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name</span>
                <span>{user.name}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Report recipient email</span>
                <span className="font-mono">{user.email || "—"}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Role</span>
                <span className="capitalize">{user.role}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Custom categories</CardTitle>
            </CardHeader>
            <CardContent>
              <CategoriesManager initial={categories} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment-methods">
          <Card>
            <CardHeader>
              <CardTitle>Payment methods</CardTitle>
            </CardHeader>
            <CardContent>
              <PaymentMethodsManager initial={paymentMethods} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
