import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface LoginProps {
    onLogin: (token: string, user: any) => void;
}

export default function Login({ onLogin }: LoginProps) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const loginMutation = trpc.auth.login.useMutation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        try {
            const result = await loginMutation.mutateAsync({
                email,
                password,
            });

            if (result.success && result.token && result.user) {
                localStorage.setItem("auth_token", result.token);
                localStorage.setItem("user", JSON.stringify(result.user));
                onLogin(result.token, result.user);
            } else {
                setError("Erro ao fazer login. Tente novamente.");
            }
        } catch (err: any) {
            console.error("Login error:", err);
            setError(err.message || "Email ou senha incorretos");
        }
    };

    const isLoading = loginMutation.isPending;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100">
            <div className="w-full max-w-md">
                {/* Logo e Título */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#005A8C] to-blue-600 rounded-2xl shadow-lg mb-4">
                        <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-serif font-bold text-[#005A8C] mb-2">
                        Joalheria Analytics
                    </h1>
                    <p className="text-neutral-600">
                        Análise inteligente de dados com IA
                    </p>
                </div>

                {/* Card de Login */}
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-neutral-200">
                    <h2 className="text-2xl font-semibold text-neutral-900 mb-6">
                        Entrar
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email */}
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-neutral-700 mb-2"
                            >
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#005A8C] focus:border-transparent outline-none transition-all"
                                placeholder="seu@email.com"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        {/* Senha */}
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-neutral-700 mb-2"
                            >
                                Senha
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#005A8C] focus:border-transparent outline-none transition-all"
                                placeholder="••••••••"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        {/* Erro */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        {/* Botão de Login */}
                        <Button
                            type="submit"
                            className="w-full bg-[#005A8C] hover:bg-[#004B87] text-white py-3 text-base font-medium shadow-md"
                            disabled={isLoading}
                        >
                            {isLoading ? "Entrando..." : "Entrar"}
                        </Button>
                    </form>

                    {/* Credenciais de Demonstração */}
                    <div className="mt-6 pt-6 border-t border-neutral-200">
                        <p className="text-xs text-neutral-500 text-center mb-3">
                            Credenciais de demonstração:
                        </p>
                        <div className="bg-neutral-50 rounded-lg p-3 text-xs font-mono text-neutral-700 space-y-1">
                            <div>
                                <span className="text-neutral-500">Email:</span> demo@joalheria.com
                            </div>
                            <div>
                                <span className="text-neutral-500">Senha:</span> qualquer senha
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-sm text-neutral-500 mt-6">
                    © 2025 Joalheria Analytics. Todos os direitos reservados.
                </p>
            </div>
        </div>
    );
}
