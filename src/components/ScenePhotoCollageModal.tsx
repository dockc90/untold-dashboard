import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  Trash2,
  Check,
  RotateCcw,
  LayoutGrid,
  Columns,
  Rows,
  Grid,
  Layers,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Download,
  Plus,
  ZoomIn,
  ZoomOut,
  Move,
  Hand,
  Maximize2,
  Sun,
  Contrast,
  Palette,
  Wand2,
  Sliders,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export type CollageLayout =
  | 'single'         // 단일 1장 전체화면 (위치 이동 & 크기 조절/줌 전용)
  | 'vertical-2'     // 상하 2분할 (9:16 쇼츠 핵심)
  | 'horizontal-2'   // 좌우 2분할
  | 'top1-bottom2'   // 상단 1개 + 하단 2개 (3분할)
  | 'top2-bottom1'   // 상단 2개 + 하단 1개 (3분할)
  | 'vertical-3'     // 상중하 3단 분할
  | 'grid-4'         // 2x2 4분할 격자
  | 'grid-6';        // 2x3 6분할 격자

export type CollageAspectRatio = '9:16' | '1:1' | '4:5';

export type ColorFilterPreset = 'none' | 'vivid' | 'warm' | 'cool' | 'cinematic' | 'vintage' | 'bw';

export interface ImageTransform {
  scale: number;        // 0.4 ~ 4.0
  offsetX: number;      // px in canvas coordinates
  offsetY: number;      // px in canvas coordinates
  brightness?: number;  // 50 ~ 150 (default 100%)
  contrast?: number;    // 50 ~ 150 (default 100%)
  saturate?: number;    // 0 ~ 200 (default 100%)
  filterPreset?: ColorFilterPreset;
}

export const COLOR_PRESETS: { id: ColorFilterPreset; label: string; desc: string; emoji: string }[] = [
  { id: 'none', label: '원본', desc: '효과 없음', emoji: '✨' },
  { id: 'vivid', label: '선명하게', desc: '생동감 극대화', emoji: '⚡' },
  { id: 'warm', label: '따뜻한 톤', desc: '감성 골든아워', emoji: '🌅' },
  { id: 'cool', label: '차가운 톤', desc: '세련된 블루 무드', emoji: '❄️' },
  { id: 'cinematic', label: '시네마틱', desc: '영화같은 깊이감', emoji: '🎬' },
  { id: 'vintage', label: '빈티지', desc: '레트로 필름 감성', emoji: '🎞️' },
  { id: 'bw', label: '흑백', desc: '클래식 모노크롬', emoji: '⬛' },
];

export function getCanvasFilterString(t?: ImageTransform): string {
  if (!t) return 'none';
  const b = Number.isFinite(t.brightness) ? t.brightness! : 100;
  const c = Number.isFinite(t.contrast) ? t.contrast! : 100;
  const s = Number.isFinite(t.saturate) ? t.saturate! : 100;
  const preset = t.filterPreset || 'none';

  const parts: string[] = [];

  switch (preset) {
    case 'vivid':
      parts.push('contrast(115%)', 'saturate(130%)');
      break;
    case 'warm':
      parts.push('sepia(25%)', 'saturate(115%)');
      break;
    case 'cool':
      parts.push('hue-rotate(15deg)', 'saturate(95%)');
      break;
    case 'cinematic':
      parts.push('contrast(125%)', 'saturate(85%)', 'sepia(10%)');
      break;
    case 'vintage':
      parts.push('sepia(45%)', 'contrast(90%)', 'brightness(105%)');
      break;
    case 'bw':
      parts.push('grayscale(100%)', 'contrast(110%)');
      break;
  }

  if (b !== 100) parts.push(`brightness(${b}%)`);
  if (c !== 100) parts.push(`contrast(${c}%)`);
  if (s !== 100) parts.push(`saturate(${s}%)`);

  return parts.length > 0 ? parts.join(' ') : 'none';
}

interface ImageItem {
  id: string;
  dataUrl: string;
  name: string;
}

interface ScenePhotoCollageModalProps {
  isOpen: boolean;
  onClose: () => void;
  sceneNumber: number;
  timeRange: string;
  narrationSnippet: string;
  existingImageUrl?: string;
  onApplyImage: (mergedDataUrl: string) => void;
}

const LAYOUT_PRESETS: { id: CollageLayout; label: string; desc: string; icon: any; minImages: number }[] = [
  { id: 'single', label: '단일 전체', desc: '1장 위치/크기/줌 조절', icon: Maximize2, minImages: 1 },
  { id: 'vertical-2', label: '상하 2분할', desc: '쇼츠 9:16 추천 (인물 + 자료)', icon: Rows, minImages: 2 },
  { id: 'horizontal-2', label: '좌우 2분할', desc: '과거 vs 현재 비교', icon: Columns, minImages: 2 },
  { id: 'top1-bottom2', label: '1+2 3분할', desc: '상단 메인 + 하단 2장', icon: Layers, minImages: 3 },
  { id: 'top2-bottom1', label: '2+1 3분할', desc: '상단 2장 + 하단 와이드', icon: Layers, minImages: 3 },
  { id: 'vertical-3', label: '세로 3단', desc: '3단계 변화 서사', icon: Rows, minImages: 3 },
  { id: 'grid-4', label: '2x2 4분할', desc: '4컷 핵심 순간', icon: Grid, minImages: 4 },
  { id: 'grid-6', label: '2x3 6분할', desc: '다중 증거/자료 모음', icon: LayoutGrid, minImages: 6 },
];

const BORDER_COLORS = [
  { label: '블랙', value: '#000000' },
  { label: '화이트', value: '#ffffff' },
  { label: '다크 슬레이트', value: '#0f172a' },
  { label: '딥 인디고', value: '#312e81' },
  { label: '네온 옐로우', value: '#eab308' },
  { label: '투명', value: 'transparent' },
];

