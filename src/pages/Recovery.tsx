import { useEffect } from 'react';
import { safeHardRefresh } from '@/lib/swRecovery';
import { PageSEO } from '@/components/seo/PageSEO';

const Recovery = () => {
  useEffect(() => {
    // Auto-execute cleanup after 2 seconds
    const timer = setTimeout(() => {
      safeHardRefresh();
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <PageSEO
        title="Recuperação do App"
        description="Página de recuperação para limpar cache e service worker"
      />
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-hero">
        <div className="text-center space-y-6 max-w-md">
          <h1 className="text-3xl font-bold text-white">🔧 Recuperando App</h1>
          <p className="text-white/90 text-lg">
            Limpando cache e service worker...
          </p>
          <div className="boot-spinner mx-auto"></div>
          <p className="text-white/70 text-sm">
            O app será recarregado automaticamente em alguns segundos.
          </p>
          <button 
            onClick={() => safeHardRefresh()}
            className="mt-4 px-6 py-3 bg-white text-primary rounded-lg font-semibold hover:bg-white/90 transition-colors"
          >
            🧹 Forçar Limpeza Agora
          </button>
        </div>
      </div>
    </>
  );
};

export default Recovery;
