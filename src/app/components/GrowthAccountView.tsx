import { useState } from "react";
import { GrowthAccountData, QuarterData } from "@/app/types";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Plus } from "lucide-react";
import { getCurrentYear, getCurrentQuarter } from "@/app/utils/quarterHelpers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { GrowthAccountRow } from "@/app/components/GrowthAccountRow";
import { createGrowthAccount, deleteGrowthAccount, updateGrowthAccount } from "@/app/data/growthRepo";

interface GrowthAccountViewProps {
  accounts: GrowthAccountData[];
  onAccountsChange: (accounts: GrowthAccountData[]) => void;
  quarterData: QuarterData[];
}

export function GrowthAccountView({
  accounts,
  onAccountsChange,
  quarterData,
}: GrowthAccountViewProps) {
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());
  const [selectedQuarter, setSelectedQuarter] = useState<1 | 2 | 3 | 4>(
    getCurrentQuarter()
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newAccount, setNewAccount] = useState({
    accountName: "",
    initialCapital: "",
    brokerPropfirm: "",
    proposito: "Práctica" as "Práctica" | "Evaluación" | "Fondeada" | "Real",
    monthlyTarget: "",
    ciclo: "Fase 1" as "Fase 1" | "Fase 2" | "Fase 3" | undefined,
    mes: "" as string,
  });

  // Filter accounts by selected year
  const filteredAccounts = accounts.filter((acc) => acc.year === selectedYear);

  // Get months that already have accounts for the selected year and quarter
  const usedMonths = accounts
    .filter((acc) => acc.year === selectedYear && acc.quarter === selectedQuarter)
    .map((acc) => acc.mes);

  // Available years
  const availableYears = Array.from(
    new Set([
      ...accounts.map((a) => a.year),
      getCurrentYear(),
      getCurrentYear() - 1,
      getCurrentYear() + 1,
    ])
  ).sort((a, b) => b - a);

  const handleAddAccount = async () => {
    // Validate that there isn't already an account for this month
    const existingAccount = accounts.find(
      (acc) =>
        acc.year === selectedYear &&
        acc.quarter === selectedQuarter &&
        acc.mes === newAccount.mes
    );

    if (existingAccount) {
      alert(`Ya existe una cuenta para ${newAccount.mes}. Solo se permite un registro por mes.`);
      return;
    }

    const accountPayload: Omit<GrowthAccountData, "id"> = {
      accountName: newAccount.accountName,
      initialCapital: parseFloat(newAccount.initialCapital) || 0,
      brokerPropfirm: newAccount.brokerPropfirm,
      proposito: newAccount.proposito,
      year: selectedYear,
      quarter: selectedQuarter,
      mes: newAccount.mes,
      gananciaMensual: 0,
      monthlyTarget: parseFloat(newAccount.monthlyTarget) || 0,
      ciclo: newAccount.ciclo,
      promedioMes: 0,
      estado: "En progreso",
    };

    try {
      const created = await createGrowthAccount(accountPayload);
      onAccountsChange([...accounts, created]);
    } catch (e) {
      console.error(e);
      return;
    }
    setIsDialogOpen(false);
    setNewAccount({
      accountName: "",
      initialCapital: "",
      brokerPropfirm: "",
      proposito: "Práctica",
      monthlyTarget: "",
      ciclo: "Fase 1",
      mes: "",
    });
  };

  const handleDeleteAccount = async (id: string) => {
    onAccountsChange(accounts.filter((a) => a.id !== id));

    try {
      await deleteGrowthAccount(id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateAccount = async (updatedAccount: GrowthAccountData) => {
    onAccountsChange(accounts.map((a) => (a.id === updatedAccount.id ? updatedAccount : a)));

    try {
      const saved = await updateGrowthAccount(updatedAccount.id, updatedAccount);
      onAccountsChange(accounts.map((a) => (a.id === saved.id ? saved : a)));
    } catch (e) {
      console.error(e);
    }
  };

  // Get accounts for current selected quarter
  const quarterAccounts = filteredAccounts.filter(
    (acc) => acc.quarter === selectedQuarter
  );

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Select
          value={selectedYear.toString()}
          onValueChange={(value) => setSelectedYear(parseInt(value))}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableYears.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Add Account Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#416E87] hover:bg-[#355a6d]">
              <Plus className="w-4 h-4 mr-2" />
              Agregar Nueva Cuenta
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Nueva Growth Account</DialogTitle>
              <DialogDescription>
                La cuenta se creará para el año {selectedYear} - Q{selectedQuarter}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nombre de Cuenta</Label>
                <Input
                  placeholder="FTMO - Demo"
                  value={newAccount.accountName}
                  onChange={(e) =>
                    setNewAccount({ ...newAccount, accountName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Capital Inicial</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="10000"
                  value={newAccount.initialCapital}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setNewAccount({ ...newAccount, initialCapital: value });
                  }}
                  onFocus={(e) => e.target.select()}
                />
              </div>
              <div className="space-y-2">
                <Label>Broker / Prop Firm</Label>
                <Input
                  placeholder="FTMO, MyForexFunds..."
                  value={newAccount.brokerPropfirm}
                  onChange={(e) =>
                    setNewAccount({ ...newAccount, brokerPropfirm: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Propósito</Label>
                <Select
                  value={newAccount.proposito}
                  onValueChange={(value: "Práctica" | "Evaluación" | "Fondeada" | "Real") =>
                    setNewAccount({ ...newAccount, proposito: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Práctica">Práctica</SelectItem>
                    <SelectItem value="Evaluación">Evaluación</SelectItem>
                    <SelectItem value="Fondeada">Fondeada</SelectItem>
                    <SelectItem value="Real">Real</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Monthly Target</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="1000"
                  value={newAccount.monthlyTarget}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setNewAccount({ ...newAccount, monthlyTarget: value });
                  }}
                  onFocus={(e) => e.target.select()}
                />
              </div>
              
              {/* Ciclo - Solo mostrar si propósito es Práctica o Evaluación */}
              {(newAccount.proposito === "Práctica" || newAccount.proposito === "Evaluación") && (
                <div className="space-y-2">
                  <Label>Ciclo</Label>
                  <Select
                    value={newAccount.ciclo || "Fase 1"}
                    onValueChange={(value: "Fase 1" | "Fase 2" | "Fase 3") =>
                      setNewAccount({ ...newAccount, ciclo: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fase 1">Fase 1</SelectItem>
                      <SelectItem value="Fase 2">Fase 2</SelectItem>
                      {newAccount.proposito === "Práctica" && (
                        <SelectItem value="Fase 3">Fase 3</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="space-y-2">
                <Label>Mes</Label>
                <Select
                  value={newAccount.mes}
                  onValueChange={(value) =>
                    setNewAccount({ ...newAccount, mes: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un mes" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedQuarter === 1 && (
                      <>
                        <SelectItem value="Enero" disabled={usedMonths.includes("Enero")}>
                          Enero {usedMonths.includes("Enero") && "(Ya registrado - Edita la fila para modificar)"}
                        </SelectItem>
                        <SelectItem value="Febrero" disabled={usedMonths.includes("Febrero")}>
                          Febrero {usedMonths.includes("Febrero") && "(Ya registrado - Edita la fila para modificar)"}
                        </SelectItem>
                        <SelectItem value="Marzo" disabled={usedMonths.includes("Marzo")}>
                          Marzo {usedMonths.includes("Marzo") && "(Ya registrado - Edita la fila para modificar)"}
                        </SelectItem>
                      </>
                    )}
                    {selectedQuarter === 2 && (
                      <>
                        <SelectItem value="Abril" disabled={usedMonths.includes("Abril")}>
                          Abril {usedMonths.includes("Abril") && "(Ya registrado - Edita la fila para modificar)"}
                        </SelectItem>
                        <SelectItem value="Mayo" disabled={usedMonths.includes("Mayo")}>
                          Mayo {usedMonths.includes("Mayo") && "(Ya registrado - Edita la fila para modificar)"}
                        </SelectItem>
                        <SelectItem value="Junio" disabled={usedMonths.includes("Junio")}>
                          Junio {usedMonths.includes("Junio") && "(Ya registrado - Edita la fila para modificar)"}
                        </SelectItem>
                      </>
                    )}
                    {selectedQuarter === 3 && (
                      <>
                        <SelectItem value="Julio" disabled={usedMonths.includes("Julio")}>
                          Julio {usedMonths.includes("Julio") && "(Ya registrado - Edita la fila para modificar)"}
                        </SelectItem>
                        <SelectItem value="Agosto" disabled={usedMonths.includes("Agosto")}>
                          Agosto {usedMonths.includes("Agosto") && "(Ya registrado - Edita la fila para modificar)"}
                        </SelectItem>
                        <SelectItem value="Septiembre" disabled={usedMonths.includes("Septiembre")}>
                          Septiembre {usedMonths.includes("Septiembre") && "(Ya registrado - Edita la fila para modificar)"}
                        </SelectItem>
                      </>
                    )}
                    {selectedQuarter === 4 && (
                      <>
                        <SelectItem value="Octubre" disabled={usedMonths.includes("Octubre")}>
                          Octubre {usedMonths.includes("Octubre") && "(Ya registrado - Edita la fila para modificar)"}
                        </SelectItem>
                        <SelectItem value="Noviembre" disabled={usedMonths.includes("Noviembre")}>
                          Noviembre {usedMonths.includes("Noviembre") && "(Ya registrado - Edita la fila para modificar)"}
                        </SelectItem>
                        <SelectItem value="Diciembre" disabled={usedMonths.includes("Diciembre")}>
                          Diciembre {usedMonths.includes("Diciembre") && "(Ya registrado - Edita la fila para modificar)"}
                        </SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Solo se permite un registro por mes
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAddAccount}
                className="bg-[#416E87] hover:bg-[#355a6d]"
                disabled={
                  !newAccount.accountName ||
                  !newAccount.initialCapital ||
                  !newAccount.brokerPropfirm ||
                  !newAccount.mes
                }
              >
                Crear Cuenta
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quarter Tabs */}
      <Tabs
        value={selectedQuarter.toString()}
        onValueChange={(value) => setSelectedQuarter(parseInt(value) as 1 | 2 | 3 | 4)}
      >
        <TabsList className="w-full grid grid-cols-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <TabsTrigger
            value="1"
            className="data-[state=active]:bg-[#416E87] data-[state=active]:text-white"
          >
            Q1
          </TabsTrigger>
          <TabsTrigger
            value="2"
            className="data-[state=active]:bg-[#416E87] data-[state=active]:text-white"
          >
            Q2
          </TabsTrigger>
          <TabsTrigger
            value="3"
            className="data-[state=active]:bg-[#416E87] data-[state=active]:text-white"
          >
            Q3
          </TabsTrigger>
          <TabsTrigger
            value="4"
            className="data-[state=active]:bg-[#416E87] data-[state=active]:text-white"
          >
            Q4
          </TabsTrigger>
        </TabsList>

        {[1, 2, 3, 4].map((q) => (
          <TabsContent key={q} value={q.toString()} className="mt-6">
            <Card className="border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-xl">
                  Growth Account — Q{q} {selectedYear}
                </CardTitle>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Las métricas del Growth Account se calculan automáticamente a partir
                  del Trading Journal.
                </p>
              </CardHeader>
              <CardContent>
                {quarterAccounts.length > 0 ? (
                  <div className="overflow-x-auto">
                    <div className="min-w-[1200px]">
                      {/* Table Header */}
                      <div className="grid grid-cols-10 gap-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-t-lg border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-700 dark:text-gray-300">
                        <div className="col-span-1">Account Name</div>
                        <div className="col-span-1">Initial Capital</div>
                        <div className="col-span-1">Broker/Prop Firm</div>
                        <div className="col-span-1">Propósito</div>
                        <div className="col-span-1">Mes</div>
                        <div className="col-span-1">Ganancia Mensual</div>
                        <div className="col-span-1">Monthly Target</div>
                        <div className="col-span-1">Ciclo</div>
                        <div className="col-span-1">Promedio Mes</div>
                        <div className="col-span-1">Estado</div>
                      </div>

                      {/* Table Rows */}
                      <div className="border-x border-b border-gray-200 dark:border-gray-700 rounded-b-lg">
                        {quarterAccounts.map((account) => (
                          <GrowthAccountRow
                            key={account.id}
                            account={account}
                            onDelete={() => handleDeleteAccount(account.id)}
                            onUpdate={handleUpdateAccount}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      No hay cuentas registradas para este trimestre
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(true)}
                      className="border-[#416E87] text-[#416E87]"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar Primera Cuenta
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}