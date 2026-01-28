import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";

export interface GrowthAccount {
  id: string;
  accountName: string;
  initialCapital: string;
  brokerPropfirm: string;
  proposito: string;
  mes: string;
  gananciaMensual: string;
  monthlyTarget: string;
  ciclo: string;
  promedioMes: string;
  nota: string;
}

interface GrowthAccountTableProps {
  accounts: GrowthAccount[];
  onAccountsChange: (accounts: GrowthAccount[]) => void;
}

export function GrowthAccountTable({
  accounts,
  onAccountsChange,
}: GrowthAccountTableProps) {
  const [editingCell, setEditingCell] = useState<{
    accountId: string;
    field: keyof GrowthAccount;
  } | null>(null);

  const handleCellChange = (
    accountId: string,
    field: keyof GrowthAccount,
    value: string
  ) => {
    const updatedAccounts = accounts.map((acc) =>
      acc.id === accountId ? { ...acc, [field]: value } : acc
    );
    onAccountsChange(updatedAccounts);
  };

  const handleAddAccount = () => {
    const newAccount: GrowthAccount = {
      id: Date.now().toString(),
      accountName: "",
      initialCapital: "",
      brokerPropfirm: "",
      proposito: "",
      mes: "",
      gananciaMensual: "",
      monthlyTarget: "",
      ciclo: "",
      promedioMes: "",
      nota: "",
    };
    onAccountsChange([...accounts, newAccount]);
  };

  const handleDeleteAccount = (accountId: string) => {
    onAccountsChange(accounts.filter((acc) => acc.id !== accountId));
  };

  const renderEditableCell = (
    account: GrowthAccount,
    field: keyof GrowthAccount,
    placeholder: string
  ) => {
    const isEditing =
      editingCell?.accountId === account.id && editingCell?.field === field;

    return (
      <td className="border border-gray-200 dark:border-gray-700 p-0">
        <input
          type="text"
          value={account[field]}
          onChange={(e) => handleCellChange(account.id, field, e.target.value)}
          onFocus={() => setEditingCell({ accountId: account.id, field })}
          onBlur={() => setEditingCell(null)}
          placeholder={placeholder}
          className={`w-full h-full px-3 py-2 outline-none transition-colors ${
            isEditing
              ? "bg-blue-50 dark:bg-blue-900/30 border-2 border-[#416E87]"
              : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
          }`}
        />
      </td>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Growth Account</h2>
        <button
          onClick={handleAddAccount}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-[#416E87] text-white rounded-lg hover:bg-[#355a6e] transition-colors text-sm sm:text-base w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Cuenta</span>
        </button>
      </div>

      {/* Table container with horizontal scroll on mobile */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1200px] border-collapse">
          <thead className="sticky top-0 bg-gray-50 dark:bg-gray-900 z-10">
            <tr>
              <th className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase min-w-[150px]">
                Account Name
              </th>
              <th className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase min-w-[120px]">
                Initial Capital
              </th>
              <th className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase min-w-[150px]">
                Broker / Propfirm
              </th>
              <th className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase min-w-[150px]">
                Propósito
              </th>
              <th className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase min-w-[100px]">
                Mes
              </th>
              <th className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase min-w-[120px]">
                Ganancia Mensual
              </th>
              <th className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase min-w-[120px]">
                Monthly Target
              </th>
              <th className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase min-w-[100px]">
                Ciclo
              </th>
              <th className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase min-w-[120px]">
                Promedio Mes
              </th>
              <th className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase min-w-[200px]">
                Nota
              </th>
              <th className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-center text-xs font-medium text-gray-600 dark:text-gray-400 uppercase min-w-[80px]">
                Acción
              </th>
            </tr>
          </thead>
          <tbody>
            {accounts.length === 0 ? (
              <tr>
                <td
                  colSpan={11}
                  className="border border-gray-200 dark:border-gray-700 px-4 py-12 text-center text-gray-500 dark:text-gray-400"
                >
                  No hay cuentas registradas. Haz clic en \"Nueva Cuenta\" para comenzar.
                </td>
              </tr>
            ) : (
              <>
                {accounts.map((account) => (
                  <tr key={account.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    {renderEditableCell(account, "accountName", "Nombre")}
                    {renderEditableCell(account, "initialCapital", "$0")}
                    {renderEditableCell(account, "brokerPropfirm", "Broker")}
                    {renderEditableCell(account, "proposito", "Propósito")}
                    {renderEditableCell(account, "mes", "Mes")}
                    {renderEditableCell(account, "gananciaMensual", "$0")}
                    {renderEditableCell(account, "monthlyTarget", "$0")}
                    {renderEditableCell(account, "ciclo", "Ciclo")}
                    {renderEditableCell(account, "promedioMes", "0%")}
                    {renderEditableCell(account, "nota", "Notas")}
                    <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-center">
                      <button
                        onClick={() => handleDeleteAccount(account.id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                        title="Eliminar cuenta"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {/* Empty row for quick add */}
                <tr className="bg-gray-50 dark:bg-gray-900">
                  <td
                    colSpan={11}
                    className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-center text-gray-400 dark:text-gray-500 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    onClick={handleAddAccount}
                  >
                    + Agregar nueva cuenta
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}