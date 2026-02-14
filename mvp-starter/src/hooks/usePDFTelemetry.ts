import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type PDFViewerStatus = 
  | 'url_validated'
  | 'android_pwa_detected'
  | 'android_prefetch_ok'
  | 'android_prefetch_fail'
  | 'iframe_loaded'
  | 'iframe_timeout'
  | 'blob_fallback_ok'
  | 'blob_fallback_timeout'
  | 'google_viewer_ok'
  | 'google_viewer_fail'
  | 'external_open_clicked'
  | 'download_clicked';

export const usePDFTelemetry = () => {
  const { user } = useAuth();

  const logPDFEvent = async (
    status: PDFViewerStatus,
    metadata?: Record<string, any>
  ) => {
    try {
      const telemetryData = {
        status,
        userAgent: navigator.userAgent,
        displayMode: window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser',
        timestamp: new Date().toISOString(),
        ...metadata
      };

      // Log apenas em produção para não poluir dev
      if (import.meta.env.PROD) {
        await supabase.from('analytics_events').insert({
          event_name: 'pdf_viewer_status',
          user_id: user?.id,
          metadata: telemetryData,
        });
      } else {
        console.log('📊 PDF Telemetry:', telemetryData);
      }
    } catch (error) {
      console.error('Failed to log PDF telemetry:', error);
    }
  };

  const logFallback = async (
    fromMode: string,
    toMode: string,
    reason?: string
  ) => {
    try {
      const fallbackData = {
        fromMode,
        toMode,
        reason,
        timestamp: new Date().toISOString(),
      };

      if (import.meta.env.PROD) {
        await supabase.from('analytics_events').insert({
          event_name: 'pdf_viewer_fallback',
          user_id: user?.id,
          metadata: fallbackData,
        });
      } else {
        console.log('🔄 PDF Fallback:', fallbackData);
      }
    } catch (error) {
      console.error('Failed to log PDF fallback:', error);
    }
  };

  return { logPDFEvent, logFallback };
};
