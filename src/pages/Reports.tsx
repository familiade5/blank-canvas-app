import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

const Reports = () => (
  <DashboardLayout>
    <h1 className="text-2xl font-bold mb-6">Relatórios</h1>
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Relatórios Avançados</CardTitle></CardHeader>
      <CardContent className="p-12 text-center text-muted-foreground">
        Relatórios detalhados disponíveis nos planos Pro e Premium. Visualize seus dados por período, app, categoria e mais!
      </CardContent>
    </Card>
  </DashboardLayout>
);

export default Reports;
