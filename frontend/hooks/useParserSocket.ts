import { useState, useEffect, useCallback } from 'react';

export interface JobTelemetry {
  job_id: string;
  progress: number;
  stats: {
    proc: number;
    create: number;
    update: number;
    fail: number;
    skip: number;
  };
}

export function useParserSocket(jobId: string | null) {
  const [telemetry, setTelemetry] = useState<JobTelemetry | null>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');

  useEffect(() => {
    if (!jobId) return;

    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/api/v1'}/dashboard/parsers/ws/jobs/${jobId}`;
    let socket: WebSocket;

    const connect = () => {
      setStatus('connecting');
      socket = new WebSocket(wsUrl);

      socket.onopen = () => setStatus('connected');
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setTelemetry(data);
        } catch (err) {
          console.error('Failed to parse telemetry', err);
        }
      };
      socket.onclose = () => {
        setStatus('disconnected');
        // Auto-reconnect after 3s
        setTimeout(connect, 3000);
      };
      socket.onerror = () => setStatus('disconnected');
    };

    connect();

    return () => {
      if (socket) socket.close();
    };
  }, [jobId]);

  return { telemetry, status };
}
