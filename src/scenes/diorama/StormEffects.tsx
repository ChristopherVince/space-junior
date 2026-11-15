import { useEffect, useRef, useState } from 'react';
import { t } from '../../i18n';
import { store } from '../../state/store';
import type { Phase } from '../../state/types';

function reproducirBeep(ctx: AudioContext, fuerte: boolean) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(fuerte ? 880 : 660, ctx.currentTime);
  gain.gain.setValueAtTime(0.001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(fuerte ? 0.14 : 0.08, ctx.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.24);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.25);
  osc.onended = () => { osc.disconnect(); gain.disconnect(); };
  return () => {
    gain.gain.cancelScheduledValues(ctx.currentTime);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    osc.stop();
  };
}

/** Efectos visuales (tinte rojo) y sonoros (alarma con botón de silencio) durante la tormenta. */
export function StormEffects() {
  const [fase, setFase] = useState<Phase>(() => store.getState().fase);
  const [silenciado, setSilenciado] = useState(false);
  const [audioPreparado, setAudioPreparado] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const desuscribir = store.subscribe((estado) => setFase(estado.fase));
    return () => {
      desuscribir();
    };
  }, []);

  const enAlerta = fase === 'tormenta' || fase === 'refugio';
  const esTormenta = fase === 'tormenta';

  // Los navegadores solo permiten iniciar audio después de una interacción del usuario.
  useEffect(() => {
    const prepararAudio = () => {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioCtxRef.current) audioCtxRef.current = new AudioCtx();
      void audioCtxRef.current.resume().then(() => {
        if (audioCtxRef.current?.state !== 'running') return;
        setAudioPreparado(true);
        window.removeEventListener('pointerdown', prepararAudio);
        window.removeEventListener('keydown', prepararAudio);
      }).catch(() => {});
    };

    window.addEventListener('pointerdown', prepararAudio);
    window.addEventListener('keydown', prepararAudio);
    return () => {
      window.removeEventListener('pointerdown', prepararAudio);
      window.removeEventListener('keydown', prepararAudio);
      void audioCtxRef.current?.close().catch(() => {});
      audioCtxRef.current = null;
    };
  }, []);

  // Alarma sonora
  useEffect(() => {
    if (!enAlerta || silenciado || !audioPreparado || !audioCtxRef.current) return;
    const ctx = audioCtxRef.current;

    const fuerte = esTormenta;
    let detener = reproducirBeep(ctx, fuerte);
    const id = window.setInterval(() => {
      detener();
      detener = reproducirBeep(ctx, fuerte);
    }, fuerte ? 1100 : 1800);

    return () => { window.clearInterval(id); detener(); };
  }, [audioPreparado, enAlerta, esTormenta, silenciado]);

  // Overlay rojo montado directo en el DOM (fuera del reconciler de R3F).
  useEffect(() => {
    if (!enAlerta) return;
    const contenedor = document.getElementById('juego') ?? document.body;

    const overlay = document.createElement('div');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '5';
    overlay.style.background = esTormenta
      ? 'radial-gradient(circle, rgba(220,38,38,0.14) 30%, rgba(185,28,28,0.42) 100%)'
      : 'radial-gradient(circle, rgba(234,88,12,0.08) 40%, rgba(220,38,38,0.25) 100%)';

    contenedor.appendChild(overlay);

    // Canvas 2D de ráfagas de arena cruzando la pantalla
    const sandCanvas = document.createElement('canvas');
    let rafId = 0;
    sandCanvas.setAttribute('aria-hidden', 'true');
    sandCanvas.style.position = 'fixed';
    sandCanvas.style.inset = '0';
    sandCanvas.style.width = '100vw';
    sandCanvas.style.height = '100vh';
    sandCanvas.style.pointerEvents = 'none';
    sandCanvas.style.zIndex = '6';
    sandCanvas.width = window.innerWidth;
    sandCanvas.height = window.innerHeight;
    const redimensionar = () => {
      sandCanvas.width = window.innerWidth;
      sandCanvas.height = window.innerHeight;
    };
    window.addEventListener('resize', redimensionar);
    contenedor.appendChild(sandCanvas);

    const ctx2d = sandCanvas.getContext('2d');
    const count = esTormenta ? 140 : 65;
    const granos = Array.from({ length: count }, () => ({
      x: Math.random() * sandCanvas.width,
      y: Math.random() * sandCanvas.height,
      vx: (esTormenta ? 16 : 9) + Math.random() * 14,
      vy: 2 + Math.random() * 4,
      len: (esTormenta ? 18 : 10) + Math.random() * 24,
      alpha: 0.2 + Math.random() * 0.45,
    }));

    const animar = () => {
      if (!ctx2d) return;
      ctx2d.clearRect(0, 0, sandCanvas.width, sandCanvas.height);
      ctx2d.lineCap = 'round';

      for (const g of granos) {
        g.x += g.vx;
        g.y += g.vy;
        if (g.x > sandCanvas.width + 40) {
          g.x = -40;
          g.y = Math.random() * sandCanvas.height;
        }
        if (g.y > sandCanvas.height + 20) g.y = -20;

        ctx2d.strokeStyle = `rgba(255, 196, 148, ${g.alpha})`;
        ctx2d.lineWidth = esTormenta ? 2 : 1.3;
        ctx2d.beginPath();
        ctx2d.moveTo(g.x, g.y);
        ctx2d.lineTo(g.x - g.len, g.y - g.len * 0.22);
        ctx2d.stroke();
      }
      rafId = window.requestAnimationFrame(animar);
    };
    rafId = window.requestAnimationFrame(animar);

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', redimensionar);
      sandCanvas.remove();
      overlay.remove();
    };
  }, [enAlerta, esTormenta]);

  // El botón se actualiza por separado para no reiniciar las partículas al silenciar.
  useEffect(() => {
    if (!enAlerta) return;
    const contenedor = document.getElementById('juego') ?? document.body;
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'storm-audio-btn';
    boton.textContent = silenciado ? '🔇' : '🔊';
    boton.title = silenciado ? t('controles.audioActivar') : t('controles.audioSilenciar');
    boton.setAttribute('aria-label', boton.title);
    boton.style.position = 'fixed';
    boton.style.top = '18px';
    boton.style.left = '158px';
    boton.style.zIndex = '25';
    boton.style.padding = '10px 14px';
    boton.style.borderRadius = '999px';
    boton.style.border = '2px solid rgba(255,255,255,0.3)';
    boton.style.background = 'rgba(15, 23, 42, 0.84)';
    boton.style.color = '#f8fafc';
    boton.style.fontSize = '18px';
    boton.style.cursor = 'pointer';
    boton.onclick = () => setSilenciado((prev) => !prev);
    contenedor.appendChild(boton);

    return () => boton.remove();
  }, [enAlerta, silenciado]);

  return null;
}
