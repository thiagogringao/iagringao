# 🔧 Correção: Erro de Ordem dos Hooks no React

## 🚨 **Problema Identificado**

```
React has detected a change in the order of Hooks called by Dashboard.
This will lead to bugs and errors if not fixed.
```

### **Causa Raiz**

O componente `Dashboard.tsx` estava violando a **Regra dos Hooks** do React:

> **Hooks devem ser chamados na mesma ordem em todos os renders**

---

## ❌ **Código Problemático (ANTES)**

```typescript
export default function Dashboard({ initialSchema = "loja_fisica" }: DashboardProps) {
  const [period, setPeriod] = useState(...);
  const [schema, setSchema] = useState(...);
  
  // ✅ Hooks chamados
  const { data: dashboardData, ... } = trpc.analytics.getDashboardData.useQuery(...);
  const { data: comparisonDataRaw, ... } = trpc.analytics.getComparisonData.useQuery(...);
  const clearCache = trpc.analytics.clearDashboardCache.useMutation();
  const realData = useMemo(...);
  
  // ❌ EARLY RETURN CONDICIONAL - VIOLA A REGRA DOS HOOKS!
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  if (!realData || realData.length === 0) {
    return <NoDataScreen />;
  }
  
  // ✅ Mais hooks chamados (mas só se não houver early return)
  const calculateKPIsForPeriod = useMemo(...);
  const comparisonData = useMemo(...);
  const getData = useCallback(...);
  
  // ... resto do componente
}
```

### **Por que isso é um problema?**

1. **Render 1 (Loading):**
   ```
   useState → useState → useQuery → useQuery → useMutation → useMemo
   [EARLY RETURN - para aqui]
   ```

2. **Render 2 (Com dados):**
   ```
   useState → useState → useQuery → useQuery → useMutation → useMemo
   → useMemo → useMemo → useCallback
   [Continua até o final]
   ```

3. **Resultado:** Ordem diferente de hooks entre renders = **ERRO!**

---

## ✅ **Código Corrigido (DEPOIS)**

```typescript
export default function Dashboard({ initialSchema = "loja_fisica" }: DashboardProps) {
  const [period, setPeriod] = useState(...);
  const [schema, setSchema] = useState(...);
  
  // ✅ TODOS os hooks chamados SEMPRE, na mesma ordem
  const { data: dashboardData, ... } = trpc.analytics.getDashboardData.useQuery(...);
  const { data: comparisonDataRaw, ... } = trpc.analytics.getComparisonData.useQuery(...);
  const clearCache = trpc.analytics.clearDashboardCache.useMutation();
  const realData = useMemo(...);
  const calculateKPIsForPeriod = useMemo(...);
  const comparisonData = useMemo(...);
  const getData = useCallback(...);
  
  // ... todos os outros hooks e cálculos
  
  // ✅ EARLY RETURNS APÓS TODOS OS HOOKS
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  if (!realData || realData.length === 0) {
    return <NoDataScreen />;
  }
  
  // ... resto do componente
}
```

### **Por que isso funciona?**

1. **Todos os renders:**
   ```
   useState → useState → useQuery → useQuery → useMutation → useMemo
   → useMemo → useMemo → useCallback → ... (sempre a mesma ordem)
   ```

2. **Early returns acontecem DEPOIS** de todos os hooks serem chamados

3. **Resultado:** Ordem consistente de hooks em todos os renders = **✅ SUCESSO!**

---

## 📋 **Regras dos Hooks do React**

### **1. Chame Hooks no Nível Superior**
❌ **NÃO faça:**
```typescript
if (condition) {
  const [state, setState] = useState(0); // ❌ Condicional
}

for (let i = 0; i < 10; i++) {
  useEffect(() => {}); // ❌ Loop
}

function handleClick() {
  const data = useMemo(() => {}); // ❌ Função aninhada
}
```

