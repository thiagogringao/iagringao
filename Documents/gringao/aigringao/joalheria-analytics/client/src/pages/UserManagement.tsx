import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Users, Plus, Pencil, Trash2, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface User {
    id: number;
    email: string | null;
    name: string | null;
    role: string;
    createdAt: Date;
}

export default function UserManagement() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        email: "",
        name: "",
        password: "",
        role: "user" as "user" | "admin",
    });

    const { data: users, refetch } = trpc.auth.listUsers.useQuery();

    const createUserMutation = trpc.auth.createUser.useMutation({
        onSuccess: () => {
            refetch();
            closeModal();
            alert("Usuário criado com sucesso!");
        },
        onError: (error) => {
            alert(`Erro: ${error.message}`);
        },
    });

    const updateUserMutation = trpc.auth.updateUser.useMutation({
        onSuccess: () => {
            refetch();
            closeModal();
            alert("Usuário atualizado com sucesso!");
        },
        onError: (error) => {
            alert(`Erro: ${error.message}`);
        },
    });

    const deleteUserMutation = trpc.auth.deleteUser.useMutation({
        onSuccess: () => {
            refetch();
            alert("Usuário deletado com sucesso!");
        },
        onError: (error) => {
            alert(`Erro: ${error.message}`);
        },
    });

    const openModal = (user?: User) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                email: user.email || "",
                name: user.name || "",
                password: "",
                role: user.role as "user" | "admin",
            });
        } else {
            setEditingUser(null);
            setFormData({
                email: "",
                name: "",
                password: "",
                role: "user",
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
        setFormData({
            email: "",
            name: "",
            password: "",
            role: "user",
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingUser) {
            // Atualizar
            updateUserMutation.mutate({
                id: editingUser.id,
                ...formData,
                password: formData.password || undefined,
            });
        } else {
            // Criar
            createUserMutation.mutate(formData);
        }
    };

    const handleDelete = (id: number) => {
        if (confirm("Tem certeza que deseja deletar este usuário?")) {
            deleteUserMutation.mutate({ id });
        }
    };

    return (
        <div className="min-h-screen bg-neutral-50 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-[#005A8C]/10 rounded-lg flex items-center justify-center">
                                <Users className="w-6 h-6 text-[#005A8C]" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-neutral-900">
                                    Gerenciamento de Usuários
                                </h1>
                                <p className="text-sm text-neutral-600">
                                    Crie e gerencie usuários do sistema
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={() => openModal()}
                            className="bg-[#005A8C] hover:bg-[#004B87] gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Novo Usuário
                        </Button>
                    </div>
                </div>

                {/* Tabela de Usuários */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-neutral-50 border-b border-neutral-200">
                            <tr>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-neutral-700">
                                    Nome
                                </th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-neutral-700">
                                    Email
                                </th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-neutral-700">
                                    Função
                                </th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-neutral-700">
                                    Criado em
                                </th>
                                <th className="text-right px-6 py-4 text-sm font-semibold text-neutral-700">
                                    Ações
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200">
                            {users?.map((user) => (
                                <tr key={user.id} className="hover:bg-neutral-50">
                                    <td className="px-6 py-4 text-sm text-neutral-900">
                                        {user.name || "—"}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-neutral-600">
                                        {user.email || "—"}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${user.role === "admin"
                                                    ? "bg-purple-100 text-purple-700"
                                                    : "bg-blue-100 text-blue-700"
                                                }`}
                                        >
                                            {user.role === "admin" ? "Administrador" : "Usuário"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-neutral-600">
                                        {format(new Date(user.createdAt), "dd/MM/yyyy", {
                                            locale: ptBR,
                                        })}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => openModal(user)}
                                                className="text-neutral-600 hover:text-[#005A8C]"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(user.id)}
                                                className="text-neutral-600 hover:text-red-500"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {(!users || users.length === 0) && (
                        <div className="text-center py-12">
                            <Users className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                            <p className="text-neutral-600">Nenhum usuário encontrado</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de Criar/Editar */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        {/* Header do Modal */}
                        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
                            <h2 className="text-xl font-semibold text-neutral-900">
                                {editingUser ? "Editar Usuário" : "Novo Usuário"}
                            </h2>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={closeModal}
                                className="text-neutral-500 hover:text-neutral-700"
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Formulário */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Nome
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#005A8C] focus:border-transparent outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) =>
                                        setFormData({ ...formData, email: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#005A8C] focus:border-transparent outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Senha {editingUser && "(deixe em branco para não alterar)"}
                                </label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) =>
                                        setFormData({ ...formData, password: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#005A8C] focus:border-transparent outline-none"
                                    required={!editingUser}
                                    minLength={6}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Função
                                </label>
                                <select
                                    value={formData.role}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            role: e.target.value as "user" | "admin",
                                        })
                                    }
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#005A8C] focus:border-transparent outline-none"
                                >
                                    <option value="user">Usuário</option>
                                    <option value="admin">Administrador</option>
                                </select>
                            </div>

                            {/* Botões */}
                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={closeModal}
                                    className="flex-1"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1 bg-[#005A8C] hover:bg-[#004B87]"
                                    disabled={
                                        createUserMutation.isPending || updateUserMutation.isPending
                                    }
                                >
                                    {createUserMutation.isPending || updateUserMutation.isPending
                                        ? "Salvando..."
                                        : editingUser
                                            ? "Atualizar"
                                            : "Criar"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
