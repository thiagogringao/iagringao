import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  MessageSquarePlus,
  TrendingUp,
  Store,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Trash2,
  Clock,
  MessageSquare,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isToday, isYesterday, subDays, isAfter } from "date-fns";

interface SidebarProps {
  selectedSchema: "db_gringao" | "loja_fisica";
  onSchemaChange: (schema: "db_gringao" | "loja_fisica") => void;
  selectedProvider: "openrouter" | "gemini" | "deepseek";
  onProviderChange: (provider: "openrouter" | "gemini" | "deepseek") => void;
  onNewChat: () => void;
  chatHistory: Array<{
    id: string;
    question: string;
    timestamp: Date;
  }>;
  onSelectChat: (id: string) => void;
  onDeleteChat?: (id: string) => void;
  onLogout?: () => void;
  onUserManagement?: () => void;
  user?: any;
}

export function Sidebar({
  selectedSchema,
  onSchemaChange,
  selectedProvider,
  onProviderChange,
  onNewChat,
  chatHistory,
  onSelectChat,
  onDeleteChat,
  onLogout,
  onUserManagement,
  user
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const schemaOptions = [
    { value: "db_gringao" as const, label: "E-commerce", icon: TrendingUp },
    { value: "loja_fisica" as const, label: "Loja Física", icon: Store },
  ];

  const providerOptions = [
    { value: "openrouter" as const, label: "Claude Sonnet 3.5" },
    { value: "gemini" as const, label: "Gemini Flash" },
    { value: "deepseek" as const, label: "DeepSeek R1" },
  ];

  // Agrupa histórico por data
  const groupedHistory = {
    today: chatHistory.filter(chat => isToday(new Date(chat.timestamp))),
    yesterday: chatHistory.filter(chat => isYesterday(new Date(chat.timestamp))),
    lastWeek: chatHistory.filter(chat => {
      const date = new Date(chat.timestamp);
      return isAfter(date, subDays(new Date(), 7)) && !isToday(date) && !isYesterday(date);
    }),
    older: chatHistory.filter(chat => !isAfter(new Date(chat.timestamp), subDays(new Date(), 7)))
  };

  const renderHistoryGroup = (title: string, items: typeof chatHistory) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-4">
        <h4 className="text-xs font-semibold text-neutral-400 uppercase mb-2 px-2">{title}</h4>
        <div className="space-y-1">
          {items.map((chat) => (
            <div key={chat.id} className="group flex items-center gap-1 pr-2 rounded-md hover:bg-neutral-100 transition-colors">
              <Button
                variant="ghost"
                className="flex-1 justify-start text-left text-sm truncate h-9 px-2 font-normal text-neutral-600 hover:text-neutral-900 hover:bg-transparent"
                onClick={() => onSelectChat(chat.id)}
              >
                <MessageSquare className="w-3 h-3 mr-2 text-neutral-400 shrink-0" />
                <span className="truncate">{chat.question}</span>
              </Button>
              {onDeleteChat && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-neutral-400 hover:text-red-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChat(chat.id);
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div
      className={cn(
        "h-screen bg-neutral-50 border-r border-neutral-200 flex flex-col transition-all duration-300",
        isCollapsed ? "w-16" : "w-72"
      )}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-neutral-200 bg-white">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#005A8C] to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-serif text-lg font-semibold text-[#005A8C]">Joalheria Analytics</h1>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="shrink-0 text-neutral-500 hover:text-[#005A8C]"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </Button>
      </div>

      {!isCollapsed && (
        <>
          {/* New Chat Button */}
          <div className="p-4">
            <Button
              onClick={onNewChat}
              className="w-full justify-start gap-2 bg-[#005A8C] hover:bg-[#004B87] text-white shadow-sm"
              size="lg"
            >
              <MessageSquarePlus className="w-4 h-4" />
              Nova Conversa
            </Button>
          </div>

          <Separator className="bg-neutral-200" />

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-6">
              {/* Data Source Selection */}
              <div>
                <h3 className="text-xs font-semibold text-neutral-500 uppercase mb-3 flex items-center gap-2">
                  <Store className="w-3 h-3" /> Fonte de Dados
                </h3>
                <div className="space-y-1">
                  {schemaOptions.map((option) => {
                    const Icon = option.icon;
                    const isSelected = selectedSchema === option.value;
                    return (
                      <Button
                        key={option.value}
                        variant={isSelected ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start gap-2 transition-all h-9",
                          isSelected
                            ? "bg-white text-[#005A8C] border border-[#005A8C]/20 shadow-sm font-medium"
                            : "text-neutral-600 hover:bg-neutral-100"
                        )}
                        onClick={() => onSchemaChange(option.value)}
                      >
                        <Icon className={cn("w-4 h-4", isSelected ? "text-[#005A8C]" : "text-neutral-400")} />
                        {option.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* LLM Provider Selection */}
              <div>
                <h3 className="text-xs font-semibold text-neutral-500 uppercase mb-3 flex items-center gap-2">
                  <Sparkles className="w-3 h-3" /> Modelo IA
                </h3>
                <div className="space-y-1">
                  {providerOptions.map((option) => {
                    const isSelected = selectedProvider === option.value;
                    return (
                      <Button
                        key={option.value}
                        variant={isSelected ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start text-sm transition-all h-8",
                          isSelected
                            ? "bg-white text-[#005A8C] border border-[#005A8C]/20 shadow-sm font-medium"
                            : "text-neutral-600 hover:bg-neutral-100"
                        )}
                        onClick={() => onProviderChange(option.value)}
                      >
                        {option.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <Separator className="bg-neutral-200" />

              {/* Chat History */}
              <div>
                <h3 className="text-xs font-semibold text-neutral-500 uppercase mb-3 flex items-center gap-2">
                  <Clock className="w-3 h-3" /> Histórico
                </h3>

                {chatHistory.length === 0 ? (
                  <div className="text-center py-8 px-4 bg-neutral-100/50 rounded-lg border border-dashed border-neutral-200">
                    <MessageSquare className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                    <p className="text-sm text-neutral-500">Nenhuma conversa ainda</p>
                    <p className="text-xs text-neutral-400 mt-1">Faça sua primeira pergunta!</p>
                  </div>
                ) : (
                  <div className="-mx-2">
                    {renderHistoryGroup("Hoje", groupedHistory.today)}
                    {renderHistoryGroup("Ontem", groupedHistory.yesterday)}
                    {renderHistoryGroup("Últimos 7 dias", groupedHistory.lastWeek)}
                    {renderHistoryGroup("Mais antigos", groupedHistory.older)}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>

          {/* User Management (apenas para admins) */}
          {user?.role === 'admin' && onUserManagement && (
            <>
              <Separator className="bg-neutral-200" />
              <div className="p-4">
                <Button
                  variant="ghost"
                  onClick={onUserManagement}
                  className="w-full justify-start gap-2 text-neutral-600 hover:bg-neutral-100 hover:text-[#005A8C]"
                >
                  <Users className="w-4 h-4" />
                  Gerenciar Usuários
                </Button>
              </div>
            </>
          )}

          {/* User Profile / Footer */}
          <div className="p-4 border-t border-neutral-200 bg-white">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#005A8C]/10 flex items-center justify-center text-[#005A8C] font-bold text-xs">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium text-neutral-900 truncate">{user?.name || 'Usuário'}</p>
                <p className="text-xs text-neutral-500 truncate">{user?.email || 'user@example.com'}</p>
              </div>
              {onLogout && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onLogout}
                  className="text-neutral-500 hover:text-red-500 h-8 w-8"
                  title="Sair"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
