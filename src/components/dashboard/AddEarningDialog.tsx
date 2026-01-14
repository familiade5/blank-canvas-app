import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const schema = z.object({
  app: z.enum(["uber", "99", "ifood", "rappi", "loggi", "lalamove", "uber_eats", "outros"]),
  amount: z.number().positive("Valor deve ser maior que zero"),
  date: z.date(),
  trips_count: z.number().int().positive().optional(),
  hours_worked: z.number().positive().optional(),
  km_traveled: z.number().positive().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface AddEarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const appOptions = [
  { value: "uber", label: "Uber" },
  { value: "99", label: "99" },
  { value: "ifood", label: "iFood" },
  { value: "rappi", label: "Rappi" },
  { value: "loggi", label: "Loggi" },
  { value: "lalamove", label: "Lalamove" },
  { value: "uber_eats", label: "Uber Eats" },
  { value: "outros", label: "Outros" },
];

const AddEarningDialog = ({ open, onOpenChange, onSuccess }: AddEarningDialogProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      app: "uber",
      amount: 0,
      date: new Date(),
      trips_count: 1,
    },
  });

  const onSubmit = async (data: FormData) => {
    if (!user) return;
    setLoading(true);

    try {
      const { error } = await supabase.from("earnings").insert({
        user_id: user.id,
        app: data.app,
        amount: data.amount,
        date: format(data.date, "yyyy-MM-dd"),
        trips_count: data.trips_count,
        hours_worked: data.hours_worked,
        km_traveled: data.km_traveled,
        notes: data.notes,
      });

      if (error) throw error;

      toast({
        title: "Ganho registrado!",
        description: `R$ ${data.amount.toFixed(2)} adicionado com sucesso.`,
      });

      form.reset();
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao registrar",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Ganho</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>App</Label>
              <Select
                value={form.watch("app")}
                onValueChange={(value: any) => form.setValue("app", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o app" />
                </SelectTrigger>
                <SelectContent>
                  {appOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0,00"
                {...form.register("amount", { valueAsNumber: true })}
              />
              {form.formState.errors.amount && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.amount.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(form.watch("date"), "dd/MM/yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={form.watch("date")}
                    onSelect={(date) => date && form.setValue("date", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Corridas</Label>
              <Input
                type="number"
                placeholder="1"
                {...form.register("trips_count", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Horas trabalhadas</Label>
              <Input
                type="number"
                step="0.5"
                placeholder="0"
                {...form.register("hours_worked", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label>Km rodados</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="0"
                {...form.register("km_traveled", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              placeholder="Notas sobre este ganho..."
              {...form.register("notes")}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="gradient-accent text-accent-foreground"
              disabled={loading}
            >
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEarningDialog;
