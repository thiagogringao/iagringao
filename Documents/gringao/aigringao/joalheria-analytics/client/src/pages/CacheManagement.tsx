import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Database, 
  RefreshCw, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Activity,
  HardDrive,
  MemoryStick,
  Server
} from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function CacheManagement() {
  const [refreshing, setRefreshing] = useState(false);

  // Queries para status do cache
  const { data: cacheStatus, refetch: refetchStatus } = trpc.analytics.getCacheStatus.useQuery(
    undefined,
    {
      refetchInterval: 5000, // Atualiza a cada 5 segundos
    }
  );

  // Mutations para ações
  const clearCacheMutation = trpc.analytics.clearCache.useMutation({
    onSuccess: () => {
      refetchStatus();
    },
  });

  const clearSchemaCacheMutation = trpc.analytics.clearSchemaCache.useMutation({
    onSuccess: () => {
      refetchStatus();
    },
  });

  const preloadCacheMutation = trpc.analytics.preloadCache.useMutation({
    onSuccess: () => {
      refetchStatus();
    },
  });

  const handleClearAllCache = async () => {
    if (confirm("Tem certeza que deseja limpar todo o cache? Isso pode afetar a performance temporariamente.")) {
      await clearCacheMutation.mutateAsync();
    }
  };

  const handleClearSchemaCache = async (schema: "db_gringao" | "loja_fisica") => {
    if (confirm(`Tem certeza que deseja limpar o cache de ${schema === "db_gringao" ? "E-commerce" : "Loja Física"}?`)) {
      await clearSchemaCacheMutation.mutateAsync({ schema });
    }
  };

  const handlePreloadCache = async () => {
    setRefreshing(true);
    try {
      await preloadCacheMutation.mutateAsync();
      alert("Cache pré-carregado com sucesso!");
    } catch (error) {
      alert("Erro ao pré-carregar cache. Verifique os logs.");
    } finally {
      setRefreshing(false);
    }
  };

  const status = cacheStatus?.status || "unknown";
  const isRedisEnabled = status === "connected";

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#005A8C]">Gerenciamento de Cache</h1>
        <p className="text-neutral-600 mt-1">
          Configure e monitore o sistema de cache (Redis, Memória, SQLite)
        </p>
      </div>

      {/* Status do Redis */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5" />
                Status do Redis
              </CardTitle>
              <CardDescription>
                Status da conexão com o servidor Redis
              </CardDescription>
            </div>
            <Badge 
              variant={isRedisEnabled ? "default" : "secondary"}
              className={isRedisEnabled ? "bg-green-500" : "bg-yellow-500"}
            >
              {isRedisEnabled ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Conectado
                </>
              ) : (
                <>
                  <XCircle className="w-3 h-3 mr-1" />
                  Desconectado
                </>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-[#005A8C]" />
                <div>
                  <p className="font-semibold">Redis</p>
                  <p className="text-sm text-neutral-600">
                    {isRedisEnabled 
                      ? `Conectado em ${cacheStatus?.redisHost || "localhost"}:${cacheStatus?.redisPort || 6379}`
                      : "Não disponível - usando cache em memória"}
                  </p>
                </div>
              </div>
              {!isRedisEnabled && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    window.open("https://github.com/tporadowski/redis/releases", "_blank");
                  }}
                >
                  Instalar Redis
                </Button>
              )}
            </div>

            <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
              <div className="flex items-center gap-3">
                <MemoryStick className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="font-semibold">Cache em Memória</p>
                  <p className="text-sm text-neutral-600">
                    Sempre ativo - {cacheStatus?.memoryCacheSize || 0} entradas
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="bg-blue-50">
                <CheckCircle className="w-3 h-3 mr-1" />
                Ativo
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
              <div className="flex items-center gap-3">
                <HardDrive className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="font-semibold">SQLite (Backup)</p>
                  <p className="text-sm text-neutral-600">
                    Cache persistente - {cacheStatus?.sqliteCacheSize || 0} entradas
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="bg-purple-50">
                <CheckCircle className="w-3 h-3 mr-1" />
                Ativo
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas do Cache */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Estatísticas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-neutral-600">Total de entradas (Redis):</span>
                <span className="font-semibold">{cacheStatus?.redisCacheSize || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Total de entradas (Memória):</span>
                <span className="font-semibold">{cacheStatus?.memoryCacheSize || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Total de entradas (SQLite):</span>
                <span className="font-semibold">{cacheStatus?.sqliteCacheSize || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Taxa de acerto (Hit Rate):</span>
                <span className="font-semibold">
                  {cacheStatus?.hitRate ? `${(cacheStatus.hitRate * 100).toFixed(1)}%` : "N/A"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Cache por Schema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-neutral-600">E-commerce (db_gringao):</span>
                <div className="flex gap-2">
                  <Badge variant="outline">{cacheStatus?.schemaStats?.db_gringao || 0}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleClearSchemaCache("db_gringao")}
                    disabled={clearSchemaCacheMutation.isPending}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-600">Loja Física (loja_fisica):</span>
                <div className="flex gap-2">
                  <Badge variant="outline">{cacheStatus?.schemaStats?.loja_fisica || 0}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleClearSchemaCache("loja_fisica")}
                    disabled={clearSchemaCacheMutation.isPending}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações */}
      <Card>
        <CardHeader>
          <CardTitle>Ações</CardTitle>
          <CardDescription>
            Gerencie o cache do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handlePreloadCache}
              disabled={preloadCacheMutation.isPending || refreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              Pré-carregar Cache
            </Button>
            
            <Button
              variant="outline"
              onClick={() => refetchStatus()}
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <Activity className="w-4 h-4" />
              Atualizar Status
            </Button>

            <Button
              variant="destructive"
              onClick={handleClearAllCache}
              disabled={clearCacheMutation.isPending}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Limpar Todo Cache
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Informações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Informações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-neutral-600">
            <p>
              <strong>Sistema de Cache em 3 Camadas:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Redis:</strong> Cache em memória externa (mais rápido, opcional)</li>
              <li><strong>Memória:</strong> Cache em memória do Node.js (sempre ativo, rápido)</li>
              <li><strong>SQLite:</strong> Cache persistente em disco (backup, mais lento)</li>
            </ul>
            <p className="mt-4">
              <strong>TTL (Time To Live):</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>E-commerce (db_gringao): 2 horas</li>
              <li>Loja Física (loja_fisica): 30 minutos</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

