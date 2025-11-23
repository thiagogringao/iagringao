/**
 * Função utilitária para fazer download de arquivos
 */

export function downloadFile(
  base64Data: string,
  filename: string,
  mimeType: string
) {
  try {
    // Converte base64 para blob
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });

    // Cria link temporário e faz download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Erro ao fazer download:', error);
    throw new Error('Erro ao fazer download do arquivo');
  }
}