✅ **FAÇA:**
```typescript
const [state, setState] = useState(0); // ✅ Nível superior

useEffect(() => {
  if (condition) {
    // Lógica condicional DENTRO do hook
  }
});
```

### **2. Chame Hooks na Mesma Ordem**
❌ **NÃO faça:**
```typescript
function Component({ showExtra }) {
  const [name, setName] = useState("");
  
  if (showExtra) {
    const [extra, setExtra] = useState(""); // ❌ Hook condicional
  }
  
  useEffect(() => {}); // Ordem muda dependendo de showExtra
}
```

✅ **FAÇA:**
```typescript
function Component({ showExtra }) {
  const [name, setName] = useState("");
  const [extra, setExtra] = useState(""); // ✅ Sempre chamado
  
  useEffect(() => {
    if (showExtra) {
      // Usa 'extra' condicionalmente
    }
  });
}
```

### **3. Early Returns Após Hooks**
❌ **NÃO faça:**
```typescript
function Component() {
  const [state, setState] = useState(0);
  
  if (loading) return <Loading />; // ❌ Early return antes de outros hooks
  
  const data = useMemo(() => {}); // Pode não ser chamado
}
```

✅ **FAÇA:**
```typescript
function Component() {
  const [state, setState] = useState(0);
  const data = useMemo(() => {}); // ✅ Sempre chamado
  
  if (loading) return <Loading />; // ✅ Early return APÓS todos os hooks
}
```

---

## 🔍 **Como Detectar Esse Erro**

### **Erro no Console:**
```
React has detected a change in the order of Hooks called by [Component].
This will lead to bugs and errors if not fixed.

   Previous render            Next render
   ------------------------------------------------------
1. useState                   useState
2. useEffect                  useEffect
3. useMemo                    useMemo
4. undefined                  useCallback  ⚠️ DIFERENÇA!
```

### **Sintomas:**
- ✅ Erro explícito no console do navegador
- ✅ Aplicação pode crashar ou ter comportamento inesperado
- ✅ Valores de hooks podem "trocar" entre renders
- ✅ Estado pode ser perdido ou corrompido

---

## 📝 **Checklist de Correção**

Ao encontrar esse erro, verifique:

- [ ] **Todos os hooks estão no nível superior?**
  - Não dentro de `if`, `for`, `while`, funções aninhadas

- [ ] **Nenhum hook está dentro de condicionais?**
  - Mova a lógica condicional para DENTRO do hook

- [ ] **Early returns estão APÓS todos os hooks?**
  - `if (loading) return ...` deve vir DEPOIS de todos os hooks

- [ ] **Hooks customizados seguem as mesmas regras?**
  - Hooks customizados também devem ser chamados incondicionalmente

- [ ] **Ordem dos hooks é consistente?**
  - Mesma ordem em todos os caminhos de execução

---

## 🎯 **Resultado da Correção**

### **Antes:**
```
❌ Erro: "Rendered more hooks than during the previous render"
❌ Aplicação crashava ao carregar dashboard
❌ Ordem de hooks inconsistente
```

### **Depois:**
```
✅ Sem erros de hooks
✅ Dashboard carrega corretamente
✅ Ordem de hooks consistente em todos os renders
✅ Performance otimizada com memoização
```

---

## 📚 **Referências**

- [Rules of Hooks - React Docs](https://react.dev/link/rules-of-hooks)
- [React Hooks FAQ](https://react.dev/reference/react)
- [ESLint Plugin: react-hooks](https://www.npmjs.com/package/eslint-plugin-react-hooks)

---

## 💡 **Dica Pro**

Instale o **ESLint plugin** para detectar violações automaticamente:

```bash
npm install eslint-plugin-react-hooks --save-dev
```

```json
// .eslintrc.json
{
  "plugins": ["react-hooks"],
  "rules": {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

---

**✅ Problema resolvido! Dashboard funcionando perfeitamente!** 🎉