export const ScenePhotoCollageModal: React.FC<ScenePhotoCollageModalProps> = ({
  isOpen,
  onClose,
  sceneNumber,
  timeRange,
  narrationSnippet,
  existingImageUrl,
  onApplyImage,
}) => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [layout, setLayout] = useState<CollageLayout>('single');
  const [aspectRatio, setAspectRatio] = useState<CollageAspectRatio>('9:16');
  const [gap, setGap] = useState<number>(0); // px in UI (default 0 for single photo)
  const [borderRadius, setBorderRadius] = useState<number>(0); // px
  const [borderColor, setBorderColor] = useState<string>('#000000');
  const [badgeText, setBadgeText] = useState<string>(''); // e.g. "과거 vs 현재"
  const [badgePosition, setBadgePosition] = useState<'top' | 'center' | 'bottom'>('center');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Per-image interactive transform state: scale, offset, brightness, contrast, saturation, preset
  const [transforms, setTransforms] = useState<{ [id: string]: ImageTransform }>({});
  const [selectedCellIndex, setSelectedCellIndex] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [editorTab, setEditorTab] = useState<'transform' | 'color'>('transform');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const [imagesLoadedVersion, setImagesLoadedVersion] = useState<number>(0);
  const rafIdRef = useRef<number | null>(null);

  // Drag tracking ref
  const dragStartRef = useRef<{
    startX: number;
    startY: number;
    initialOffsetX: number;
    initialOffsetY: number;
    imgId: string;
  } | null>(null);

  // Initialize images on modal open
  useEffect(() => {
    if (isOpen) {
      if (existingImageUrl && images.length === 0) {
        setImages([
          {
            id: 'init-1',
            dataUrl: existingImageUrl,
            name: `기존 씬 ${sceneNumber} 사진`,
          },
        ]);
        setLayout('single');
        setGap(0);
        setBorderRadius(0);
      }
    }
  }, [isOpen, existingImageUrl, sceneNumber]);

  // Keep selectedCellIndex within range
  useEffect(() => {
    if (images.length === 0) {
      setSelectedCellIndex(0);
    } else if (selectedCellIndex >= images.length) {
      setSelectedCellIndex(images.length - 1);
    }
  }, [images.length, selectedCellIndex]);

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  // Horizontal drag-to-scroll & wheel state for Color Presets on PC
  const presetsScrollRef = useRef<HTMLDivElement | null>(null);
  const [isPresetDragging, setIsPresetDragging] = useState(false);
  const presetDragStartX = useRef(0);
  const presetScrollLeftStart = useRef(0);
  const hasMovedPresetDrag = useRef(false);

  const handlePresetMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!presetsScrollRef.current) return;
    setIsPresetDragging(true);
    presetDragStartX.current = e.pageX - presetsScrollRef.current.offsetLeft;
    presetScrollLeftStart.current = presetsScrollRef.current.scrollLeft;
    hasMovedPresetDrag.current = false;
  };

  const handlePresetMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPresetDragging || !presetsScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - presetsScrollRef.current.offsetLeft;
    const walk = (x - presetDragStartX.current) * 1.5;
    if (Math.abs(walk) > 4) {
      hasMovedPresetDrag.current = true;
    }
    presetsScrollRef.current.scrollLeft = presetScrollLeftStart.current - walk;
  };

  const handlePresetMouseUp = () => {
    setIsPresetDragging(false);
  };

  const scrollPresets = (direction: 'left' | 'right') => {
    if (!presetsScrollRef.current) return;
    const offset = direction === 'left' ? -150 : 150;
    presetsScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
  };

  // Handle multi-image file select
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    let loadedCount = 0;
    const newItems: ImageItem[] = [];

    fileList.forEach((file, i) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        newItems.push({
          id: `img-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
          dataUrl,
          name: file.name,
        });
        loadedCount++;
        if (loadedCount === fileList.length) {
          setImages((prev) => {
            const combined = [...prev, ...newItems].slice(0, 8); // max 8 images
            // Auto suggest layout based on total count
            if (combined.length === 1) {
              setLayout('single');
              setGap(0);
              setBorderRadius(0);
            } else if (combined.length === 2) {
              setLayout('vertical-2');
              setGap((prevGap) => (prevGap === 0 ? 8 : prevGap));
            } else if (combined.length === 3) {
              setLayout('top1-bottom2');
              setGap((prevGap) => (prevGap === 0 ? 8 : prevGap));
            } else if (combined.length >= 4) {
              setLayout('grid-4');
              setGap((prevGap) => (prevGap === 0 ? 8 : prevGap));
            }
            return combined;
          });
        }
      };
      reader.readAsDataURL(file);
    });

    if (e.target) e.target.value = '';
  };

  const handleRemoveImage = (id: string) => {
    setImages((prev) => {
      const next = prev.filter((img) => img.id !== id);
      if (next.length === 1) {
        setLayout('single');
      }
      return next;
    });
    setTransforms((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const handleMoveImage = (index: number, direction: 'up' | 'down') => {
    setImages((prev) => {
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
    setSelectedCellIndex(direction === 'up' ? index - 1 : index + 1);
  };

  const handleClearAll = () => {
    setImages([]);
    setTransforms({});
    setBadgeText('');
    setSelectedCellIndex(0);
    setLayout('single');
  };

  // Canvas dimension based on aspect ratio
  const canvasDimensions = useMemo(() => {
    if (aspectRatio === '9:16') return { width: 1080, height: 1920 };
    if (aspectRatio === '1:1') return { width: 1080, height: 1080 };
    return { width: 1080, height: 1350 }; // 4:5
  }, [aspectRatio]);

  // Compute cell bounding boxes for each layout
  const computeCells = useCallback((
    w: number,
    h: number,
    currentLayout: CollageLayout,
    g: number
  ): { x: number; y: number; w: number; h: number }[] => {
    const cells: { x: number; y: number; w: number; h: number }[] = [];

    switch (currentLayout) {
      case 'single': {
        cells.push({ x: g, y: g, w: w - g * 2, h: h - g * 2 });
        break;
      }
      case 'vertical-2': {
        const cellH = (h - g * 3) / 2;
        const cellW = w - g * 2;
        cells.push({ x: g, y: g, w: cellW, h: cellH });
        cells.push({ x: g, y: g * 2 + cellH, w: cellW, h: cellH });
        break;
      }
      case 'horizontal-2': {
        const cellW = (w - g * 3) / 2;
        const cellH = h - g * 2;
        cells.push({ x: g, y: g, w: cellW, h: cellH });
        cells.push({ x: g * 2 + cellW, y: g, w: cellW, h: cellH });
        break;
      }
      case 'top1-bottom2': {
        const topH = (h - g * 3) / 2;
        const botW = (w - g * 3) / 2;
        cells.push({ x: g, y: g, w: w - g * 2, h: topH });
        cells.push({ x: g, y: g * 2 + topH, w: botW, h: topH });
        cells.push({ x: g * 2 + botW, y: g * 2 + topH, w: botW, h: topH });
        break;
      }
      case 'top2-bottom1': {
        const topH = (h - g * 3) / 2;
        const topW = (w - g * 3) / 2;
        cells.push({ x: g, y: g, w: topW, h: topH });
        cells.push({ x: g * 2 + topW, y: g, w: topW, h: topH });
        cells.push({ x: g, y: g * 2 + topH, w: w - g * 2, h: topH });
        break;
      }
      case 'vertical-3': {
        const cellH = (h - g * 4) / 3;
        const cellW = w - g * 2;
        cells.push({ x: g, y: g, w: cellW, h: cellH });
        cells.push({ x: g, y: g * 2 + cellH, w: cellW, h: cellH });
        cells.push({ x: g, y: g * 3 + cellH * 2, w: cellW, h: cellH });
        break;
      }
      case 'grid-4': {
        const cellW = (w - g * 3) / 2;
        const cellH = (h - g * 3) / 2;
        cells.push({ x: g, y: g, w: cellW, h: cellH });
        cells.push({ x: g * 2 + cellW, y: g, w: cellW, h: cellH });
        cells.push({ x: g, y: g * 2 + cellH, w: cellW, h: cellH });
        cells.push({ x: g * 2 + cellW, y: g * 2 + cellH, w: cellW, h: cellH });
        break;
      }
      case 'grid-6': {
        const cellW = (w - g * 3) / 2;
        const cellH = (h - g * 4) / 3;
        for (let row = 0; row < 3; row++) {
          for (let col = 0; col < 2; col++) {
            cells.push({
              x: g + col * (cellW + g),
              y: g + row * (cellH + g),
              w: cellW,
              h: cellH,
            });
          }
        }
        break;
      }
    }
    return cells;
  }, []);

  // Current active cells in canvas coordinates
  const activeCells = useMemo(() => {
    const { width: W, height: H } = canvasDimensions;
    const scaleFactor = W / 400;
    const scaledGap = Math.round(gap * scaleFactor);
    return computeCells(W, H, layout, scaledGap);
  }, [canvasDimensions, gap, layout, computeCells]);

  // Current selected image & transform
  const currentSelectedImage = images[selectedCellIndex % (images.length || 1)] || null;
  const currentTransform: ImageTransform = useMemo(() => {
    const defaultTransform: ImageTransform = {
      scale: 1.0,
      offsetX: 0,
      offsetY: 0,
      brightness: 100,
      contrast: 100,
      saturate: 100,
      filterPreset: 'none',
    };
    if (!currentSelectedImage) return defaultTransform;
    const existing = transforms[currentSelectedImage.id];
    if (!existing) return defaultTransform;
    return {
      scale: Number.isFinite(existing.scale) ? existing.scale : 1.0,
      offsetX: Number.isFinite(existing.offsetX) ? existing.offsetX : 0,
      offsetY: Number.isFinite(existing.offsetY) ? existing.offsetY : 0,
      brightness: Number.isFinite(existing.brightness) ? existing.brightness! : 100,
      contrast: Number.isFinite(existing.contrast) ? existing.contrast! : 100,
      saturate: Number.isFinite(existing.saturate) ? existing.saturate! : 100,
      filterPreset: existing.filterPreset || 'none',
    };
  }, [currentSelectedImage, transforms]);

  const isColorAdjusted = useMemo(() => {
    return (
      (currentTransform.brightness !== 100) ||
      (currentTransform.contrast !== 100) ||
      (currentTransform.saturate !== 100) ||
      (currentTransform.filterPreset !== 'none')
    );
  }, [currentTransform]);

  // Transform modifiers for selected image
  const updateCurrentTransform = useCallback((updater: (prev: ImageTransform) => ImageTransform) => {
    if (!currentSelectedImage) return;
    setTransforms((prev) => {
      const cur = prev[currentSelectedImage.id] || {
        scale: 1.0,
        offsetX: 0,
        offsetY: 0,
        brightness: 100,
        contrast: 100,
        saturate: 100,
        filterPreset: 'none',
      };
      const next = updater(cur);
      return {
        ...prev,
        [currentSelectedImage.id]: next,
      };
    });
  }, [currentSelectedImage]);

  const handleScaleChange = (newScale: number) => {
    const val = Number.isFinite(newScale) ? newScale : 1.0;
    const clamped = Math.max(0.4, Math.min(4.0, Number(val.toFixed(2))));
    updateCurrentTransform((cur) => ({ ...cur, scale: clamped }));
  };

  const handleStepZoom = (delta: number) => {
    const d = Number.isFinite(delta) ? delta : 0;
    updateCurrentTransform((cur) => {
      const curScale = Number.isFinite(cur.scale) ? cur.scale : 1.0;
      return {
        ...cur,
        scale: Math.max(0.4, Math.min(4.0, Number((curScale + d).toFixed(2)))),
      };
    });
  };

  const handleNudge = (dx: number, dy: number) => {
    updateCurrentTransform((cur) => ({
      ...cur,
      offsetX: (Number.isFinite(cur.offsetX) ? cur.offsetX : 0) + (Number.isFinite(dx) ? dx : 0),
      offsetY: (Number.isFinite(cur.offsetY) ? cur.offsetY : 0) + (Number.isFinite(dy) ? dy : 0),
    }));
  };

  const handleResetCurrentTransform = () => {
    if (!currentSelectedImage) return;
    updateCurrentTransform((cur) => ({
      ...cur,
      scale: 1.0,
      offsetX: 0,
      offsetY: 0,
    }));
  };

  const handleBrightnessChange = (val: number) => {
    const clamped = Math.max(50, Math.min(150, Math.round(val)));
    updateCurrentTransform((cur) => ({ ...cur, brightness: clamped }));
  };

  const handleContrastChange = (val: number) => {
    const clamped = Math.max(50, Math.min(150, Math.round(val)));
    updateCurrentTransform((cur) => ({ ...cur, contrast: clamped }));
  };

  const handleSaturateChange = (val: number) => {
    const clamped = Math.max(0, Math.min(200, Math.round(val)));
    updateCurrentTransform((cur) => ({ ...cur, saturate: clamped }));
  };

  const handleFilterPresetSelect = (preset: ColorFilterPreset) => {
    updateCurrentTransform((cur) => ({ ...cur, filterPreset: preset }));
  };

  const handleResetColorTransform = () => {
    updateCurrentTransform((cur) => ({
      ...cur,
      brightness: 100,
      contrast: 100,
      saturate: 100,
      filterPreset: 'none',
    }));
  };

  const handleResetAllTransform = () => {
    if (!currentSelectedImage) return;
    setTransforms((prev) => ({
      ...prev,
      [currentSelectedImage.id]: {
        scale: 1.0,
        offsetX: 0,
        offsetY: 0,
        brightness: 100,
        contrast: 100,
        saturate: 100,
        filterPreset: 'none',
      },
    }));
  };

  // Map pointer client coordinates to high-res canvas coordinates
  const getCanvasCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return { x: 0, y: 0 };
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    return {
      x: Number.isFinite(x) ? x : 0,
      y: Number.isFinite(y) ? y : 0,
    };
  };

  // Preload and cache HTMLImageElement instances.
  // CRITICAL: Decodes images ONCE into cache so clicking, dragging, or zooming never re-allocates base64 data.
  useEffect(() => {
    if (!isOpen || images.length === 0) return;

    let isMounted = true;
    const currentIds = new Set(images.map((img) => img.id));

    // Prune removed images from cache
    for (const key of imageCacheRef.current.keys()) {
      if (!currentIds.has(key)) {
        imageCacheRef.current.delete(key);
      }
    }

    images.forEach((imgItem) => {
      const existing = imageCacheRef.current.get(imgItem.id);
      if (existing && existing.complete && existing.naturalWidth > 0) {
        return;
      }

      const img = new Image();
      if (!imgItem.dataUrl.startsWith('data:') && !imgItem.dataUrl.startsWith('blob:')) {
        img.crossOrigin = 'anonymous';
      }
      img.onload = () => {
        if (!isMounted) return;
        imageCacheRef.current.set(imgItem.id, img);
        setImagesLoadedVersion((v) => v + 1);
      };
      img.onerror = () => {
        if (!isMounted) return;
        if (img.crossOrigin) {
          const retry = new Image();
          retry.onload = () => {
            if (!isMounted) return;
            imageCacheRef.current.set(imgItem.id, retry);
            setImagesLoadedVersion((v) => v + 1);
          };
          retry.src = imgItem.dataUrl;
          return;
        }
        imageCacheRef.current.set(imgItem.id, img);
        setImagesLoadedVersion((v) => v + 1);
      };
      img.src = imgItem.dataUrl;
      imageCacheRef.current.set(imgItem.id, img);
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen, images]);

  // Adjust canvas width & height ONLY when aspect ratio / canvasDimensions change.
  // CRITICAL: Never reassign canvas.width on every click or drag to prevent GPU buffer drops.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { width: W, height: H } = canvasDimensions;
    if (canvas.width !== W || canvas.height !== H) {
      canvas.width = W;
      canvas.height = H;
    }
  }, [canvasDimensions]);

  // Pointer & Touch Handlers for Dragging/Moving photos directly on canvas
  const handlePointerDown = (clientX: number, clientY: number) => {
    if (images.length === 0) return;
    const { x, y } = getCanvasCoords(clientX, clientY);

    const cellIdx = activeCells.findIndex(
      (c) => x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h
    );

    if (cellIdx !== -1) {
      const safeImagesLen = Math.max(1, images.length);
      const targetImgIdx = cellIdx % safeImagesLen;
      const targetImg = images[targetImgIdx];
      if (targetImg) {
        setSelectedCellIndex(targetImgIdx);
        setIsDragging(true);
        const curTransform = transforms[targetImg.id] || { scale: 1.0, offsetX: 0, offsetY: 0 };
        dragStartRef.current = {
          startX: x,
          startY: y,
          initialOffsetX: Number.isFinite(curTransform.offsetX) ? curTransform.offsetX : 0,
          initialOffsetY: Number.isFinite(curTransform.offsetY) ? curTransform.offsetY : 0,
          imgId: targetImg.id,
        };
      }
    }
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!isDragging || !dragStartRef.current) return;
    const { x, y } = getCanvasCoords(clientX, clientY);
    const dx = x - dragStartRef.current.startX;
    const dy = y - dragStartRef.current.startY;
    const imgId = dragStartRef.current.imgId;

    if (!Number.isFinite(dx) || !Number.isFinite(dy)) return;

    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }

    rafIdRef.current = requestAnimationFrame(() => {
      setTransforms((prev) => {
        const cur = prev[imgId] || { scale: 1.0, offsetX: 0, offsetY: 0 };
        const curScale = Number.isFinite(cur.scale) ? cur.scale : 1.0;
        const initX = Number.isFinite(dragStartRef.current?.initialOffsetX) ? dragStartRef.current!.initialOffsetX : 0;
        const initY = Number.isFinite(dragStartRef.current?.initialOffsetY) ? dragStartRef.current!.initialOffsetY : 0;

        return {
          ...prev,
          [imgId]: {
            scale: curScale,
            offsetX: initX + dx,
            offsetY: initY + dy,
          },
        };
      });
    });
  };

  const handlePointerUp = () => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    setIsDragging(false);
    dragStartRef.current = null;
  };

  // Mouse wheel zoom on canvas
  const handleCanvasWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (images.length === 0) return;
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    const cellIdx = activeCells.findIndex(
      (c) => x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h
    );
    const safeLen = Math.max(1, images.length);
    const targetIdx = cellIdx !== -1 ? cellIdx % safeLen : selectedCellIndex % safeLen;
    const targetImg = images[targetIdx];
    if (!targetImg) return;

    setSelectedCellIndex(targetIdx);
    const delta = e.deltaY < 0 ? 0.08 : -0.08;

    setTransforms((prev) => {
      const cur = prev[targetImg.id] || { scale: 1.0, offsetX: 0, offsetY: 0 };
      const curScale = Number.isFinite(cur.scale) ? cur.scale : 1.0;
      const newScale = Math.max(0.4, Math.min(4.0, Number((curScale + delta).toFixed(2))));
      return {
        ...prev,
        [targetImg.id]: {
          ...cur,
          scale: newScale,
        },
      };
    });
  };

  // Draw on Canvas with Cached Images, Transforms & Object-fit Cover
  const renderCanvasCells = useCallback((isExporting: boolean = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width: W, height: H } = canvasDimensions;

    try {
      // Background fill
      ctx.fillStyle = borderColor === 'transparent' ? '#090d16' : borderColor;
      ctx.fillRect(0, 0, W, H);

      if (images.length === 0) {
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('사진을 추가해 주세요', W / 2, H / 2 - 20);
        ctx.font = '24px sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('(단일 1장 크기/위치 조절 및 다중 콜라주 분할)', W / 2, H / 2 + 30);
        return;
      }

      const scaleFactor = W / 400; // ~2.7x
      const scaledRadius = Math.max(0, Math.round(borderRadius * scaleFactor));
      const safeImagesLen = Math.max(1, images.length);

      activeCells.forEach((cell, idx) => {
        if (!cell || cell.w <= 0 || cell.h <= 0) return;
        const imgItem = images[idx % safeImagesLen];
        const img = imgItem ? imageCacheRef.current.get(imgItem.id) : null;
        const transform = (imgItem && transforms[imgItem.id]) || {
          scale: 1.0,
          offsetX: 0,
          offsetY: 0,
        };

        ctx.save();
        try {
          // 1. Rounded corners clipping
          const cellW = Math.max(1, cell.w);
          const cellH = Math.max(1, cell.h);
          if (scaledRadius > 0 && typeof (ctx as any).roundRect === 'function') {
            const maxR = Math.min(cellW, cellH) / 2;
            const safeR = Math.max(0, Math.min(scaledRadius, maxR));
            ctx.beginPath();
            try {
              (ctx as any).roundRect(cell.x, cell.y, cellW, cellH, safeR);
            } catch {
              ctx.rect(cell.x, cell.y, cellW, cellH);
            }
            ctx.clip();
          } else {
            ctx.beginPath();
            ctx.rect(cell.x, cell.y, cellW, cellH);
            ctx.clip();
          }

          // 2. Draw Image with Object-Fit Cover + Transform (Scale & Offset)
          if (img && img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
            const imgRatio = img.naturalWidth / img.naturalHeight;
            const cellRatio = cellW / cellH;
            let fitW = cellW;
            let fitH = cellH;

            if (imgRatio > cellRatio) {
              fitH = cellH;
              fitW = cellH * imgRatio;
            } else {
              fitW = cellW;
              fitH = cellW / (imgRatio || 1);
            }

            const cx = cell.x + cellW / 2;
            const cy = cell.y + cellH / 2;

            const safeScale = Number.isFinite(transform.scale) && transform.scale > 0 ? transform.scale : 1.0;
            const safeOffsetX = Number.isFinite(transform.offsetX) ? transform.offsetX : 0;
            const safeOffsetY = Number.isFinite(transform.offsetY) ? transform.offsetY : 0;

            ctx.translate(cx + safeOffsetX, cy + safeOffsetY);
            ctx.scale(safeScale, safeScale);

            // Apply color filter (brightness, contrast, saturation, and tone preset)
            const filterStr = getCanvasFilterString(transform);
            if (filterStr !== 'none' && typeof (ctx as any).filter === 'string') {
              (ctx as any).filter = filterStr;
            }

            if (Number.isFinite(fitW) && Number.isFinite(fitH) && fitW > 0 && fitH > 0) {
              ctx.drawImage(img, -fitW / 2, -fitH / 2, fitW, fitH);
            }
          } else {
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(cell.x, cell.y, cellW, cellH);
            ctx.fillStyle = '#94a3b8';
            ctx.font = 'bold 30px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`사진 ${idx + 1} 대기중`, cell.x + cellW / 2, cell.y + cellH / 2);
          }
        } catch (cellErr) {
          console.warn('Canvas cell render warning:', cellErr);
        } finally {
          try {
            (ctx as any).filter = 'none';
          } catch {}
          ctx.restore();
        }

        // 3. Selection border indicator for active cell (shown ONLY during interactive editing preview, NEVER during export/save!)
        if (!isExporting && idx === selectedCellIndex && images.length > 0 && (images.length > 1 || layout !== 'single')) {
          ctx.save();
          try {
            ctx.strokeStyle = '#a855f7';
            ctx.lineWidth = Math.max(5, Math.round(W / 180));
            ctx.setLineDash([16, 10]);
            const strokeW = Math.max(1, cell.w - 6);
            const strokeH = Math.max(1, cell.h - 6);
            if (scaledRadius > 0 && typeof (ctx as any).roundRect === 'function') {
              const maxR = Math.min(strokeW, strokeH) / 2;
              const safeR = Math.max(0, Math.min(scaledRadius, maxR));
              ctx.beginPath();
              try {
                (ctx as any).roundRect(cell.x + 3, cell.y + 3, strokeW, strokeH, safeR);
                ctx.stroke();
              } catch {
                ctx.strokeRect(cell.x + 3, cell.y + 3, strokeW, strokeH);
              }
            } else {
              ctx.strokeRect(cell.x + 3, cell.y + 3, strokeW, strokeH);
            }
          } catch (borderErr) {
            console.warn('Canvas border render warning:', borderErr);
          } finally {
            ctx.restore();
          }
        }
      });

      // 4. Render optional text badge / overlay banner
      if (badgeText.trim()) {
        ctx.save();
        try {
          const text = badgeText.trim();
          ctx.font = '900 44px sans-serif';
          const metrics = ctx.measureText(text);
          const textW = metrics.width;
          const boxW = Math.min(W - 40, textW + 80);
          const boxH = 80;
          const boxX = (W - boxW) / 2;
          let boxY = H / 2 - boxH / 2;

          if (badgePosition === 'top') boxY = 60;
          else if (badgePosition === 'bottom') boxY = H - 140;

          ctx.shadowColor = 'rgba(0,0,0,0.6)';
          ctx.shadowBlur = 24;
          ctx.shadowOffsetY = 6;

          ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
          if (typeof (ctx as any).roundRect === 'function') {
            ctx.beginPath();
            try {
              (ctx as any).roundRect(boxX, boxY, boxW, boxH, 40);
              ctx.fill();
            } catch {
              ctx.fillRect(boxX, boxY, boxW, boxH);
            }
          } else {
            ctx.fillRect(boxX, boxY, boxW, boxH);
          }

          ctx.strokeStyle = '#eab308';
          ctx.lineWidth = 4;
          if (typeof (ctx as any).roundRect === 'function') {
            ctx.beginPath();
            try {
              (ctx as any).roundRect(boxX, boxY, boxW, boxH, 40);
              ctx.stroke();
            } catch {
              ctx.strokeRect(boxX, boxY, boxW, boxH);
            }
          }

          ctx.shadowBlur = 0;
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(text, W / 2, boxY + boxH / 2);
        } catch (badgeErr) {
          console.warn('Canvas badge render warning:', badgeErr);
        } finally {
          ctx.restore();
        }
      }
    } catch (err) {
      console.error('Fatal canvas rendering error:', err);
    }
  }, [
    images,
    layout,
    canvasDimensions,
    activeCells,
    transforms,
    selectedCellIndex,
    borderColor,
    borderRadius,
    badgeText,
    badgePosition,
  ]);

  // Execute render whenever scene properties or cached images update
  useEffect(() => {
    if (isOpen) {
      renderCanvasCells();
    }
  }, [isOpen, renderCanvasCells, imagesLoadedVersion]);

  // Handle Apply to Scene (100% clean export WITHOUT selection borders!)
  const handleApply = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsProcessing(true);
    try {
      // 1. Re-render canvas cleanly without any purple selection borders or edit outlines
      renderCanvasCells(true);
      const mergedDataUrl = canvas.toDataURL('image/jpeg', 0.86);
      onApplyImage(mergedDataUrl);
      onClose();
    } catch (err) {
      console.error('Failed to export canvas collage:', err);
      if (images.length > 0 && images[0]?.dataUrl) {
        onApplyImage(images[0].dataUrl);
        onClose();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Download high-res combined JPG (100% clean export WITHOUT selection borders!)
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderCanvasCells(true);
    const link = document.createElement('a');
    link.download = `scene-${sceneNumber}-photo-${aspectRatio}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();
    renderCanvasCells(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header (Fully Responsive on Mobile & Desktop) */}
        <div className="px-3.5 sm:px-5 py-3 border-b border-slate-200 bg-slate-50/95 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-xs shrink-0">
              <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-1.5 min-w-0">
                <h3 className="text-sm sm:text-base font-black text-slate-900 truncate">
                  씬 {sceneNumber} 사진 편집
                </h3>
                <span className="px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-extrabold shrink-0">
                  {timeRange}
                </span>
                <span className="hidden md:inline-flex px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-extrabold items-center gap-1 shrink-0">
                  <Sparkles className="w-2.5 h-2.5" />
                  단일 줌/위치 & 다중 분할
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate max-w-[220px] sm:max-w-md mt-0.5">
                대사: "{narrationSnippet}"
              </p>
            </div>
          </div>

          {/* Right Top Close Button - Guaranteed Visible on Mobile */}
          <button
            type="button"
            onClick={onClose}
            className="flex items-center space-x-1 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-200 hover:bg-rose-100 text-slate-700 hover:text-rose-600 font-black text-xs transition cursor-pointer shrink-0 active:scale-95 shadow-2xs"
            title="창 닫기"
          >
            <X className="w-4 h-4 text-slate-600" />
            <span>닫기</span>
          </button>
        </div>

        {/* Modal Body: 2 Columns */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
          {/* Left Column: Photo List & Layout Controls (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* 1. Photo Upload Box */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-purple-600" />
                  <span>
                    사진 등록 ({images.length === 1 ? '단일 1장 편집' : `${images.length}/8장`})
                  </span>
                </label>
                {images.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-700 transition cursor-pointer"
                  >
                    전체 비우기
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-purple-300 hover:border-purple-500 bg-white hover:bg-purple-50/40 rounded-xl p-3.5 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-1.5"
              >
                <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-800">
                    사진을 선택하거나 이곳에 드래그하세요 (1장 단일도 가능!)
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium">
                    1장 단일 사진 크기·위치 조절부터 최대 8장 분할 콜라주까지 모두 지원
                  </p>
                </div>
              </div>

              {/* Uploaded Images Thumbnails Strip */}
              {images.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px] font-bold text-slate-500">
                    {images.length === 1 ? '등록된 사진 (클릭하여 편집):' : '순서 및 선택 (클릭하여 편집):'}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {images.map((item, idx) => {
                      const isSelected = selectedCellIndex === idx;
                      const tr = transforms[item.id];
                      const isZoomed = tr && (tr.scale !== 1 || tr.offsetX !== 0 || tr.offsetY !== 0);
                      const isColorMod = tr && (
                        (tr.brightness !== undefined && tr.brightness !== 100) ||
                        (tr.contrast !== undefined && tr.contrast !== 100) ||
                        (tr.saturate !== undefined && tr.saturate !== 100) ||
                        (tr.filterPreset && tr.filterPreset !== 'none')
                      );

                      return (
                        <div
                          key={item.id}
                          onClick={() => setSelectedCellIndex(idx)}
                          className={`relative group rounded-xl overflow-hidden border bg-slate-900 aspect-square flex flex-col justify-between p-1.5 shadow-2xs cursor-pointer transition ${
                            isSelected
                              ? 'border-purple-500 ring-2 ring-purple-400 ring-offset-1'
                              : 'border-slate-300 hover:border-purple-300'
                          }`}
                        >
                          <img
                            src={item.dataUrl}
                            alt={item.name}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                          <div className="relative z-10 flex items-center justify-between">
                            <span
                              className={`w-5 h-5 rounded-md text-[10px] font-black flex items-center justify-center ${
                                isSelected ? 'bg-purple-600 text-white' : 'bg-black/70 text-white'
                              }`}
                            >
                              {idx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveImage(item.id);
                              }}
                              className="p-1 rounded-md bg-rose-600/90 text-white hover:bg-rose-700 transition cursor-pointer"
                              title="삭제"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="relative z-10 flex items-center justify-between">
                            <div className="flex items-center space-x-0.5">
                              {isZoomed && (
                                <span className="px-1 py-0.5 rounded bg-purple-700/90 text-white text-[9px] font-mono font-bold">
                                  {Math.round(tr.scale * 100)}%
                                </span>
                              )}
                              {isColorMod && (
                                <span className="px-1 py-0.5 rounded bg-amber-600/90 text-white text-[9px] font-bold" title="밝기/색감 보정 적용됨">
                                  보정
                                </span>
                              )}
                            </div>

                            {images.length > 1 && (
                              <div className="flex items-center space-x-1">
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMoveImage(idx, 'up');
                                  }}
                                  className="p-1 rounded bg-black/70 text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-[10px] cursor-pointer"
                                  title="앞으로 이동"
                                >
                                  <ArrowUp className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === images.length - 1}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMoveImage(idx, 'down');
                                  }}
                                  className="p-1 rounded bg-black/70 text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-[10px] cursor-pointer"
                                  title="뒤로 이동"
                                >
                                  <ArrowDown className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Layout Preset Selector */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <LayoutGrid className="w-4 h-4 text-indigo-600" />
                <span>분할 레이아웃 선택</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {LAYOUT_PRESETS.map((preset) => {
                  const Icon = preset.icon;
                  const isSelected = layout === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setLayout(preset.id)}
                      className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between space-y-1 cursor-pointer ${
                        isSelected
                          ? 'bg-purple-50/90 border-purple-500 shadow-xs ring-1 ring-purple-300'
                          : 'bg-white hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-purple-600' : 'text-slate-500'}`} />
                        {isSelected && <Check className="w-3.5 h-3.5 text-purple-600 stroke-[3]" />}
                      </div>
                      <div>
                        <div className={`text-xs font-extrabold ${isSelected ? 'text-purple-900' : 'text-slate-800'}`}>
                          {preset.label}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium truncate">
                          {preset.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Style & Canvas Tuning */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
              <div className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>스타일 및 여백 조절</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Aspect Ratio */}
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">화면 비율</label>
                  <div className="grid grid-cols-3 gap-1 bg-white p-1 rounded-xl border border-slate-200">
                    {(['9:16', '1:1', '4:5'] as CollageAspectRatio[]).map((ratio) => (
                      <button
                        key={ratio}
                        type="button"
                        onClick={() => setAspectRatio(ratio)}
                        className={`py-1 text-center rounded-lg text-[10px] font-extrabold transition cursor-pointer ${
                          aspectRatio === ratio
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {ratio === '9:16' ? '9:16 쇼츠' : ratio}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Gap Slider */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-bold text-slate-600">외곽/사진 여백</label>
                    <span className="text-[10px] font-bold text-indigo-600">{gap}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="24"
                    step="2"
                    value={gap}
                    onChange={(e) => setGap(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>

                {/* Border Radius Slider */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-bold text-slate-600">모서리 곡률</label>
                    <span className="text-[10px] font-bold text-indigo-600">{borderRadius}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    step="2"
                    value={borderRadius}
                    onChange={(e) => setBorderRadius(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>
              </div>

              {/* Background Color Picker */}
              {gap > 0 && (
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1.5">여백/배경 색상</label>
                  <div className="flex items-center space-x-2">
                    {BORDER_COLORS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setBorderColor(c.value)}
                        className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition cursor-pointer ${
                          borderColor === c.value
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-400'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-full border border-slate-300"
                          style={{ backgroundColor: c.value === 'transparent' ? '#cbd5e1' : c.value }}
                        />
                        <span className="text-[11px]">{c.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Text Banner Overlay (Optional) */}
              <div className="pt-2 border-t border-slate-200/80">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <span>중앙 텍스트 라벨 (선택 사항)</span>
                  </label>
                  <div className="flex items-center space-x-1">
                    {(['top', 'center', 'bottom'] as const).map((pos) => (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => setBadgePosition(pos)}
                        className={`px-2 py-0.5 rounded text-[9px] font-bold cursor-pointer ${
                          badgePosition === pos ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {pos === 'top' ? '상단' : pos === 'center' ? '중앙' : '하단'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={badgeText}
                    onChange={(e) => setBadgeText(e.target.value)}
                    placeholder="예: 과거 vs 현재, 충격 반전, Before & After"
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                  {badgeText && (
                    <button
                      type="button"
                      onClick={() => setBadgeText('')}
                      className="text-xs text-slate-400 hover:text-slate-600 font-bold px-1 cursor-pointer"
                    >
                      지우기
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Interactive Canvas Preview & Controls (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-3">
            {/* Top Preview Header */}
            <div className="w-full flex items-center justify-between text-xs text-slate-400">
              <span className="font-extrabold text-white flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-purple-400" />
                <span>
                  {images.length <= 1 ? '단일 사진 미리보기' : '합성 결과 미리보기'} ({aspectRatio})
                </span>
              </span>
              <span className="text-[11px] text-purple-300 font-mono">
                {canvasDimensions.width} x {canvasDimensions.height}px
              </span>
            </div>

            {/* Cell Selection Tabs (when multiple photos) */}
            {images.length > 1 && (
              <div
                onWheel={(e) => {
                  if (e.deltaY !== 0) e.currentTarget.scrollLeft += e.deltaY;
                }}
                className="w-full flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none"
              >
                <span className="text-[11px] font-bold text-slate-400 shrink-0">편집 대상:</span>
                {images.map((item, idx) => {
                  const isSelected = selectedCellIndex === idx;
                  const tr = transforms[item.id] || { scale: 1.0, offsetX: 0, offsetY: 0 };
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedCellIndex(idx)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1 shrink-0 cursor-pointer ${
                        isSelected
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <span>사진 {idx + 1}</span>
                      <span className="text-[10px] text-purple-200 font-mono">
                        {Math.round(tr.scale * 100)}%
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Interactive Transform & Color Control Panel for Selected Image */}
            {currentSelectedImage && (
              <div className="w-full bg-slate-900 rounded-xl p-3 border border-slate-800 space-y-2.5 shadow-sm">
                {/* Header: Mode Tabs & Reset */}
                <div className="flex items-center justify-between text-slate-300">
                  <div className="flex items-center space-x-1 p-0.5 bg-slate-950/80 rounded-lg border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setEditorTab('transform')}
                      className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                        editorTab === 'transform'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Move className="w-3 h-3" />
                      <span>위치 / 크기</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorTab('color')}
                      className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                        editorTab === 'color'
                          ? 'bg-gradient-to-r from-amber-500 to-purple-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Palette className="w-3 h-3" />
                      <span>밝기 / 색감</span>
                      {isColorAdjusted && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-300 ml-0.5" />
                      )}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={editorTab === 'transform' ? handleResetCurrentTransform : handleResetColorTransform}
                    className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 font-bold transition cursor-pointer px-2 py-1 rounded hover:bg-slate-800"
                    title={editorTab === 'transform' ? '크기 및 위치 초기화' : '밝기 및 색감 초기화'}
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>{editorTab === 'transform' ? '위치 초기화' : '색감 초기화'}</span>
                  </button>
                </div>

                {/* TAB 1: Transform (Scale & Pan) */}
                {editorTab === 'transform' && (
                  <div className="space-y-2">
                    {/* Zoom Scale Slider & Buttons */}
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] text-slate-400 font-bold shrink-0">크기 (확대/축소):</span>
                      <button
                        type="button"
                        onClick={() => handleStepZoom(-0.1)}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
                        title="축소"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="range"
                        min="0.5"
                        max="3.5"
                        step="0.05"
                        value={currentTransform.scale}
                        onChange={(e) => handleScaleChange(Number(e.target.value))}
                        className="flex-1 accent-purple-500 cursor-pointer h-1.5"
                      />
                      <button
                        type="button"
                        onClick={() => handleStepZoom(0.1)}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
                        title="확대"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[11px] font-mono font-bold text-purple-300 w-12 text-right">
                        {Math.round(currentTransform.scale * 100)}%
                      </span>
                    </div>

                    {/* Direction Nudge Buttons & Drag Hint */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                        <Hand className="w-3 h-3 text-purple-400" />
                        <span>마우스 드래그로 즉시 이동</span>
                      </span>

                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => handleNudge(-30, 0)}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold transition cursor-pointer"
                          title="왼쪽으로 이동"
                        >
                          ←
                        </button>
                        <button
                          type="button"
                          onClick={() => handleNudge(0, -30)}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold transition cursor-pointer"
                          title="위로 이동"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => handleNudge(0, 30)}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold transition cursor-pointer"
                          title="아래로 이동"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => handleNudge(30, 0)}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold transition cursor-pointer"
                          title="오른쪽으로 이동"
                        >
                          →
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: Color Tone, Brightness, Contrast & Saturation */}
                {editorTab === 'color' && (
                  <div className="space-y-2.5">
                    {/* Preset Chips (Supports PC Drag-Scroll, Mouse Wheel & Click Arrows) */}
                    <div className="relative flex items-center">
                      <button
                        type="button"
                        onClick={() => scrollPresets('left')}
                        className="p-1 rounded-md bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white transition shadow-xs shrink-0 cursor-pointer mr-1 z-10"
                        title="이전 프리셋 보기"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>

                      <div
                        ref={presetsScrollRef}
                        onWheel={(e) => {
                          if (e.deltaY !== 0) {
                            e.currentTarget.scrollLeft += e.deltaY;
                          }
                        }}
                        onMouseDown={handlePresetMouseDown}
                        onMouseMove={handlePresetMouseMove}
                        onMouseUp={handlePresetMouseUp}
                        onMouseLeave={handlePresetMouseUp}
                        className={`flex-1 flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none select-none ${
                          isPresetDragging ? 'cursor-grabbing' : 'cursor-grab'
                        }`}
                      >
                        {COLOR_PRESETS.map((preset) => {
                          const isActive = (currentTransform.filterPreset || 'none') === preset.id;
                          return (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={(e) => {
                                if (hasMovedPresetDrag.current) {
                                  e.preventDefault();
                                  return;
                                }
                                handleFilterPresetSelect(preset.id);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center space-x-1 shrink-0 cursor-pointer ${
                                isActive
                                  ? 'bg-gradient-to-r from-amber-500 to-purple-600 text-white shadow-xs ring-1 ring-amber-300'
                                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                              }`}
                              title={preset.desc}
                            >
                              <span>{preset.emoji}</span>
                              <span>{preset.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      <button
                        type="button"
                        onClick={() => scrollPresets('right')}
                        className="p-1 rounded-md bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white transition shadow-xs shrink-0 cursor-pointer ml-1 z-10"
                        title="다음 프리셋 보기"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Brightness, Contrast & Saturation Sliders */}
                    <div className="space-y-1.5 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                      {/* Brightness */}
                      <div className="flex items-center space-x-2 text-xs">
                        <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1 w-14 shrink-0">
                          <Sun className="w-3 h-3 text-amber-400" />
                          <span>밝기</span>
                        </span>
                        <input
                          type="range"
                          min="50"
                          max="150"
                          step="2"
                          value={currentTransform.brightness}
                          onChange={(e) => handleBrightnessChange(Number(e.target.value))}
                          className="flex-1 accent-amber-500 cursor-pointer h-1.5"
                        />
                        <span className="text-[10px] font-mono font-bold text-amber-300 w-10 text-right">
                          {currentTransform.brightness}%
                        </span>
                      </div>

                      {/* Contrast */}
                      <div className="flex items-center space-x-2 text-xs">
                        <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1 w-14 shrink-0">
                          <Contrast className="w-3 h-3 text-indigo-400" />
                          <span>대비</span>
                        </span>
                        <input
                          type="range"
                          min="50"
                          max="150"
                          step="2"
                          value={currentTransform.contrast}
                          onChange={(e) => handleContrastChange(Number(e.target.value))}
                          className="flex-1 accent-indigo-500 cursor-pointer h-1.5"
                        />
                        <span className="text-[10px] font-mono font-bold text-indigo-300 w-10 text-right">
                          {currentTransform.contrast}%
                        </span>
                      </div>

                      {/* Saturation */}
                      <div className="flex items-center space-x-2 text-xs">
                        <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1 w-14 shrink-0">
                          <Palette className="w-3 h-3 text-rose-400" />
                          <span>채도</span>
                        </span>
                        <input
                          type="range"
                          min="0"
                          max="200"
                          step="5"
                          value={currentTransform.saturate}
                          onChange={(e) => handleSaturateChange(Number(e.target.value))}
                          className="flex-1 accent-rose-500 cursor-pointer h-1.5"
                        />
                        <span className="text-[10px] font-mono font-bold text-rose-300 w-10 text-right">
                          {currentTransform.saturate}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Interactive Canvas Container with Drag & Wheel support */}
            <div className="relative w-full flex items-center justify-center flex-1 min-h-[300px] max-h-[420px] select-none">
              <canvas
                ref={canvasRef}
                onPointerDown={(e) => {
                  e.preventDefault();
                  try {
                    (e.target as HTMLElement).setPointerCapture(e.pointerId);
                  } catch {}
                  handlePointerDown(e.clientX, e.clientY);
                }}
                onPointerMove={(e) => {
                  if (isDragging) {
                    e.preventDefault();
                    handlePointerMove(e.clientX, e.clientY);
                  }
                }}
                onPointerUp={(e) => {
                  try {
                    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
                  } catch {}
                  handlePointerUp();
                }}
                onPointerCancel={(e) => {
                  try {
                    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
                  } catch {}
                  handlePointerUp();
                }}
                onWheel={handleCanvasWheel}
                className={`max-h-[400px] max-w-full rounded-xl shadow-2xl border border-slate-800 object-contain touch-none select-none ${
                  isDragging ? 'cursor-grabbing' : 'cursor-grab'
                }`}
                style={{
                  aspectRatio:
                    aspectRatio === '9:16' ? '9/16' : aspectRatio === '1:1' ? '1/1' : '4/5',
                }}
              />

              {images.length > 0 && !isDragging && (
                <div className="absolute top-2 right-2 pointer-events-none px-2 py-1 rounded-md bg-black/70 text-slate-300 text-[10px] font-medium flex items-center gap-1 backdrop-blur-xs">
                  <Hand className="w-3 h-3 text-purple-400" />
                  <span>마우스 드래그로 이동 / 휠로 확대</span>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="w-full space-y-2 pt-2 border-t border-slate-800/80">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={images.length === 0}
                  className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-bold text-xs transition border border-slate-700 cursor-pointer"
                  title="편집된 이미지 파일 다운로드"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>이미지 다운로드</span>
                </button>

                <button
                  type="button"
                  onClick={handleApply}
                  disabled={images.length === 0 || isProcessing}
                  className="flex-[2] flex items-center justify-center space-x-1.5 py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white font-black text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>
                    {images.length <= 1
                      ? `씬 ${sceneNumber}에 사진 적용하기`
                      : `씬 ${sceneNumber}에 합성 사진 적용하기`}
                  </span>
                </button>
              </div>

              <p className="text-[10px] text-slate-400 text-center font-medium">
                조정한 위치와 크기가 그대로 1080x1920 단일 쇼츠 이미지로 렌더링되어 적용됩니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
