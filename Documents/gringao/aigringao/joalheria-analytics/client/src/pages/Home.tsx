import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Sidebar } from "@/components/Sidebar";
import { ResultsDisplay } from "@/components/ResultsDisplay";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, ArrowLeft } from "lucide-react";
import UserManagement from "./UserManagement";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  results?: any;
}

interface HomeProps {
  onLogout: () => void;
  user: any;
}

export default function Home({ onLogout, user }: HomeProps) {
  const [selectedSchema, setSelectedSchema] = useState<"db_gringao" | "loja_fisica">("loja_fisica");
  const [selectedProvider, setSelectedProvider] = useState<"openrouter" | "gemini" | "deepseek">("openrouter");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [showUserManagement, setShowUserManagement] = useState(false);

  // Buscar histórico
  const { data: historyData, refetch: refetchHistory } = trpc.analytics.getHistory.useQuery();
  const chatHistory = historyData || [];

  const queryMutation = trpc.analytics.query.useMutation({
    onSuccess: (data) => {
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: data.data.naturalAnswer,
        results: data.data,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Atualizar histórico após nova query
      refetchHistory();
    },
    onError: (error) => {
      alert(`Erro: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || queryMutation.isPending) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);

    queryMutation.mutate({
      question: input,
      schema: selectedSchema,
      llmProvider: selectedProvider,
    });

    setInput("");
  };

  const handleNewChat = () => {
    setMessages([]);
    setInput("");
  };

  const deleteHistoryMutation = trpc.analytics.deleteHistory.useMutation({
    onSuccess: () => {
      refetchHistory();
    },
    onError: (error) => {
      alert(`Erro ao deletar histórico: ${error.message}`);
    },
  });

  const handleDeleteChat = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta conversa?")) {
      deleteHistoryMutation.mutate({ id: parseInt(id) });
    }
  };

  // Se estiver mostrando gerenciamento de usuários
  if (showUserManagement) {
    return (
      <div className="flex h-screen">
        <Sidebar
          selectedSchema={selectedSchema}
          onSchemaChange={setSelectedSchema}
          selectedProvider={selectedProvider}
          onProviderChange={setSelectedProvider}
          onNewChat={handleNewChat}
          chatHistory={chatHistory}
          onDeleteChat={handleDeleteChat}
          onLogout={onLogout}
          onUserManagement={() => setShowUserManagement(true)}
          user={user}
          onSelectChat={(chatId) => {
            setShowUserManagement(false);
            const chat = chatHistory.find((c: any) => c.id === chatId);
            if (chat && chat.response) {
              try {
                const responseData = JSON.parse(chat.response);
                setMessages([
                  {
                    id: `${chatId}-user`,
                    role: "user",
                    content: chat.question,
                  },
                  {
                    id: `${chatId}-assistant`,
                    role: "assistant",
                    content: responseData.naturalAnswer || "Resposta não disponível",
                    results: responseData,
                  },
                ]);
              } catch (error) {
                console.error("Erro ao carregar histórico:", error);
              }
            }
          }}
        />
        <div className="flex-1 flex flex-col">
          <div className="border-b border-neutral-200 p-4">
            <Button
              variant="ghost"
              onClick={() => setShowUserManagement(false)}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para Chat
            </Button>
          </div>
          <UserManagement />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar
        selectedSchema={selectedSchema}
        onSchemaChange={setSelectedSchema}
        selectedProvider={selectedProvider}
        onProviderChange={setSelectedProvider}
        onNewChat={handleNewChat}
        chatHistory={chatHistory}
        onDeleteChat={handleDeleteChat}
        onLogout={onLogout}
        onUserManagement={() => setShowUserManagement(true)}
        user={user}
        onSelectChat={(chatId) => {
          // Carregar conversa do histórico
          const chat = chatHistory.find((c: any) => c.id === chatId);
          if (chat && chat.response) {
            try {
              const responseData = JSON.parse(chat.response);
              setMessages([
                {
                  id: `${chatId}-user`,
                  role: "user",
                  content: chat.question,
                },
                {
                  id: `${chatId}-assistant`,
                  role: "assistant",
                  content: responseData.naturalAnswer || "Resposta não disponível",
                  results: responseData,
                },
              ]);
            } catch (error) {
              console.error("Erro ao carregar histórico:", error);
            }
          }
        }}
      />

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-neutral-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-serif font-semibold">
                {selectedSchema === "db_gringao"
                  ? "E-commerce"
                  : "Loja Física"}
              </h2>
              <p className="text-sm text-neutral-500">
                Usando {selectedProvider === "openrouter" ? "Claude Sonnet 3.5" : selectedProvider === "gemini" ? "Gemini Flash" : "DeepSeek R1"}
              </p>
            </div>
            <div className="text-sm text-neutral-600">Joalheria Analytics</div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center">
              <h1 className="text-4xl font-serif font-bold mb-4">
                O que posso analisar para você?
              </h1>
              <p className="text-neutral-600 mb-2">
                Faça perguntas sobre seus dados em linguagem natural
              </p>
              <div className="grid grid-cols-2 gap-4 max-w-2xl">
                {[
                  { title: "Faturamento de hoje", desc: "Ver vendas do dia atual" },
                  { title: "Produtos mais vendidos", desc: "Ranking de produtos" },
                  { title: "Comparação semanal", desc: "Análise de tendências" },
                  { title: "Fornecedores", desc: "Análise de fornecedores" },
                ].map((suggestion) => (
                  <button
                    key={suggestion.title}
                    onClick={() => setInput(suggestion.title)}
                    className="p-4 border border-neutral-200 rounded-lg hover:border-[#005A8C] hover:bg-[#005A8C]/10 transition-colors text-left"
                  >
                    <div className="font-semibold">{suggestion.title}</div>
                    <div className="text-sm text-neutral-500">{suggestion.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-6">
              {messages.map((message) => (
                <div key={message.id}>
                  {message.role === "user" ? (
                    <div className="flex justify-end">
                      <div className="bg-[#005A8C] text-white px-4 py-2 rounded-lg max-w-2xl">
                        {message.content}
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-start">
                      <div className="max-w-full">
                        {message.results && <ResultsDisplay results={message.results} />}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {queryMutation.isPending && (
                <div className="flex items-center gap-2 text-neutral-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analisando...</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-neutral-200 p-4">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Faça uma pergunta sobre seus dados... Ex: Qual o faturamento de hoje?"
              className="flex-1 resize-none"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || queryMutation.isPending}
            >
              {queryMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
